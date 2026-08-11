import api from './api';

export const sendChatMessage = (message, subject, conversationId) =>
  api.post('/ai/chat', { message, subject, conversationId });

export const sendChatMessageWithAttachment = (message, subject, file, conversationId) => {
  const formData = new FormData();
  formData.append('message', message || '');
  if (subject) formData.append('subject', subject);
  if (conversationId) formData.append('conversationId', conversationId);
  formData.append('attachment', file);
  return api.post('/ai/chat', formData);
};

// Streams the reply as newline-delimited JSON chunks rather than using the axios instance,
// since axios doesn't expose a readable stream for the response body in the browser.
// onChunk(text) fires as each piece of text arrives; onDone/onMeta/onError fire once each.
export const streamChatMessage = async (message, subject, conversationId, { onMeta, onChunk, onDone, onError, signal }) => {
  const baseURL = api.defaults.baseURL || '/api';
  const token = localStorage.getItem('vorexa-token');

  let response;
  try {
    response = await fetch(`${baseURL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, subject, conversationId }),
      signal,
    });
  } catch (err) {
    onError?.(err);
    return;
  }

  if (!response.ok || !response.body) {
    let message = 'Could not reach the AI Tutor.';
    try {
      const errJson = await response.json();
      message = errJson.message || message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    onError?.(new Error(message));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // last entry may be a partial line — hold it for the next read

    for (const line of lines) {
      if (!line.trim()) continue;
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        continue; // skip any malformed line rather than crashing the stream
      }

      if (event.type === 'meta') onMeta?.(event);
      else if (event.type === 'chunk') onChunk?.(event.text);
      else if (event.type === 'error') onError?.(new Error(event.message));
      else if (event.type === 'done') onDone?.(event);
    }
  }
};

export const getConversations = () => api.get('/ai/conversations');

export const getConversationById = (id) => api.get(`/ai/conversations/${id}`);

export const deleteConversation = (id) => api.delete(`/ai/conversations/${id}`);

export const generateQuiz = (topic, subject, count) =>
  api.post('/ai/quiz', { topic, subject, count });

export const generateFlashcards = (topic, subject, count) =>
  api.post('/ai/flashcards', { topic, subject, count });

export const summarizeNotes = (text) => api.post('/ai/summarize', { text });

export const getEssayFeedback = (essay, subject) => api.post('/ai/essay-feedback', { essay, subject });

export const generateRevisionPlan = (daysUntilExam) => api.post('/ai/revision-plan', { daysUntilExam });
