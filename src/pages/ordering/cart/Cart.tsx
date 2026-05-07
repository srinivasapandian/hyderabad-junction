import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import type { RootState, CartLine, SlugData, OrderTotal, OrderType } from '../../../types';
import {
  updateQtyAction,
  removeLineAction,
  clearCartAction,
  setOrderTypeAction,
  setLineCommentAction,
} from '../../../redux/cart/cartReducer';
import CustomizationPopup from '../../../components/customizationPopup/CustomizationPopup';
import { getOrderTotalsApi } from '../../../redux/totals/totalsAPI';
import { validateCartItemsRequest } from '../../../redux/cart/cartActions';
import { clearDeliveryQuote } from '../../../redux/address/addressActions';
import placeholderImg from '../../../assets/placeHolderMedia.jpg';
import cartSvg from '../../../assets/svg/cart.svg';

import itemNoteSvg from '../../../assets/svg/item-note.svg';
import { toSlug } from '../../../utils/slugify';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import PageBg from '../../../components/pageBg/PageBg';
import DeliveryIcon from '../../../components/DeliveryIcon/DeliveryIcon';
import ItemNoteModal from '../../../components/itemNoteModal/ItemNoteModal';
import ClosedBar from '../../../components/ClosedBar/ClosedBar';
import ClosingSoonBar from '../../../components/ClosingSoonBar/ClosingSoonBar';
import './Cart.css';

interface CartPageProps {
  onSignInClick?: () => void;
}

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';
const getExtension = (mimeType: string = '') => mimeType.split('/')[1] || 'jpg';
const getImageUrl = (itemImage: string | null | undefined, itemType: string | null | undefined): string | null => {
  if (itemImage) return `${MEDIA_CDN}/${itemImage}.${getExtension(itemType ?? undefined)}`;
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOrderTypeIdFromSlug = (slugData: any, typeName: string): string | undefined => {
  const orderTypes =
    slugData?.orderTypes ||
    slugData?.body?.orderTypes ||
    [];
  return orderTypes.find(
    (t: Record<string, unknown>) => (t?.typeName as string)?.toLowerCase() === typeName.toLowerCase()
  )?.id as string | undefined;
};

// ── Normalize raw customization (Shape A: flat rows | Shape B: grouped) ──────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCustomization(raw: any) {
  if (!raw || raw.length === 0) return [];

  // Shape B: first element already has .options array
  if (Array.isArray(raw[0]?.options)) {
    return raw
      .map((g: Record<string, unknown>) => ({
        ...g,
        options: ((g.options as Record<string, unknown>[]) || []).map((opt: Record<string, unknown>) => ({
          ...opt,
          optionId: opt.optionId ?? opt.modifierOptionId,
          optionAvailable: opt.optionAvailable ?? 1,
          price: Number(opt.price) || 0,
        })),
      }))
      .filter((g: Record<string, unknown>) => g.typeAvailable !== 0);
  }

  // Shape A: group by typeId
  const byType = new Map();
  for (const row of raw) {
    const tid = row.typeId;
    if (!tid) continue;
    if (!byType.has(tid)) {
      byType.set(tid, {
        typeId: tid,
        type: row.type,
        typeName: row.type,
        typeAvailable: row.typeAvailable ?? 1,
        minRequired: row.minRequired ?? 0,
        maxRequired: row.maxRequired ?? 0,
        options: [],
      });
    }
    const g = byType.get(tid);
    const oid = row.modifierOptionId || row.optionId;
    if (!oid) continue;
    g.options.push({
      optionId: oid,
      optionName: row.optionName,
      price: Number(row.price) || 0,
      optionAvailable: row.optionAvailable ?? 1,
    });
  }
  return [...byType.values()].filter((g) => g.typeAvailable !== 0 && g.options.length > 0);
}

