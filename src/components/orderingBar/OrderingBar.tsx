import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import deliveryIcon from '../../assets/svg/delivery.svg';
import placeholderImg from '../../assets/placeHolderMedia.jpg';
import './OrderingBar.css';
import type { OrderType, RootState, MenuItem } from '../../types';
import { toSlug } from '../../utils/slugify';

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';
const getExt = (mimeType = '') => mimeType.split('/')[1] || 'jpg';
const getImageUrl = (img?: string | null, type?: string | null) =>
  img ? `${MEDIA_CDN}/${img}.${getExt(type ?? '')}` : null;

interface OrderingBarProps {
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  availableNow: boolean;
  onAvailableNowChange: (checked: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hideOrderType?: boolean;
}

function OrderingBar({
  orderType,
  onOrderTypeChange,
  availableNow,
  onAvailableNowChange,
  searchQuery,
  onSearchChange,
  hideOrderType = false,
}: OrderingBarProps) {
  const navigate  = useNavigate();
  const allItems  = useSelector((s: RootState) => s.menu.data?.menu ?? []);

  const searchWrapRef  = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const suggestions: MenuItem[] = searchQuery.trim()
    ? allItems
        .filter((item) =>
          (item.itemName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 30)
    : [];

  // Open whenever the query has a value (shows empty state if no results)
  useEffect(() => {
    setOpen(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Close when clicking outside the search wrapper
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSuggestionClick = (item: MenuItem) => {
    const catSlug  = toSlug((item.categoryName ?? item.category) || 'menu');
    const itemSlug = toSlug(item.itemName);
    navigate(`/indian-restaurant-menu/${catSlug}/${itemSlug}`, { state: { item } });
    onSearchChange('');
    setOpen(false);
  };

  const handleClear = () => {
    onSearchChange('');
    setOpen(false);
  };

  return (
    <div className={`ob-wrap${hideOrderType ? ' ob-wrap-menu' : ''}`}>
      <div className="ob-inner">
        
        {/* Left: Available Items Toggle */}
        <div className="ob-avail-section">
          <span className="ob-avail-label">Available Items</span>
          <label className="ob-switch">
            <input 
              type="checkbox" 
              checked={availableNow}
              onChange={(e) => onAvailableNowChange(e.target.checked)}
            />
            <span className="ob-slider" />
          </label>
        </div>

        {/* Center: Search input */}
        <div className="ob-search-section" ref={searchWrapRef}>
          <div className="ob-search-pill">
            <i className="ob-search-icon fa-solid fa-magnifying-glass" />
            <input
              type="text"
              className="ob-search-input"
              placeholder="Search Menu"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && suggestions.length) setOpen(true);
              }}
            />
            {searchQuery && (
              <button className="ob-search-clear" onClick={handleClear} aria-label="Clear search">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {open && (
            <div className="ob-suggestions">
              {suggestions.length > 0 ? (
                suggestions.map((item) => {
                  const itemId = String(item.id ?? item.itemId ?? '');
                  const imgSrc = getImageUrl(item.itemImage, item.itemType) ?? placeholderImg;
                  return (
                    <button
                      key={itemId}
                      className="ob-suggestion-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(item)}
                    >
                      <img src={imgSrc} alt={item.itemName} className="ob-suggestion-img" />
                      <span className="ob-suggestion-name">{item.itemName}</span>
                    </button>
                  );
                })
              ) : (
                <div className="ob-suggestions-empty">
                  <i className="fa-solid fa-bowl-food ob-suggestions-empty-icon" />
                  <p className="ob-suggestions-empty-title">No results found</p>
                  <p className="ob-suggestions-empty-sub">Try a different name</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Filter Button */}
        <div className="ob-filter-section">
          <button className="ob-filter-btn" aria-label="Filter menu">
            <i className="fa-solid fa-sliders" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default OrderingBar;
