const { GoogleGenAI } = require('@google/genai');

// Constructed lazily so the server doesn't crash on startup if GEMINI_API_KEY
// hasn't been set yet — the controller checks for the key before calling this.
let geminiClient = null;
const getClient = () => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
};

const SYSTEM_PROMPT = `You are Vorexa's AI Tutor — an expert, adaptive tutor helping Nigerian secondary school, UTME, and university students master their subjects for exams like JAMB, WAEC, and NECO.

Formatting:
- Use normal Markdown — headings, numbered/bulleted lists, and **bold** for key terms — it renders properly here, not as raw text.
- Use fenced code blocks (\`\`\`) for equations, chemical formulas, worked calculations, and any actual code.
- Keep responses focused and not overly long — this is a chat interface, not an essay — unless the student explicitly asks for something long-form (a full breakdown, a big table, etc).
- You have the recent messages in this conversation — use that context, don't repeat yourself or re-introduce a topic already covered.

How to teach, depending on what the student needs:

1. Explaining & adapting: Match your depth and vocabulary to what the student asks for or clearly needs — a plain "explain like I'm 5" when they're lost, full technical depth when they're clearly advanced. If they share their own explanation or working, don't just say if it's right — point out exactly which step or concept is off and why, then correct it.

2. Step-by-step problem solving: For any math, science, or logic problem, walk through it in clear sequential steps rather than jumping to the final answer. When the student is trying to solve it themselves, don't just hand them the answer — ask what they've tried or what they think the next step is, and help them verify or correct their own logic. Offer an analogy or a real-world example when it would make an abstract idea concrete, and offer extra practice questions when asked.

3. Testing & quizzing: When asked to test, quiz, or examine the student, act like a patient examiner — ask ONE question at a time, wait for their answer, then give feedback before moving to the next question. Don't dump a whole quiz in one message unless they specifically ask for a written list. You can also roleplay a scenario (an oral exam, an interview, a real-world situation) when it helps them practice applying what they know.

4. Code & technical work: When the topic is programming, SQL, or anything technical, write and explain real, correct code in fenced blocks, and actually debug what the student pastes in rather than describing the fix in the abstract. When asked, restructure messy notes into a clean Markdown table, a flashcard-style Q&A list, or a JSON structure exactly as requested.

5. Images and files: If the student attaches an image, PDF, handwritten note, chart, or diagram, actually read and analyze what's in it — transcribe it, point out errors, or explain what it shows — don't just acknowledge that a file was sent.

If asked something outside academics, gently redirect back to their studies. Note: this chat is text (and file attachments) only — there's no voice mode here, so don't imply you're listening or speaking aloud.`;

// Converts stored conversation turns into the {role, parts} shape Gemini expects, so the model
// actually remembers what was already discussed instead of treating every message in isolation.
const toGeminiHistory = (history = []) =>
  history
    .filter((m) => m.content?.trim())
    .map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] }));

const getChatReply = async (message, subject, attachment, history = []) => {
  const contextualMessage = subject
    ? `[Subject: ${subject}]\n${message}`
    : message;

  // If there's an attachment (image or PDF), send it alongside the text as a multimodal request —
  // Gemini can read text/diagrams directly from the file, so the student doesn't have to retype it.
  const currentTurnParts = attachment
    ? [
        { text: contextualMessage || 'Please look at this and help me understand it.' },
        { inlineData: { mimeType: attachment.mimeType, data: attachment.base64Data } },
      ]
    : [{ text: contextualMessage }];

  const contents = [...toGeminiHistory(history), { role: 'user', parts: currentTurnParts }];

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 3072,
    },
  });

  return response.text || "Sorry, I couldn't generate a response. Please try again.";
};