// ── Build full options payload for a cart line ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildOptionPayload(line: any) {
  if (!line.modifiers || line.modifiers.length === 0) {
    return { options: [], modifierIds: undefined };
  }

  const groups = normalizeCustomization(line.customization);

  const options = line.modifiers.map((m: Record<string, unknown>) => {
    const group = groups.find((g: Record<string, unknown>) => g.typeId === m.typeId) || {} as Record<string, unknown>;
    const opt   = ((group.options as Record<string, unknown>[]) || []).find((o: Record<string, unknown>) => o.optionId === m.optionId) || {} as Record<string, unknown>;
    return {
      typeId:                  m.typeId,
      type:                    group.type || group.typeName || m.typeName || '',
      sortOrder:               group.sortOrder ?? 0,
      typeAvailable:           group.typeAvailable ?? 1,
      isBase:                  null,
      minRequired:             group.minRequired ?? 0,
      maxRequired:             group.maxRequired ?? 0,
      modifierOptionId:        m.optionId,
      optionName:              m.optionName,
      optionSortOrder:         opt.optionSortOrder ?? 1,
      price:                   String(Number(m.price).toFixed(2)),
      optionAvailable:         opt.optionAvailable ?? 1,
      isSpinnerEnabled:        false,
      quantity:                '1',
      singleItemOptionQuantity: 1,
    };
  });

  const modifierIds = options.map((o: Record<string, unknown>) => o.modifierOptionId).join(',');
  return { options, modifierIds };
}

// ── ReadOnlyModifiers — displays selected modifiers as non-interactive tags ──
interface ReadOnlyModifiersProps {
  modifiers?: Array<{ typeName?: string; typeId?: string; optionId: string; optionName: string; price?: number | string }>;
}

