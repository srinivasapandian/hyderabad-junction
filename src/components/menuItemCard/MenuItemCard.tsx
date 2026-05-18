import React from 'react';
import './MenuItemCard.css';
import { getItemUnavailability } from '../../utils/menuTransformer';
import type { MenuItem } from '../../types';
import menuArchMask from '../../assets/menu-design.png';
import fallbackImg from '../../assets/placeHolderMedia.jpg';

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';

const getExtension = (mimeType = ''): string => mimeType.split('/')[1] || 'jpg';

const getImageUrl = (itemImage: string | null, itemType: string | null): string | null => {
  if (itemImage) return `${MEDIA_CDN}/${itemImage}.${getExtension(itemType ?? '')}`;
  return null;
};

const parsePrice = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '') return null;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

interface MenuItemCardProps {
  item: MenuItem;
  categorySlug?: string;
}

function MenuItemCard({ item }: MenuItemCardProps) {
  const { itemName, itemImage, itemType, price } = item;

  const parsedPrice = parsePrice(price);
  const imageUrl = getImageUrl(itemImage, itemType);

  const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } =
    getItemUnavailability(item);

  const showOverlay = isUnAvailableUntil || isOutOfStock || isTemporarilyUnavailable;

  const overlayLabel = isOutOfStock
    ? 'Out of Stock'
    : isUnAvailableUntil
    ? 'Coming Soon'
    : 'Temporarily Unavailable';

  const archMaskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${menuArchMask})`,
    maskImage: `url(${menuArchMask})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };

  return (
    <div className="mic-arch-outer">
      <div className="mic-arch-card" style={archMaskStyle}>

        {/* Food Image */}
        <div className="mic-arch-image-wrap">
          <img
            src={imageUrl ?? fallbackImg}
            alt={itemName}
            className="mic-arch-img"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
          />
          {showOverlay && (
            <div className="mic-arch-overlay">
              <span>{overlayLabel}</span>
            </div>
          )}
          <button className="mic-arch-heart" aria-label="Add to favourites">
            <i className="fa-regular fa-heart" />
          </button>
        </div>

        {/* Name & Price */}
        <div className="mic-arch-info">
          <span className="mic-arch-name">{itemName}</span>
          {parsedPrice !== null && (
            <span className="mic-arch-price">${parsedPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="mic-arch-spacer" />

        {/* VIEW Button */}
        <div className="mic-arch-footer">
          <button className="mic-arch-view-btn">VIEW</button>
        </div>

      </div>
    </div>
  );
}

export default MenuItemCard;
