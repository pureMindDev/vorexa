import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight, FiRotateCw } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { getSharedDecks, createSharedDeck, addSharedCard, removeSharedCard } from '../../services/collabService';
import styles from './SharedFlashcards.module.scss';

const SharedFlashcards = ({ groupId }) => {
  const { socket } = useSocket();
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getSharedDecks(groupId);
      setDecks(data.decks);
      if (!activeDeckId && data.decks.length > 0) setActiveDeckId(data.decks[0]._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load flashcard decks.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = ({ deckId, cards }) => {
      setDecks((prev) => prev.map((d) => (d._id === deckId ? { ...d, cards } : d)));
    };
    socket.on('deck:updated', handleUpdate);
    return () => socket.off('deck:updated', handleUpdate);
  }, [socket]);

  const activeDeck = decks.find((d) => d._id === activeDeckId);

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [activeDeckId]);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    try {
      const { data } = await createSharedDeck(groupId, newDeckTitle.trim());
      setDecks((prev) => [data.deck, ...prev]);
      setActiveDeckId(data.deck._id);
      setNewDeckTitle('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create deck.');
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !activeDeckId) return;
    try {
      const { data } = await addSharedCard(groupId, activeDeckId, front.trim(), back.trim());
      setDecks((prev) => prev.map((d) => (d._id === activeDeckId ? data.deck : d)));
      setFront('');
      setBack('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add card.');
    }
  };

  const handleRemoveCard = async (cardId) => {
    try {
      const { data } = await removeSharedCard(groupId, activeDeckId, cardId);
      setDecks((prev) => prev.map((d) => (d._id === activeDeckId ? data.deck : d)));
      setCardIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove card.');
    }
  };

  const currentCard = activeDeck?.cards?.[cardIndex];

  const goNext = () => {
    if (!activeDeck) return;
    setFlipped(false);
    setCardIndex((i) => (i + 1) % activeDeck.cards.length);
  };
  const goPrev = () => {
    if (!activeDeck) return;
    setFlipped(false);
    setCardIndex((i) => (i - 1 + activeDeck.cards.length) % activeDeck.cards.length);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.deckList}>
        <form onSubmit={handleCreateDeck} className={styles.newDeckForm}>
          <input
            className={styles.newDeckInput}
            placeholder="New deck title..."
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
          />
          <button className={styles.newDeckBtn} type="submit" disabled={!newDeckTitle.trim()}>
            <FiPlus size={15} />
          </button>
        </form>
        {decks.map((d) => (
          <div
            key={d._id}
            className={`${styles.deckItem} ${d._id === activeDeckId ? styles['deckItem--active'] : ''}`}
            onClick={() => setActiveDeckId(d._id)}
          >
            {d.title} <span className={styles.deckCount}>{d.cards.length}</span>
          </div>
        ))}
        {decks.length === 0 && <p className={styles.emptyHint}>No decks yet.</p>}
      </div>

      <div className={styles.studyCard}>
        {error && <p className={styles.errorText}>{error}</p>}
        {!activeDeck ? (
          <p className={styles.emptyHint}>Create a deck to start studying together.</p>
        ) : (
          <>
            <div className={styles.deckTitle}>{activeDeck.title}</div>

            {currentCard ? (
              <>
                <div className={styles.flashcard} onClick={() => setFlipped((f) => !f)}>
                  <span className={styles.flashcardFace}>{flipped ? currentCard.back : currentCard.front}</span>
                  <FiRotateCw size={13} className={styles.flipHint} />
                </div>
                <div className={styles.cardNav}>
                  <button className={styles.navBtn} onClick={goPrev}>
                    <FiChevronLeft size={18} />
                  </button>
                  <span className={styles.cardCounter}>
                    {cardIndex + 1} / {activeDeck.cards.length}
                  </span>
                  <button className={styles.navBtn} onClick={goNext}>
                    <FiChevronRight size={18} />
                  </button>
                  <button className={styles.removeCardBtn} onClick={() => handleRemoveCard(currentCard._id)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.emptyHint}>No cards yet — add the first one below.</p>
            )}

            <form className={styles.addCardForm} onSubmit={handleAddCard}>
              <input
                className={styles.addCardInput}
                placeholder="Front (question/term)"
                value={front}
                onChange={(e) => setFront(e.target.value)}
              />
              <input
                className={styles.addCardInput}
                placeholder="Back (answer/definition)"
                value={back}
                onChange={(e) => setBack(e.target.value)}
              />
              <button className={styles.addCardBtn} type="submit" disabled={!front.trim() || !back.trim()}>
                Add card
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedFlashcards;