function ReadOnlyModifiers({ modifiers }: ReadOnlyModifiersProps) {
  if (!modifiers?.length) return null;

  // Group by typeName for display
  const grouped: Record<string, Array<{ typeName?: string; typeId?: string; optionId: string; optionName: string; price?: number | string }>> = {};
  modifiers.forEach((m) => {
    const key = m.typeName || m.typeId || 'Add-ons';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  return (
    <div className="cart-line__modifier-display">
      {Object.entries(grouped).map(([label, opts]) => (
        <div key={label} className="cart-mod-readonly">
          <span className="cart-mod-readonly__label">{label}:</span>
          <div className="cart-mod-readonly__tags">
            {opts.map((m) => {
              const price = Number(m.price) || 0;
              return (
                <span key={m.optionId} className="cart-mod-readonly__tag">
                  {m.optionName}
                  {price > 0 && <span className="cart-mod-readonly__price"> +${price.toFixed(2)}</span>}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CartPage ──────────────────────────────────────────────────────────────────
export default function CartPage({ onSignInClick }: CartPageProps) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const cartLines  = useSelector((s: RootState) => s.cart.cartLines);
  const orderType  = useSelector((s: RootState) => s.cart.orderType);
  const auth       = useSelector((s: RootState) => s.auth);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerId = (auth as any)?.customerId || (auth?.user as any)?.customerId || '';
  const isLoggedIn = auth?.isLoggedIn || false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userToken  = (auth?.user as any)?.access_token || '';
  const slugData   = useSelector((s: RootState) => s.slug.data);

  // ── Edit item — route to item detail page pre-loaded with cart item ─────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditItem = (line: any) => {
    const item = line._item || {
      id:            line.itemId,
      itemId:        line.itemId,
      itemName:      line.itemName,
      price:         line.basePrice,
      itemImage:     line.itemImage,
      itemType:      line.itemType,
      customization: line.customization,
    };
    navigate(`/indian-restaurant-menu/cart/${toSlug(line.itemName)}`, {
      state: { item, editLineId: line.lineId },
    });
  };

  const updateQty  = (lineId: string, delta: number) => dispatch(updateQtyAction(lineId, delta));
  const removeLine = (lineId: string)        => dispatch(removeLineAction(lineId));
  const clearCart           = ()              => dispatch(clearCartAction());
  const setOrderType        = (type: string)   => dispatch(setOrderTypeAction(type as OrderType));
  const handleCartOrderTypeChange = (type: string) => {
    dispatch(setOrderTypeAction(type as OrderType));
    dispatch(validateCartItemsRequest({ source: 'cart' }));
    // Switching away from Delivery — clear any pending quote so it
    // doesn't bleed into the next Pickup/DineIn checkout visit
    if (type !== 'Delivery') {
      dispatch(clearDeliveryQuote());
    }
  };
  const availableLines   = cartLines.filter((l) => !l.unavailable);
  const unavailableCount = cartLines.length - availableLines.length;
  const hasUnavailable   = unavailableCount > 0;

  const [totals,     setTotals]     = useState<OrderTotal[] | null>(null);
  const [grandTotal, setGrandTotal] = useState<string | number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Customization popup — tracks the itemId; all lines for that item are shown live
  const [custPopupItemId, setCustPopupItemId] = useState<string | null>(null);
  const custPopupLines = custPopupItemId
    ? cartLines.filter((l) => l.itemId === custPopupItemId)
    : [];

  // Item note editing — which line is being edited (null = modal closed)
  const [editingNoteLineId, setEditingNoteLineId] = useState<string | null>(null);
  const editingLine = editingNoteLineId
    ? cartLines.find((l) => l.lineId === editingNoteLineId) || null
    : null;

  // ── Build totals payload ──────────────────────────────────────────────────
  function buildTotalsPayload() {
    const locationId = slugData?.id || '';
    const orderTypeId =
      orderType === 'Delivery' ? getOrderTypeIdFromSlug(slugData, 'Delivery')
        : orderType === 'DineIn' ? getOrderTypeIdFromSlug(slugData, 'DineIn')
          : getOrderTypeIdFromSlug(slugData, 'Pickup');

    const orderItems = availableLines.map((line) => {
      const modTotal = line.modifiers.reduce((s: number, o: { price: number | string }) => s + Number(o.price), 0);
      // Send basePrice only — server adds modifier prices itself to compute real unit total
      const subTotal = (line.basePrice * line.qty).toFixed(2);
      const { options, modifierIds } = buildOptionPayload(line);

      return {
        itemId:              line.itemId,
        itemName:            line.itemName,
        itemAltName:         line.itemAltName || '',
        price:               line.basePrice.toFixed(2),
        quantity:            String(line.qty),
        subTotal,
        comment:             line.comment || '',
        is_discount_applied: false,
        options,
        ...(modifierIds ? { modifierIds } : {}),
        tax:           line.tax || [],
        offer_data:    null,
        offer_amount:  0,
        availability:  null,
        stockQuantity: null,
        alertQuantity: null,
      };
    });

    return {
      discountType: 'FLATFEE',
      orderItems,
      orderTypeId,
      locationId,
      tip:        0,
      tipType:    'FLATFEE',
      customerId: customerId || '',
    };
  }

  // ── Debounced totals fetch ────────────────────────────────────────────────
  useEffect(() => {
    if (availableLines.length === 0) { setTotals(null); setGrandTotal(null); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getOrderTotalsApi(buildTotalsPayload(), userToken)
        .then((res: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          try {
            const inner = res.data ?? {};
            const totalsArr =
              Array.isArray(inner?.orderTotals) ? inner.orderTotals
                : Array.isArray(inner?.totals)  ? inner.totals
                  : null;
            setTotals(totalsArr);
            const grandFromTotals = totalsArr?.find((t: OrderTotal) => t.code === '5')?.value ?? null;
            setGrandTotal(inner?.orderTotal ?? grandFromTotals ?? null);
          } catch {
            setTotals(null); setGrandTotal(null);
          }
        })
        .catch(() => { setTotals(null); setGrandTotal(null); });
    }, 400);

    return () => clearTimeout(debounceRef.current ?? undefined);
  }, [cartLines, orderType]); // eslint-disable-line

  const displayTotals = totals;

  const cartItemCount = cartLines.reduce((n, l) => n + l.qty, 0);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (cartLines.length === 0) {
    return (
      <PageBg className="cart-page">
        <main className="cart-empty-wrap">
          <div className="cart-empty">
            <div className="cart-empty__icon-box">
              <img src={cartSvg} alt="" className="cart-empty__icon-img" />
            </div>
            <p className="cart-empty__msg">Your cart is empty</p>
            <Link to={`/order-online/${LOCATION_SLUG}/${orderType.toLowerCase()}`} className="cart-empty__cta">
              Start Order
            </Link>
          </div>
        </main>

      </PageBg>
    );
  }

  return (
    <PageBg className="cart-page">

      <main className="cart-main">

        {/* Sticky header */}
        <div className="cart-header">
          <div className="cart-header__left">
            <button className="cart-back" onClick={() => navigate(-1)} type="button" aria-label="Go back">
              <span className="back-icon" aria-hidden="true" />
            </button>
            <h1 className="cart-title">
              Items in Cart
              <span className="cart-title__count">{cartItemCount}</span>
            </h1>
          </div>
          <button className="cart-clear" onClick={clearCart} type="button">
            Clear All
          </button>
        </div>

        <div className="cart-inner">

          {/* Line items */}
          <div className="cart-lines">
            {cartLines.map((line, i) => {
              const isUnavailable = line.unavailable;
              const otherType = orderType === 'Pickup' ? 'Delivery' : 'Pickup';
              const modTotal      = line.modifiers.reduce((s, o) => s + Number(o.price), 0);
              const lineUnitPrice = line.basePrice + modTotal;
              const lineSubtotal  = lineUnitPrice * line.qty;
              const hasSelectedMods = line.modifiers && line.modifiers.length > 0;

              return (
                <motion.div
                  key={line.lineId}
                  className={`cart-line${isUnavailable ? ' cart-line--unavailable' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22, delay: i * 0.04 }}
                >
                  {/* Unavailable: dark overlay with banner + remove */}
                  {isUnavailable && (
                    <div className="cart-line__unavailable-overlay">
                      <div className="cart-line__unavailable-banner">
                        Available only in {otherType}
                      </div>
                      <button
                        className="cart-line__unavailable-remove"
                        onClick={() => removeLine(line.lineId)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Top row — image, name, price, qty, remove */}
                  <div className="cart-line__top">
                    <img
                      src={getImageUrl(line.itemImage, line.itemType) || placeholderImg}
                      alt={line.itemName}
                      className="cart-line__img"
                      loading="lazy"
                    />
                    <div className="cart-line__info">
                      <button
                        className="cart-line__name cart-line__name--edit"
                        onClick={() => handleEditItem(line)}
                        type="button"
                      >
                        {line.itemName}
                      </button>
                      {modTotal > 0 && (
                        <p className="cart-line__mod-total">+${modTotal.toFixed(2)} add-ons</p>
                      )}
                    </div>

                    <div className="cart-line__controls">
                      <div className="cart-line__pricing">

                        <p className="cart-line__subtotal">${lineSubtotal.toFixed(2)}</p>
                      </div>

                      <div className="cart-line__actions-row">
                        <div className="cart-line__qty">
                          <button
                            className="cart-line__qty-btn"
                            onClick={() => updateQty(line.lineId, -1)}
                            aria-label="Decrease"
                            type="button"
                          >
                            −
                          </button>
                          <span className="cart-line__qty-val">{line.qty}</span>
                          <button
                            className="cart-line__qty-btn"
                            onClick={() => hasSelectedMods ? setCustPopupItemId(line.itemId) : updateQty(line.lineId, 1)}
                            aria-label="Increase"
                            type="button"
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cart-line__remove"
                          onClick={() => removeLine(line.lineId)}
                          aria-label="Remove"
                          type="button"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected modifiers (read-only display) */}
                  {hasSelectedMods && (
                    <ReadOnlyModifiers modifiers={line.modifiers} />
                  )}

                  {/* Item note — click to edit */}
                  {line.comment && line.comment.trim().length > 0 && (
                    <button
                      type="button"
                      className="cart-line__note"
                      onClick={() => setEditingNoteLineId(line.lineId)}
                      aria-label="Edit item note"
                    >
                      <img src={itemNoteSvg} alt="" className="cart-line__note-icon" />
                      <span className="cart-line__note-text">{line.comment}</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Summary panel */}
          <div className="cart-summary">

            {/* Order type toggle */}
            <div className="cart-order-toggle">
              <button
                className={`cart-order-toggle__btn${orderType === 'Pickup' ? ' active' : ''}`}
                type="button"
                onClick={() => handleCartOrderTypeChange('Pickup')}
              >
                <i className="fas fa-store" /> Pickup
              </button>
              <button
                className={`cart-order-toggle__btn${orderType === 'Delivery' ? ' active' : ''}`}
                type="button"
                onClick={() => handleCartOrderTypeChange('Delivery')}
              >
                <DeliveryIcon /> Delivery
              </button>
            </div>

            <div className="cart-summary__divider" />

            {displayTotals && displayTotals
              .slice()
              .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
              .map((t) => {
                const val     = parseFloat(String(t.value));
                const isGrand = t.code === '5';
                if (val === 0 && !isGrand) return null;
                return (
                  <div key={t.code} className={`cart-summary__row${isGrand ? ' cart-summary__row--grand' : ''}`}>
                    <span>{t.title}</span>
                    <span>${val.toFixed(2)}</span>
                  </div>
                );
              })}

            {/* Sign-in gate */}
            {!isLoggedIn && (
              <div className="cart-signin-gate">
                <div className="cart-signin-gate__icon">
                  <i className="fas fa-lock" />
                </div>
                <p className="cart-signin-gate__content">Sign in to place your order</p>
                <p className="cart-signin-gate__sub">
                  You need an account to check out.{' '}
                  <button
                    type="button"
                    className="cart-signin-gate__link"
                    onClick={() => onSignInClick?.()}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}

            <button
              className="cart-checkout-btn"
              type="button"
              onClick={() => navigate('/checkout', { state: { cartLines: availableLines, totals, grandTotal, orderType } })}
              disabled={!isLoggedIn}
            >
              Proceed to Checkout
            </button>

            <Link to={`/order-online/${LOCATION_SLUG}/${orderType.toLowerCase()}`} className="cart-summary__continue">
              ← Continue Shopping
            </Link>
          </div>

        </div>
      </main>

      <ItemNoteModal
        isOpen={!!editingLine}
        initialValue={editingLine?.comment || ''}
        itemName={editingLine?.itemName}
        onClose={() => setEditingNoteLineId(null)}
        onSave={(next) => {
          if (editingLine) dispatch(setLineCommentAction(editingLine.lineId, next));
        }}
      />

      {custPopupLines.length > 0 && (
        <CustomizationPopup
          lines={custPopupLines}
          onClose={() => setCustPopupItemId(null)}
          onQtyChange={(lineId, delta) => {
            updateQty(lineId, delta);
            // Close popup if all lines for this item are removed
            const remaining = cartLines.filter((l) => l.itemId === custPopupItemId && l.lineId !== lineId);
            const target = cartLines.find((l) => l.lineId === lineId);
            if (target && target.qty + delta <= 0 && remaining.length === 0) {
              setCustPopupItemId(null);
            }
          }}
          onEdit={(line) => {
            setCustPopupItemId(null);
            const item = line._item || {
              id:            line.itemId,
              itemId:        line.itemId,
              itemName:      line.itemName,
              price:         line.basePrice,
              itemImage:     line.itemImage,
              itemType:      line.itemType,
              customization: line.customization,
            };
            navigate(`/indian-restaurant-menu/cart/${toSlug(line.itemName)}`, {
              state: { item, editLineId: line.lineId },
            });
          }}
          onNewCustomization={() => {
            const refLine = custPopupLines[0];
            setCustPopupItemId(null);
            const item = refLine._item || {
              id:            refLine.itemId,
              itemId:        refLine.itemId,
              itemName:      refLine.itemName,
              price:         refLine.basePrice,
              itemImage:     refLine.itemImage,
              itemType:      refLine.itemType,
              customization: refLine.customization,
            };
            navigate(`/indian-restaurant-menu/cart/${toSlug(refLine.itemName)}`, {
              state: { item, forceNewLine: true },
            });
          }}
        />
      )}

      <ClosingSoonBar orderType={orderType} />
      <ClosedBar />
    </PageBg>
  );
}
