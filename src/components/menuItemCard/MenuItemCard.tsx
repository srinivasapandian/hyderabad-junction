import React from 'react';
import './MenuItemCard.css';
import { getItemUnavailability } from '../../utils/menuTransformer';
import type { MenuItem } from '../../types';
import placeholderImg from '../../assets/placeHolderMedia.jpg';

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
  const {
    itemName,
    description,
    itemImage,
    itemType,
    price,
  } = item;

  const parsedPrice = parsePrice(price);

  const imageUrl = getImageUrl(itemImage, itemType);

  const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } =
    getItemUnavailability(item);

  let overlayIcon: React.ReactNode = null;
  let overlayLabel: string | null = null;

  if (isUnAvailableUntil) {
    overlayIcon = <i className="fa-regular fa-clock mic-unavail-icon" />;
    overlayLabel = 'Will be available at';
  } else if (isOutOfStock) {
    overlayIcon = <i className="fa-solid fa-ban mic-unavail-icon" />;
    overlayLabel = 'Out of Stock';
  } else if (isTemporarilyUnavailable) {
    overlayIcon = <i className="fa-solid fa-circle-xmark mic-unavail-icon" />;
    overlayLabel = 'Temporarily Unavailable';
  }

  const showOverlay = !!overlayLabel;

  return (
    <div
      className={`mic-card-premium ${showOverlay ? 'mic-unavailable' : ''}`}
    >
      {/* LEFT: Image Section */}
      <div className="mic-left-img">
        <img
          src={imageUrl || placeholderImg}
          alt={itemName}
          className="mic-main-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg; }}
        />
        {showOverlay && (
          <div className="mic-overlay">
            {overlayIcon}
            <span>{overlayLabel}</span>
          </div>
        )}
      </div>

      {/* RIGHT: Content Section */}
      <div className="mic-right-content">
        <div className="mic-content-top">
          <div className="mic-name-price">
            <h3 className="mic-item-name">{itemName}</h3>
            {parsedPrice !== null && (
              <span className="mic-item-price">
                <span className="mic-currency">$</span>{parsedPrice.toFixed(2)}
              </span>
            )}
          </div>

          {description && (
            <p className="mic-item-desc">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuItemCard;
