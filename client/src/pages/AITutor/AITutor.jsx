import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSend, FiMessageCircle, FiPaperclip, FiX, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import {
  sendChatMessageWithAttachment, streamChatMessage,
  getConversations, getConversationById, deleteConversation,
} from '../../services/aiService';
import styles from './AITutor.module.scss';

const SUGGESTIONS = [
  'Explain photosynthesis simply',
  'Help me with quadratic equations',
  "What's the difference between mitosis and meiosis?",
  'Give me a WAEC essay tip',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const AITutor = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState(null);
  const [attachError, setAttachError] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadConversationList = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.conversations);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadConversationList();
  }, []);

  useEffect(() => {
    const loadThisConversation = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }
      setLoadingConvo(true);
      try {
        const { data } = await getConversationById(conversationId);
        setMessages(
          data.conversation.messages.map((m) => ({
            role: m.role,
            content: m.content,
            attachmentName: m.attachmentName,
          }))
        );
      } catch {
        setMessages([]);
      } finally {
        setLoadingConvo(false);
      }
    };
    loadThisConversation();
  }, [conversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAttachError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachError('Only images (JPEG, PNG, WEBP, HEIC) and PDF files are supported');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAttachError('That file is too large — the limit is 10MB');
      return;
    }

    setAttachedFile(file);
    setAttachedPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const clearAttachment = () => {
    if (attachedPreviewUrl) URL.revokeObjectURL(attachedPreviewUrl);
    setAttachedFile(null);
    setAttachedPreviewUrl(null);
    setAttachError('');
  };

  const handleNewChat = () => {
    navigate('/ai-tutor');
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (id === conversationId) navigate('/ai-tutor');
    } catch {
      // silent
    }
  };

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content && !attachedFile) return;
    if (sending) return;

    const userMessage = {
      role: 'user',
      content,
      attachmentName: attachedFile?.name,
      attachmentPreview: attachedPreviewUrl,
      attachmentIsImage: attachedFile?.type.startsWith('image/'),
    };
    setMessages((prev) => [...prev, userMessage]);

    const fileToSend = attachedFile;
    setInput('');
    clearAttachment();
    setSending(true);

    // Attachments still go through the non-streaming endpoint — multimodal + streaming together
    // isn't worth the complexity for what's a rare case.
    if (fileToSend) {
      try {
        const { data } = await sendChatMessageWithAttachment(content, null, fileToSend, conversationId);
        setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
        if (!conversationId) navigate(`/ai-tutor/${data.conversationId}`, { replace: true });
        loadConversationList();
      } catch (err) {
        const backendMessage = err.response?.data?.message;
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: backendMessage || "Couldn't reach the AI Tutor right now. Check your connection and try again." },
        ]);
      } finally {
        setSending(false);
      }
      return;
    }

    // Streaming path — a placeholder AI message fills in token-by-token as chunks arrive.
    setMessages((prev) => [...prev, { role: 'ai', content: '', streaming: true }]);
    let newConversationId = null;

    await streamChatMessage(content, null, conversationId, {
      onMeta: ({ conversationId: id }) => {
        newConversationId = id;
      },
      onChunk: (piece) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + piece };
          return next;
        });
      },
      onDone: () => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], streaming: false };
          return next;
        });
        if (!conversationId && newConversationId) {
          navigate(`/ai-tutor/${newConversationId}`, { replace: true });
        }
        loadConversationList();
        setSending(false);
      },
      onError: (err) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'ai',
            content: err.message || "Couldn't reach the AI Tutor right now. Check your connection and try again.",
            streaming: false,
          };
          return next;
        });
        setSending(false);
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.historySidebar}>
        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <FiPlus size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          New chat
        </button>
        <div className={styles.historyList}>
          {conversations.map((c) => (
            <div
              key={c._id}
              className={`${styles.historyItem} ${c._id === conversationId ? styles['historyItem--active'] : ''}`}
              onClick={() => navigate(`/ai-tutor/${c._id}`)}
            >
              <span className={styles.historyTitle}>{c.title}</span>
              <button className={styles.historyDeleteBtn} onClick={(e) => handleDeleteConversation(c._id, e)} aria-label="Delete chat">
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>AI Tutor</h1>
          <p className={styles.subtitle}>Ask anything, or attach a photo of your homework or textbook page.</p>
        </div>

        <div className={styles.chatArea}>
          {loadingConvo ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading chat...</p>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <FiMessageCircle size={32} />
              <p>Ask your first question, or attach a photo to get started.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <div key={s} className={styles.suggestionChip} onClick={() => handleSend(s)}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`${styles.message} ${styles[`message--${m.role}`]}`}>
                  {m.attachmentPreview && (
                    <img src={m.attachmentPreview} alt="Attachment" className={styles.attachmentImage} />
                  )}
                  {m.attachmentName && !m.attachmentIsImage && (
                    <div className={styles.attachmentFileChip}>
                      <FiFileText size={13} /> {m.attachmentName}
                    </div>
                  )}
                  {m.role === 'ai' ? (
                    m.streaming && !m.content ? (
                      <span className={styles.typingInline}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </span>
                    ) : (
                      <div className={styles.markdown}>
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    m.content
                  )}
                </div>
              ))}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {attachError && <p className={styles.attachError}>{attachError}</p>}

        {attachedFile && (
          <div className={styles.attachPreviewBar}>
            {attachedPreviewUrl ? (
              <img src={attachedPreviewUrl} alt="Preview" className={styles.attachPreviewThumb} />
            ) : (
              <FiFileText size={18} />
            )}
            <span className={styles.attachPreviewName}>{attachedFile.name}</span>
            <button className={styles.attachRemoveBtn} onClick={clearAttachment} aria-label="Remove attachment">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className={styles.inputBar}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} aria-label="Attach file" type="button">
            <FiPaperclip size={18} />
          </button>
          <input
            className={styles.input}
            placeholder={attachedFile ? 'Add a message (optional)...' : 'Ask your AI tutor anything...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.sendBtn} onClick={() => handleSend()} disabled={sending || (!input.trim() && !attachedFile)}>
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
