import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingCart } from 'lucide-react';
import './ExclusiveItemCard.css';
import placeholderImg from '../../assets/placeHolderMedia.jpg';
import customizationSvg from '../../assets/svg/customization.svg';
import itemNoteSvg from '../../assets/svg/item-note.svg';
import { addToCartAction, setLineCommentAction, updateQtyAction } from '../../redux/cart/cartReducer';
import { useIsRestaurantClosed } from '../../hooks/useRestaurantStatus';
import ItemNoteModal from '../itemNoteModal/ItemNoteModal';
import CustomizationPopup from '../customizationPopup/CustomizationPopup';
import { toSlug } from '../../utils/slugify';
import type { MenuItem, RootState, CartLine } from '../../types';

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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { itemName, price, description, itemImage, itemType } = item;
  const itemId = String(item.id || item.itemId || '');
  const cartLines = useSelector((s: RootState) => s.cart.cartLines);
  const allCartLines = cartLines.filter((l: CartLine) => l.itemId === itemId);
  const firstCartLine = allCartLines[0] ?? null;
  const qty = allCartLines.reduce((sum: number, l: CartLine) => sum + l.qty, 0);
  const lineId = firstCartLine?.lineId ?? itemId;
  const comment = firstCartLine?.comment ?? '';
  const hasNote = comment.trim().length > 0;

  const isRestaurantClosed = useIsRestaurantClosed();

  const [noteOpen, setNoteOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const openNoteModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteOpen(true);
  };
  const closeNoteModal = () => setNoteOpen(false);
  const saveNote = (next: string) => dispatch(setLineCommentAction(lineId, next));

  const imageUrl = getImageUrl(itemImage, itemType);

  const hasModifiers = Array.isArray(item.customization) && item.customization.length > 0;

  const itemDetailPath = `/indian-restaurant-menu/todays-exclusive/${toSlug(itemName)}`;

  const handleCardClick = () => {
    navigate(itemDetailPath, { state: { item } });
  };

  return (
    <div
      className="eic-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
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
          {/* Wishlist button hidden — ordering not active */}
        </div>
      )}

      {/* ── Right: Content Section ── */}
      <div className="eic-content">
        <div className="eic-top-info">
          <div className="eic-name-desc-group">
            <h3 className="eic-name">{itemName}</h3>
            {description && <p className="eic-desc">{description}</p>}
          </div>
          {/* Price hidden — ordering not active */}
        </div>

        <div className="eic-bottom-row">
          {/* Cart controls hidden — ordering not active */}
          <div className="eic-action-area">
            <button className="eic-view-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
              VIEW
            </button>
          </div>
        </div>
      </div>

      {/* Note modal and customization popup hidden — ordering not active */}
    </div>
  );
}

export default ExclusiveItemCard;
