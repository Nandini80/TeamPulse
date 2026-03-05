import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchComments, searchComments, getSnippetWithHighlight, type Comment } from '../../api/commentsApi';
import './SearchOverlay.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const commentsCacheRef = useRef<Comment[] | null>(null);

  const results = query.trim()
    ? searchComments(comments, query)
    : [];
  const totalResults = results.length;

  // Load comments when overlay opens
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    setError(null);
    if (commentsCacheRef.current) {
      setComments(commentsCacheRef.current);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchComments()
      .then((data) => {
        commentsCacheRef.current = data;
        setComments(data);
      })
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keyboard: Escape close, Arrow keys navigate
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!results.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results.length]);

  // Scroll active item into view
  useEffect(() => {
    if (results.length === 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-result-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex, results.length]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const clearQuery = () => {
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search comments"
    >
      <div className="search-overlay__backdrop" onClick={handleBackdropClick} />
      <div className="search-overlay__panel">
        <div className="search-overlay__bar">
          <span className="search-overlay__icon" aria-hidden>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-overlay__input"
            placeholder="Search comments..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            aria-label="Search comments"
          />
          {query && (
            <button
              type="button"
              className="search-overlay__clear"
              onClick={clearQuery}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-overlay__esc"
            onClick={onClose}
            aria-label="Close (Escape)"
          >
            Esc
          </button>
        </div>

        <div className="search-overlay__results-wrap">
          {loading && (
            <div className="search-overlay__loading">Loading comments…</div>
          )}
          {error && (
            <div className="search-overlay__error">{error}</div>
          )}
          {!loading && !error && (
            <>
              {query.trim() && (
                <div className="search-overlay__count">
                  {totalResults} {totalResults === 1 ? 'RESULT' : 'RESULTS'}
                </div>
              )}
              <div className="search-overlay__list" ref={listRef}>
                {results.map((comment, idx) => {
                  const snippet = getSnippetWithHighlight(comment.body, query);
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={comment.id}
                      data-result-index={idx}
                      className={`search-overlay__result ${isActive ? 'search-overlay__result--active' : ''}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className="search-overlay__result-title">{comment.name}</div>
                      <div className="search-overlay__result-meta">{comment.email}</div>
                      <div className="search-overlay__result-snippet">
                        {snippet.parts.map((part, i) =>
                          part.highlight ? (
                            <mark key={i} className="search-overlay__highlight">{part.text}</mark>
                          ) : (
                            <span key={i}>{part.text}</span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {query.trim() && !loading && results.length === 0 && (
                <div className="search-overlay__empty">No comments match “{query}”</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
