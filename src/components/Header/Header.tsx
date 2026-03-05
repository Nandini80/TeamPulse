import React, { useState, useEffect, useRef } from 'react';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import { searchMembers } from '../../api/mockApi';
import type { Member } from '../../api/mockApi';
import './Header.css';

function computeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HeaderProps {
  onNavigate: (page: string) => void;
  onSelectMemberFromSearch?: (member: Member) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSelectMemberFromSearch }) => {
  const [query, setQuery] = useState('');
  const [greeting] = useState(() => computeGreeting());
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  queryRef.current = query;

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const currentQuery = query.trim();
      searchMembers(currentQuery).then(results => {
        if (queryRef.current === currentQuery) setSearchResults(results);
      });
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__logo" onClick={() => onNavigate('dashboard')}>TeamPulse</h1>
      </div>
      <div className="header__center">
        <div className="header__search-container" ref={searchContainerRef}>
          <input
            className="header__search"
            type="text"
            placeholder="Search members..."
            value={query ?? ''}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searchResults.length > 0 && query && (
            <div className="header__search-results">
              {searchResults.map(m => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  className="header__search-result-item"
                  onClick={() => {
                    setSearchResults([]);
                    setQuery('');
                    onNavigate('dashboard');
                    onSelectMemberFromSearch?.(m);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSearchResults([]);
                      setQuery('');
                      onNavigate('dashboard');
                      onSelectMemberFromSearch?.(m);
                    }
                  }}
                >
                  <strong>{m.name}</strong>
                  <span>{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="header__right">
        <span className="header__greeting">{greeting}, John</span>
        <button
          className="header__notification-btn"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          🔔
        </button>
        {showNotifications && <NotificationDropdown />}
        <div className="header__avatar">JD</div>
      </div>
    </header>
  );
};
