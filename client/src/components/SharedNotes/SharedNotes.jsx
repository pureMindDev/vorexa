import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { getSharedNotes, createSharedNote, updateSharedNote, deleteSharedNote } from '../../services/collabService';
import styles from './SharedNotes.module.scss';

const SAVE_DEBOUNCE_MS = 800;

const SharedNotes = ({ groupId }) => {
  const { socket } = useSocket();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [content, setContent] = useState('');
  const [savingLabel, setSavingLabel] = useState('');
  const [error, setError] = useState('');
  const saveTimeoutRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getSharedNotes(groupId);
      setNotes(data.notes);
      if (!activeId && data.notes.length > 0) {
        setActiveId(data.notes[0]._id);
        setContent(data.notes[0].content);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notes.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates from other members editing the same note.
  useEffect(() => {
    if (!socket) return;

    const handleUpdated = ({ note }) => {
      setNotes((prev) => prev.map((n) => (n._id === note._id ? note : n)));
      if (note._id === activeId) setContent(note.content); // last write wins — reflect the newest content
    };
    const handleDeleted = ({ noteId }) => {
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (noteId === activeId) {
        setActiveId(null);
        setContent('');
      }
    };

    socket.on('note:updated', handleUpdated);
    socket.on('note:deleted', handleDeleted);
    return () => {
      socket.off('note:updated', handleUpdated);
      socket.off('note:deleted', handleDeleted);
    };
  }, [socket, activeId]);

  const selectNote = (note) => {
    setActiveId(note._id);
    setContent(note.content);
  };

  const handleCreate = async () => {
    try {
      const { data } = await createSharedNote(groupId, 'Untitled note', '');
      setNotes((prev) => [data.note, ...prev]);
      selectNote(data.note);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create note.');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note for everyone in the group?')) return;
    try {
      await deleteSharedNote(groupId, noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (noteId === activeId) {
        setActiveId(null);
        setContent('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete note.');
    }
  };

  const handleContentChange = (value) => {
    setContent(value);
    setSavingLabel('Saving...');
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSharedNote(groupId, activeId, { content: value });
        setSavingLabel('Saved');
        setTimeout(() => setSavingLabel(''), 1500);
      } catch {
        setSavingLabel('');
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const activeNote = notes.find((n) => n._id === activeId);

  return (
    <div className={styles.layout}>
      <div className={styles.notesList}>
        <button className={styles.newNoteBtn} onClick={handleCreate}>
          <FiPlus size={15} /> New note
        </button>
        {notes.map((n) => (
          <div
            key={n._id}
            className={`${styles.noteItem} ${n._id === activeId ? styles['noteItem--active'] : ''}`}
            onClick={() => selectNote(n)}
          >
            <span className={styles.noteTitle}>{n.title}</span>
            <FiTrash2
              size={13}
              className={styles.deleteIcon}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(n._id);
              }}
            />
          </div>
        ))}
        {notes.length === 0 && <p className={styles.emptyHint}>No shared notes yet.</p>}
      </div>

      <div className={styles.editorCard}>
        {error && <p className={styles.errorText}>{error}</p>}
        {activeNote ? (
          <>
            <div className={styles.editorHeader}>
              <span>{activeNote.title}</span>
              <span className={styles.savingLabel}>{savingLabel}</span>
            </div>
            <textarea
              className={styles.editorTextarea}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing — everyone in the group sees updates live..."
            />
          </>
        ) : (
          <p className={styles.emptyHint}>Select a note, or create one to start collaborating.</p>
        )}
      </div>
    </div>
  );
};

export default SharedNotes;
