import React from 'react';
import './MenuItemCard.css';
import { getItemUnavailability } from '../../utils/menuTransformer';
import type { MenuItem } from '../../types';
import menuDesign from '../../assets/menu-design.png';
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
  const resolvedImage = imageUrl ?? fallbackImg;

  const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } =
    getItemUnavailability(item);

  const showOverlay = isUnAvailableUntil || isOutOfStock || isTemporarilyUnavailable;
  const overlayLabel = isOutOfStock
    ? 'Out of Stock'
    : isUnAvailableUntil
    ? 'Coming Soon'
    : 'Temporarily Unavailable';

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${menuDesign})`,
    maskImage: `url(${menuDesign})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };

  return (
    <div className="mic-card" style={maskStyle}>

      {/* Space for the arch dome at the top */}
      <div className="mic-top-space" />

      {/* Food image */}
      <div className="mic-img-wrap">
        <img
          src={resolvedImage}
          alt={itemName}
          className="mic-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
        />
        {showOverlay && (
          <div className="mic-overlay">
            <span>{overlayLabel}</span>
          </div>
        )}
      </div>

      {/* Name & Price */}
      <div className="mic-info">
        <span className="mic-name">{itemName}</span>
        {parsedPrice !== null && (
          <span className="mic-price">${parsedPrice.toFixed(2)}</span>
        )}
      </div>

      <div className="mic-spacer" />

      {/* VIEW button */}
      <div className="mic-footer">
        <button className="mic-view-btn">VIEW</button>
      </div>

    </div>
  );
}

export default MenuItemCard;