// Streaming variant — text only (no attachments), used by the live chat UI so replies
// appear incrementally instead of the student waiting for the whole answer at once.
const streamChatReply = async function* (message, subject, history = []) {
  const contextualMessage = subject ? `[Subject: ${subject}]\n${message}` : message;
  const contents = [...toGeminiHistory(history), { role: 'user', parts: [{ text: contextualMessage }] }];

  const stream = await getClient().models.generateContentStream({
    model: 'gemini-flash-latest',
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 3072,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
};

// Strips markdown code fences (```json ... ```) that models sometimes wrap JSON in,
// then parses it. Throws if the result still isn't valid JSON.
const parseJsonResponse = (text) => {
  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  return JSON.parse(cleaned);
};

const generateQuiz = async (topic, subject, count = 5) => {
  const prompt = `Generate a ${count}-question multiple-choice quiz on the topic "${topic}"${subject ? ` for the subject ${subject}` : ''}, suitable for a Nigerian secondary school / JAMB-level student.

Respond with ONLY a JSON array (no markdown, no explanation text outside the JSON) in exactly this format:
[
  {
    "question": "the question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "brief explanation of why this is correct"
  }
]
"correctAnswer" is the index (0-3) of the correct option in the "options" array. Generate exactly ${count} questions.`;

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 3072 },
  });

  return parseJsonResponse(response.text);
};

const generateFlashcards = async (topic, subject, count = 8) => {
  const prompt = `Generate ${count} flashcards on the topic "${topic}"${subject ? ` for the subject ${subject}` : ''}, suitable for a Nigerian secondary school / JAMB-level student revising for exams.

Respond with ONLY a JSON array (no markdown, no explanation text outside the JSON) in exactly this format:
[
  { "front": "a term or question", "back": "the definition or answer" }
]
Generate exactly ${count} flashcards, covering the key facts/terms/concepts a student would need to memorize for this topic.`;

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 3072 },
  });

  return parseJsonResponse(response.text);
};

const summarizeNotes = async (text) => {
  const prompt = `Summarize the following study notes for a Nigerian secondary school / JAMB-level student preparing for an exam. Write in plain text only — no Markdown, no LaTeX, no bullet symbols like * or -, use "1.", "2." for lists if needed. Keep it concise but capture every key point and fact worth remembering.

NOTES TO SUMMARIZE:
${text}`;

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  return response.text || "Sorry, I couldn't generate a summary. Please try again.";
};

const getEssayFeedback = async (essayText, subject) => {
  const prompt = `You are grading an essay written by a Nigerian secondary school / WAEC-level student${subject ? ` for ${subject}` : ''}. Give constructive feedback in plain text only — no Markdown, no LaTeX, no bullet symbols like * or -, use "1.", "2." for lists.

Cover: 1) what the essay does well, 2) grammar/structure issues to fix, 3) how to strengthen the argument or content, 4) an estimated score out of 100 with brief justification. Be encouraging but honest.

ESSAY:
${essayText}`;

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { temperature: 0.5, maxOutputTokens: 2048 },
  });

  return response.text || "Sorry, I couldn't generate feedback. Please try again.";
};

const generateRevisionPlan = async (subjects, weakSubjects, daysUntilExam) => {
  const weakList = weakSubjects.length > 0
    ? `Their weakest subjects based on real practice exam performance are: ${weakSubjects.map((s) => `${s.subject} (${s.accuracy}% accuracy)`).join(', ')}. Prioritize more time on these.`
    : 'No CBT performance data yet, so distribute time evenly across subjects.';

  const prompt = `Create a ${daysUntilExam}-day revision/study timetable for a Nigerian student preparing for JAMB/WAEC exams.

Their subjects are: ${subjects.join(', ')}.
${weakList}

Respond with ONLY a JSON array (no markdown, no explanation text outside the JSON) in exactly this format:
[
  {
    "day": 1,
    "focusSubjects": ["Subject A", "Subject B"],
    "tasks": ["specific task 1, e.g. 'Review Waves and Optics, do 20 practice questions'", "specific task 2"]
  }
]
Generate exactly ${daysUntilExam} days. Each day should have 1-2 focus subjects and 2-3 specific, actionable tasks (not vague advice). Weak subjects should appear more often across the plan than strong ones. Include short review/practice-exam days near the end if the plan is 5+ days long.`;

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { temperature: 0.6, maxOutputTokens: 4096 },
  });

  return parseJsonResponse(response.text);
};

module.exports = {
  getChatReply,
  streamChatReply,
  generateQuiz,
  generateFlashcards,
  summarizeNotes,
  getEssayFeedback,
  generateRevisionPlan,
};
