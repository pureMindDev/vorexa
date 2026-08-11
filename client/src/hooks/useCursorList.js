import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Cursor-paginated list loader with an IntersectionObserver sentinel.
 *
 * `fetchPage(cursor)` must resolve to `{ items, nextCursor }`. The hook never asks for the
 * same cursor twice and ignores responses from a stale reset (subject/filter change), so a
 * slow first page can't overwrite a newer one.
 */
export const useCursorList = (fetchPage, deps = []) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef(null);

  const load = useCallback(
    async (reset = false) => {
      if (inFlightRef.current) return;
      if (!reset && !hasMore) return;

      inFlightRef.current = true;
      const requestId = reset ? ++requestIdRef.current : requestIdRef.current;
      if (reset) {
        cursorRef.current = null;
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const { items: page, nextCursor } = await fetchPage(reset ? null : cursorRef.current);
        if (requestId !== requestIdRef.current) return; // a newer reset superseded this page
        setItems((prev) => (reset ? page : [...prev, ...page]));
        cursorRef.current = nextCursor || null;
        setHasMore(Boolean(nextCursor));
        setError('');
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err.response?.data?.message || 'Could not load more items.');
        }
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMore, ...deps]
  );

  // Initial load + reload whenever the caller's dependencies change (filter, tab, search).
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Infinite scroll: fetch the next page as the sentinel nears the viewport.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(false);
      },
      { rootMargin: '320px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, hasMore, items.length]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    error,
    hasMore,
    sentinelRef,
    loadMore: () => load(false),
    refresh: () => load(true),
  };
};

export default useCursorList;
