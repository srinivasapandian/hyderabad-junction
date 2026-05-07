import { useEffect } from 'react';
import { motion } from 'framer-motion';
import placeholderImg from '../../assets/placeholderImg.jpg';
import './ItemDetail.css';
import type { MenuItem } from '../../types';

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';
const getExtension = (mimeType = ''): string => mimeType.split('/')[1] || 'jpg';

function resolveImage(item: MenuItem): string {
  if ((item as Record<string, unknown>).img) return (item as Record<string, unknown>).img as string;
  if (item.itemImage) return `${MEDIA_CDN}/${item.itemImage}.${getExtension(item.itemType ?? '')}`;
  return placeholderImg;
}

function resolvePrice(item: MenuItem): string | null {
  if (!item.price && item.price !== 0) return null;
  if (typeof item.price === 'string' && item.price.startsWith('$')) return item.price;
  return `$${Number(item.price).toFixed(2)}`;
}

interface ItemDetailProps {
  item: MenuItem;
  onClose: () => void;
}

function ItemDetail({ item, onClose }: ItemDetailProps) {
  const heading = (item as Record<string, unknown>).name as string || (item as Record<string, unknown>).title as string || item.itemName;
  const desc = ((item as Record<string, unknown>).desc as string) || item.description;
  const img = resolveImage(item);
  const price = resolvePrice(item);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="item-detail__overlay" onClick={onClose}>
      <motion.div
        className="item-detail__panel"
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="item-detail__header">
          <button className="item-detail__back-btn" onClick={onClose} aria-label="Go back">
            <span className="item-detail__back-arrow">←</span>
            Back
          </button>
        </div>

        {/* Hero image */}
        <div className="item-detail__hero">
          <img
            src={img}
            alt={heading}
            className="item-detail__hero-img"
          />
          {!!(item as Record<string, unknown>).tag && (
            <span className="item-detail__tag">{String((item as Record<string, unknown>).tag)}</span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="item-detail__body">
          <h2 className="item-detail__name">{heading}</h2>

          {!!(item as Record<string, unknown>).subtitle && (
            <p className="item-detail__subtitle">{String((item as Record<string, unknown>).subtitle)}</p>
          )}

          <div className="item-detail__divider" />

          {desc && (
            <p className="item-detail__desc">{desc}</p>
          )}

          {price && (
            <p className="item-detail__price">{price}</p>
          )}
        </div>

        {/* CTA */}
        <div className="item-detail__footer">
          <button className="item-detail__cta">
            Add to Order →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ItemDetail;
