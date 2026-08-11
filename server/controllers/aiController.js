const { getChatReply, streamChatReply, generateQuiz, generateFlashcards, summarizeNotes, getEssayFeedback, generateRevisionPlan } = require('../services/aiService');
const { recordActivity, XP_REWARDS, checkAndAwardBadges, incrementAiChatCount } = require('../services/gamificationService');
const { computeSubjectAccuracy } = require('../services/analyticsService');
const AIConversation = require('../models/AIConversation');

// @desc    Send a message to the AI Tutor and get a reply
// @route   POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, subject, conversationId } = req.body;

    if ((!message || !message.trim()) && !req.file) {
      return res.status(400).json({ message: 'A message or an attachment is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: 'AI Tutor is not configured yet — add GEMINI_API_KEY to the server .env file',
      });
    }

    const attachment = req.file
      ? { mimeType: req.file.mimetype, base64Data: req.file.buffer.toString('base64') }
      : undefined;

    const trimmedMessage = (message || '').trim();

    // Load or create the conversation this exchange belongs to — done before the AI call so
    // prior turns can be sent along as context, the same way a real chat assistant remembers.
    let conversation = conversationId
      ? await AIConversation.findOne({ _id: conversationId, userId: req.user._id })
      : null;

    if (!conversation) {
      const title = trimmedMessage
        ? trimmedMessage.slice(0, 60)
        : `Chat about ${req.file?.originalname || 'an attachment'}`;
      conversation = await AIConversation.create({ userId: req.user._id, title, messages: [] });
    }

    const reply = await getChatReply(trimmedMessage, subject, attachment, conversation.messages);

    conversation.messages.push({
      role: 'user',
      content: trimmedMessage,
      hasAttachment: !!req.file,
      attachmentName: req.file?.originalname || '',
    });
    conversation.messages.push({ role: 'ai', content: reply });
    await conversation.save();

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({
      reply,
      conversationId: conversation._id,
      xpEarned: XP_REWARDS.AI_CHAT,
      xp: updatedUser.xp,
      newBadges,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to the AI Tutor and stream the reply as it's generated
// @route   POST /api/ai/chat/stream
// @note    Text only — attachments go through the regular /chat endpoint since streaming a
//          multipart file upload isn't worth the complexity for what's a rare case.
const chatStream = async (req, res, next) => {
  try {
    const { message, subject, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'A message is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: 'AI Tutor is not configured yet — add GEMINI_API_KEY to the server .env file',
      });
    }

    const trimmedMessage = message.trim();

    let conversation = conversationId
      ? await AIConversation.findOne({ _id: conversationId, userId: req.user._id })
      : null;
    if (!conversation) {
      conversation = await AIConversation.create({
        userId: req.user._id,
        title: trimmedMessage.slice(0, 60),
        messages: [],
      });
    }

    // Newline-delimited JSON over a normal chunked response — simpler and more robust to
    // implement on the client than parsing real Server-Sent Events, and works fine with the
    // Authorization header a plain EventSource can't send.
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(JSON.stringify({ type: 'meta', conversationId: conversation._id }) + '\n');

    let fullReply = '';
    try {
      for await (const piece of streamChatReply(trimmedMessage, subject, conversation.messages)) {
        fullReply += piece;
        res.write(JSON.stringify({ type: 'chunk', text: piece }) + '\n');
      }
    } catch (streamError) {
      console.error('AI stream error:', streamError.message);
      res.write(JSON.stringify({ type: 'error', message: 'AI Tutor had trouble responding. Please try again.' }) + '\n');
      return res.end();
    }

    if (!fullReply.trim()) {
      fullReply = "Sorry, I couldn't generate a response. Please try again.";
      res.write(JSON.stringify({ type: 'chunk', text: fullReply }) + '\n');
    }

    conversation.messages.push({ role: 'user', content: trimmedMessage, hasAttachment: false, attachmentName: '' });
    conversation.messages.push({ role: 'ai', content: fullReply });
    await conversation.save();

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.write(
      JSON.stringify({ type: 'done', xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges }) + '\n'
    );
    res.end();
  } catch (error) {
    // Headers may already be sent if the stream started — fall back to ending the response
    // rather than calling next(error), which would try (and fail) to send a fresh JSON error.
    if (res.headersSent) {
      res.write(JSON.stringify({ type: 'error', message: 'Something went wrong.' }) + '\n');
      return res.end();
    }
    next(error);
  }
};

