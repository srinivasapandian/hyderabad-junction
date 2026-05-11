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
  const itemId   = String(item.id || item.itemId || '');
  const cartLines = useSelector((s: RootState) => s.cart.cartLines);
  const allCartLines = cartLines.filter((l: CartLine) => l.itemId === itemId);
  const firstCartLine = allCartLines[0] ?? null;
  const qty     = allCartLines.reduce((sum: number, l: CartLine) => sum + l.qty, 0);
  const lineId  = firstCartLine?.lineId ?? itemId;
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
    if (hasModifiers && qty > 0) {
      setPopupOpen(true);
      return;
    }
    navigate(itemDetailPath, { state: { item } });
  };

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (hasModifiers) {
      handleCardClick();
    } else {
      dispatch(addToCartAction(item));
    }
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
      <div className="eic-img-box">
        <img
          src={imageUrl || placeholderImg}
          alt={itemName}
          className="eic-img"
          loading="lazy"
        />
        <button className="eic-wishlist-btn" onClick={(e) => e.stopPropagation()}>
          <Heart size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Right: Content Section ── */}
      <div className="eic-content">
        <div className="eic-top-info">
          <h3 className="eic-name">{itemName}</h3>
          <span className="eic-price">${Number(price).toFixed(2)}</span>
        </div>

        <div className="eic-bottom-row">
          {/* Badges — note btn hidden when closed, modifier badge stays */}
          {((!isRestaurantClosed && qty > 0) || hasModifiers) && (
            <div className="eic-badges">
              {!isRestaurantClosed && qty > 0 && (
                <button
                  type="button"
                  className="eic-note-btn"
                  onClick={openNoteModal}
                  aria-label={hasNote ? 'Edit item note' : 'Add note to this item'}
                >
                  <img src={itemNoteSvg} alt="" className="eic-note-icon" />
                  {hasNote
                    ? <span className="eic-note-indicator" aria-hidden="true" />
                    : <span className="eic-note-plus" aria-hidden="true">+</span>}
                </button>
              )}
              {hasModifiers && (
                <span className="eic-modifier-badge" aria-label="Customisable item">
                  <img src={customizationSvg} alt="" width={12} height={12} />
                </span>
              )}
            </div>
          )}

          {/* VIEW / Add / Quantity spinner */}
          <div className="eic-action-area">
            {isRestaurantClosed ? (
              <button className="eic-view-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                VIEW
              </button>
            ) : qty === 0 ? (
              <button className="eic-cart-round-btn" onClick={handleAddClick}>
                <ShoppingCart size={18} fill="white" />
                <span className="eic-plus-mini">+</span>
              </button>
            ) : (
              <div className="eic-qty-pill">
                <button
                  className="eic-qty-pill-btn"
                  onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, -1)); }}
                >
                  −
                </button>
                <span className="eic-qty-pill-count">{qty}</span>
                <button
                  className="eic-qty-pill-btn"
                  onClick={(e) => { e.stopPropagation(); hasModifiers ? setPopupOpen(true) : dispatch(updateQtyAction(lineId, 1)); }}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ItemNoteModal
        isOpen={noteOpen}
        initialValue={comment}
        itemName={itemName}
        onClose={closeNoteModal}
        onSave={saveNote}
      />

      {popupOpen && allCartLines.length > 0 && (
        <CustomizationPopup
          lines={allCartLines}
          onClose={() => setPopupOpen(false)}
          onQtyChange={(lid, delta) => {
            dispatch(updateQtyAction(lid, delta));
            const remaining = allCartLines.filter((l: CartLine) => l.lineId !== lid);
            const target = allCartLines.find((l: CartLine) => l.lineId === lid);
            if (target && target.qty + delta <= 0 && remaining.length === 0) {
              setPopupOpen(false);
            }
          }}
          onEdit={(line) => {
            setPopupOpen(false);
            const lineItem = (line as any)._item || item;
            navigate(itemDetailPath, { state: { item: lineItem, editLineId: line.lineId } });
          }}
          onNewCustomization={() => {
            setPopupOpen(false);
            navigate(itemDetailPath, { state: { item, forceNewLine: true } });
          }}
        />
      )}
    </div>
  );
}

export default ExclusiveItemCard;
