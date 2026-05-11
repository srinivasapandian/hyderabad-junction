import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './MenuItemCard.css';
import placeholderImg from '../../assets/placeHolderMedia.jpg';
import customizationSvg from '../../assets/svg/customization.svg';
import itemNoteSvg from '../../assets/svg/item-note.svg';
import { getItemUnavailability } from '../../utils/menuTransformer';
import { addToCartAction, setLineCommentAction, updateQtyAction } from '../../redux/cart/cartReducer';
import {
  addFavouriteRequest,
  removeFavouriteRequest,
} from '../../redux/favourites/favouritesActions';
import { toSlug } from '../../utils/slugify';
import { getCustomerAppViewType, getCurrencySymbol } from '../../utils/branchConfig';
import { useIsRestaurantClosed } from '../../hooks/useRestaurantStatus';
import ItemNoteModal from '../itemNoteModal/ItemNoteModal';
import CustomizationPopup from '../customizationPopup/CustomizationPopup';
import type { MenuItem, RootState, CartLine } from '../../types';

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

function MenuItemCard({ item, categorySlug = 'menu' }: MenuItemCardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    itemName,
    price,
    description,
    itemImage,
    itemType,
  } = item;

  const itemId = String(item.id || item.itemId || '');

  const cartLines = useSelector((s: RootState) => s.cart.cartLines);
  const favouriteIds = useSelector((s: RootState) => s.favourites.ids);
  const isLoggedIn = useSelector((s: RootState) => s.auth.isLoggedIn);
  const viewType = useSelector((s: RootState) => getCustomerAppViewType(s.slug.data));
  const currencySymbol = useSelector((s: RootState) => getCurrencySymbol(s.slug.data));
  const isListView = viewType === 'LIST';

  const isRestaurantClosed = useIsRestaurantClosed();

  const isFavourite = favouriteIds.includes(itemId);
  const allCartLines = cartLines.filter((l) => l.itemId === itemId);
  const firstCartLine = allCartLines[0] ?? null;
  const qty = allCartLines.reduce((sum, l) => sum + l.qty, 0);
  const lineId = firstCartLine?.lineId ?? itemId;
  const comment = firstCartLine?.comment ?? '';
  const hasNote = comment.trim().length > 0;

  const [noteOpen, setNoteOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const openNoteModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteOpen(true);
  };
  const closeNoteModal = () => setNoteOpen(false);
  const saveNote = (next: string) => dispatch(setLineCommentAction(lineId, next));

  const imageUrl = getImageUrl(itemImage, itemType);
  const safePrice = parsePrice(price) ?? 0;

  const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } =
    getItemUnavailability(item);

  let overlayIcon: React.ReactNode = null;
  let overlayLabel: string | null = null;
  let overlayTime: string | false | null = null;

  if (isUnAvailableUntil) {
    overlayIcon = <i className="fa-regular fa-clock mic-unavail-icon" />;
    overlayLabel = 'Will be available at';
    overlayTime = isUnAvailableUntil;
  } else if (isOutOfStock) {
    overlayIcon = <i className="fa-solid fa-ban mic-unavail-icon" />;
    overlayLabel = 'Out of Stock';
  } else if (isTemporarilyUnavailable) {
    overlayIcon = <i className="fa-solid fa-circle-xmark mic-unavail-icon" />;
    overlayLabel = 'Temporarily Unavailable';
  }

  const showOverlay = !!overlayLabel;
  const hasModifiers = Array.isArray(item.customization) && item.customization.length > 0;

  const itemSlug = toSlug(itemName);
  const itemDetailPath = `/indian-restaurant-menu/${categorySlug}/${itemSlug}`;

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
      className={`mic-card-premium ${showOverlay ? 'mic-unavailable' : ''}`}
      onClick={handleCardClick}
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

        {/* Favorite Icon on Image */}
        {!showOverlay && (
          <button
            className={`mic-fav-btn ${isFavourite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoggedIn) return;
              if (isFavourite) dispatch(removeFavouriteRequest(itemId));
              else dispatch(addFavouriteRequest(itemId, item));
            }}
          >
            <i className={isFavourite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          </button>
        )}
      </div>

      {/* RIGHT: Content Section */}
      <div className="mic-right-content">
        <div className="mic-content-top">
          <div className="mic-name-price">
            <h3 className="mic-item-name">{itemName}</h3>
            <span className="mic-item-price">
              <span className="mic-currency">{currencySymbol}</span>
              {safePrice.toFixed(2)}
            </span>
          </div>

          {description && (
            <p className="mic-item-desc">{description}</p>
          )}
        </div>

        <div className="mic-content-bottom" onClick={(e) => e.stopPropagation()}>
          <div className="mic-icons-group">
            {hasModifiers && (
              <button
                className="mic-action-icon-btn"
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                title="Customize"
              >
                <img src={customizationSvg} alt="Customize" />
              </button>
            )}

            {qty > 0 && (
              <button
                className="mic-action-icon-btn"
                onClick={(e) => { e.stopPropagation(); openNoteModal(e); }}
                title="Add Note"
              >
                <img src={itemNoteSvg} alt="Note" />
                {hasNote && <span className="mic-note-dot" />}
              </button>
            )}
          </div>

          <div className="mic-qty-section">
            {!isRestaurantClosed ? (
              qty === 0 ? (
                <button className="mic-add-btn-premium" onClick={handleAddClick}>
                  <i className="fa-solid fa-cart-plus" />
                </button>
              ) : (
                <div className="mic-qty-ctrl-premium">
                  <button className="mic-qty-btn" onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, -1)); }}>−</button>
                  <span className="mic-qty-count">{qty}</span>
                  <button className="mic-qty-btn" onClick={(e) => { e.stopPropagation(); hasModifiers ? setPopupOpen(true) : dispatch(updateQtyAction(lineId, 1)); }}>+</button>
                </div>
              )
            ) : (
              <button className="mic-view-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>VIEW</button>
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

export default MenuItemCard;