// @desc    List the logged-in user's AI Tutor chat history
// @route   GET /api/ai/conversations
const getConversations = async (req, res, next) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('title updatedAt');

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the full message history for one conversation
// @route   GET /api/ai/conversations/:id
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/ai/conversations/:id
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat, chatStream, quiz, flashcards, summarize, essayFeedback, revisionPlan, getConversations, getConversationById, deleteConversation };

// @desc    Generate an AI quiz on a topic
// @route   POST /api/ai/quiz
async function quiz(req, res, next) {
  try {
    const { topic, subject, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'A topic is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Study Tools are not configured yet — add GEMINI_API_KEY to the server .env file' });
    }

    const questions = await generateQuiz(topic.trim(), subject, Math.min(Math.max(parseInt(count, 10) || 5, 3), 10));

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({ questions, xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(502).json({ message: 'Could not generate a quiz right now — please try again' });
    }
    next(error);
  }
}

// @desc    Generate AI flashcards on a topic
// @route   POST /api/ai/flashcards
async function flashcards(req, res, next) {
  try {
    const { topic, subject, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'A topic is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Study Tools are not configured yet — add GEMINI_API_KEY to the server .env file' });
    }

    const cards = await generateFlashcards(topic.trim(), subject, Math.min(Math.max(parseInt(count, 10) || 8, 4), 15));

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({ cards, xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(502).json({ message: 'Could not generate flashcards right now — please try again' });
    }
    next(error);
  }
}

// @desc    Summarize a block of study notes
// @route   POST /api/ai/summarize
async function summarize(req, res, next) {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ message: 'Paste at least a few sentences of notes to summarize' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Study Tools are not configured yet — add GEMINI_API_KEY to the server .env file' });
    }

    const summary = await summarizeNotes(text.trim());

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({ summary, xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges });
  } catch (error) {
    next(error);
  }
}

// @desc    Get AI feedback on an essay
// @route   POST /api/ai/essay-feedback
async function essayFeedback(req, res, next) {
  try {
    const { essay, subject } = req.body;

    if (!essay || essay.trim().length < 50) {
      return res.status(400).json({ message: 'Paste a longer essay (at least a few sentences) to get feedback' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Study Tools are not configured yet — add GEMINI_API_KEY to the server .env file' });
    }

    const feedback = await getEssayFeedback(essay.trim(), subject);

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({ feedback, xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges });
  } catch (error) {
    next(error);
  }
}

// @desc    Generate a personalized revision timetable based on the student's subjects
//          and real weak-topic data from their CBT history
// @route   POST /api/ai/revision-plan
async function revisionPlan(req, res, next) {
  try {
    const daysUntilExam = Math.min(Math.max(parseInt(req.body.daysUntilExam, 10) || 7, 3), 21);

    if (!req.user.subjects || req.user.subjects.length === 0) {
      return res.status(400).json({ message: 'Add your subjects in onboarding/profile before generating a revision plan' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Study Tools are not configured yet — add GEMINI_API_KEY to the server .env file' });
    }

    const { subjects: weakSubjects } = await computeSubjectAccuracy(req.user._id);
    const plan = await generateRevisionPlan(req.user.subjects, weakSubjects, daysUntilExam);

    await incrementAiChatCount(req.user._id);
    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.AI_CHAT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({ plan, xpEarned: XP_REWARDS.AI_CHAT, xp: updatedUser.xp, newBadges });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(502).json({ message: 'Could not generate a revision plan right now — please try again' });
    }
    next(error);
  }
}
