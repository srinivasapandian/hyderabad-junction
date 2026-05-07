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

        {/* Order-type toggle */}
        {!hideOrderType && (
          <div className="ob-type-group">
            <button
              className={`ob-type-btn${orderType === 'Pickup' ? ' active' : ''}`}
              onClick={() => onOrderTypeChange('Pickup')}
            >
              <i className="fa-solid fa-store" />
              Pickup
            </button>
            <button
              className={`ob-type-btn${orderType === 'Delivery' ? ' active' : ''}`}
              onClick={() => onOrderTypeChange('Delivery')}
            >
              <img src={deliveryIcon} alt="" className="ob-delivery-icon" />
              Delivery
            </button>
          </div>
        )}

        {/* Available Now toggle */}
        <div className="ob-avail-group">
          <button
            className={`ob-avail-btn${availableNow ? ' active' : ''}`}
            onClick={() => onAvailableNowChange(true)}
          >
            Available Now
          </button>
          <button
            className={`ob-avail-btn${!availableNow ? ' active' : ''}`}
            onClick={() => onAvailableNowChange(false)}
          >
            All Items
          </button>
        </div>

        {/* Search + dropdown */}
        <div className="ob-search-wrap" ref={searchWrapRef}>
          <i className="ob-search-icon fa-solid fa-magnifying-glass" />
          <input
            type="text"
            className="ob-search"
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

      </div>
    </div>
  );
}

export default OrderingBar;
