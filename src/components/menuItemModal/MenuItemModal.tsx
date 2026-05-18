import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './MenuItemModal.css';

interface MenuItemModalProps {
  itemName: string;
  categoryName: string;
  price: string;
  description?: string;
  imageUrl: string;
  onClose: () => void;
}

function MenuItemModal({
  itemName,
  categoryName,
  price,
  description,
  imageUrl,
  onClose,
}: MenuItemModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="mim-page">

      {/* ── Left: details ── */}
      <div className="mim-left">

        <button className="mim-back" onClick={onClose}>
          <i className="fa-solid fa-arrow-left" />
          Back to Menu
        </button>

        {categoryName && (
          <span className="mim-category">{categoryName}</span>
        )}

        {/* Name and price on the same row */}
        <div className="mim-name-price-row">
          <h2 className="mim-name">{itemName}</h2>
          {price && <p className="mim-price">{price}</p>}
        </div>

        {description && <p className="mim-desc">{description}</p>}

      </div>

      {/* ── Right: image ── */}
      <div className="mim-right">
        <img src={imageUrl} alt={itemName} className="mim-img" />
      </div>

    </div>,
    document.body,
  );
}

export default MenuItemModal;
