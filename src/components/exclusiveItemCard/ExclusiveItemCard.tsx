import React from 'react';
import './ExclusiveItemCard.css';
import type { MenuItem } from '../../types';

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';

const getExtension = (mimeType = ''): string => mimeType.split('/')[1] || 'jpg';

const getImageUrl = (itemImage: string | null, itemType: string | null): string | null => {
  if (itemImage) return `${MEDIA_CDN}/${itemImage}.${getExtension(itemType ?? '')}`;
  return null;
};

interface ExclusiveItemCardProps {
  item: MenuItem;
}

function ExclusiveItemCard({ item }: ExclusiveItemCardProps) {
  const { itemName, description, itemImage, itemType } = item;
  const imageUrl = getImageUrl(itemImage, itemType);

  return (
    <div className="eic-card">
      {/* ── Left: Image Section ── */}
      {imageUrl && (
        <div className="eic-img-box">
          <img
            src={imageUrl}
            alt={itemName}
            className="eic-img"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* ── Right: Content Section ── */}
      <div className="eic-content">
        <div className="eic-top-info">
          <div className="eic-name-desc-group">
            <h3 className="eic-name">{itemName}</h3>
            {description && <p className="eic-desc">{description}</p>}
          </div>
        </div>

        <div className="eic-bottom-row">
        </div>
      </div>
    </div>
  );
}

export default ExclusiveItemCard;
