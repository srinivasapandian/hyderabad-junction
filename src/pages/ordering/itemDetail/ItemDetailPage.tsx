/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import type { RootState, MenuItem } from '../../../types';
import { addToCartAction, addToCartWithModsAction, addCartLineNewAction, updateLineWithModsAction, setLineCommentAction, updateQtyAction } from '../../../redux/cart/cartReducer';
import { addFavouriteRequest, removeFavouriteRequest } from '../../../redux/favourites/favouritesActions';
import { getItemUnavailability } from '../../../utils/menuTransformer';
import { getCurrencySymbol } from '../../../utils/branchConfig';
import { useIsRestaurantClosed } from '../../../hooks/useRestaurantStatus';
import placeholderImg from '../../../assets/placeHolderMedia.jpg';
import itemNoteSvg from '../../../assets/svg/item-note.svg';
import ItemNoteModal from '../../../components/itemNoteModal/ItemNoteModal';
import PageBg from '../../../components/pageBg/PageBg';
import ClosedBar from '../../../components/ClosedBar/ClosedBar';
import './ItemDetailPage.css';

interface SelectedModifier {
  typeId: string;
  typeName?: string;
  optionId: string;
  optionName: string;
  price: number | string;
}

interface ModifierOption {
  optionId: string;
  optionName: string;
  price: number;
  optionAvailable: number;
  optionSortOrder?: number;
}

interface ModifierGroup {
  typeId: string;
  type?: string;
  typeName?: string;
  typeAvailable?: number;
  minRequired: number;
  maxRequired: number;
  sortOrder?: number;
  options: ModifierOption[];
}

const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';
const getExtension = (mimeType: string = '') => mimeType.split('/')[1] || 'jpg';

function getImageUrl(itemImage: string | null | undefined, itemType: string | undefined): string | null {
  if (itemImage) return `${MEDIA_CDN}/${itemImage}.${getExtension(itemType)}`;
  return null;
}

function formatTime(val: string | null | undefined): string {
  if (!val) return '';
  try {
    if (/^\d{2}:\d{2}/.test(val)) {
      const [h, m] = val.split(':');
      const d = new Date();
      d.setHours(+h, +m, 0);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fu = (delay = 0): any => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay },
});

function normalizeSpecialInstructions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => String(entry || '').trim()).filter(Boolean);
  }
  if (!raw || typeof raw !== 'string') return [];
  const value = raw.trim();
  if (!value || value === '-') return [];

  const byLineOrSemi = value
    .split(/\r?\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (byLineOrSemi.length > 1) return byLineOrSemi;

  const byOptionPattern = value
    .split(/,(?=\s*[A-Za-z][^,]*\s-\s)/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return byOptionPattern.length ? byOptionPattern : [value];
}

function normalizeAllergyInfo(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
  }
  if (!raw || typeof raw !== 'string') return [];
  const value = raw.trim();
  if (!value || value === '-') return [];

  const items = value
    .split(/\r?\n|,|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length ? Array.from(new Set(items)) : [value];
}

// ── Normalize customization into grouped shape ───────────────────────────────
function normalizeCustomGroups(raw: any): ModifierGroup[] {
  const list = Array.isArray(raw) ? raw : [];
  if (!list.length) return [];

  // Shape B: already grouped
  if (Array.isArray(list[0]?.options)) {
    return list
      .map((g) => ({
        ...g,
        options: (g.options || []).map((opt: any) => ({
          ...opt,
          optionId: opt.optionId ?? opt.modifierOptionId,
          optionAvailable: opt.optionAvailable ?? 1,
          price: Number(opt.price) || 0,
        })),
      }))
      .filter((g) => g.typeAvailable !== 0);
  }

  // Shape A: flat rows → group by typeId
  const map: Record<string, ModifierGroup> = {};
  list.forEach((c: any) => {
    if (!c.typeId) return;
    if (!map[c.typeId]) {
      map[c.typeId] = {
        typeId: c.typeId,
        type: c.type,
        typeName: c.type,
        typeAvailable: c.typeAvailable ?? 1,
        minRequired: c.minRequired ?? 0,
        maxRequired: c.maxRequired ?? 0,
        sortOrder: c.sortOrder ?? 999,
        options: [],
      };
    }
    const oid = c.modifierOptionId || c.optionId;
    if (oid) {
      map[c.typeId].options.push({
        optionId: oid,
        optionName: c.optionName,
        price: Number(c.price) || 0,
        optionAvailable: c.optionAvailable ?? 1,
      });
    }
  });
  return Object.values(map)
    .filter((g) => g.typeAvailable !== 0 && g.options.length > 0)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999));
}

// ── Modifier Selector ────────────────────────────────────────────────────────
interface ModifierSelectorProps {
  groups: ModifierGroup[];
  selectedModifiers: SelectedModifier[];
  onUpdate: (modifiers: SelectedModifier[]) => void;
  disabled: boolean;
  infoOnly?: boolean;
  currencySymbol?: string;
}

function ModifierSelector({ groups, selectedModifiers, onUpdate, disabled, infoOnly = false, currencySymbol = '$' }: ModifierSelectorProps) {
  if (!groups?.length) return null;

  function toggleOption(group: ModifierGroup, option: ModifierOption) {
    if (disabled || infoOnly) return;
    if (option.optionAvailable === 0) return;
    const { typeId, maxRequired } = group;
    const cap = maxRequired > 0 ? maxRequired : Infinity;
    const enriched = {
      typeId,
      typeName: group.type || group.typeName || '',
      optionId: option.optionId,
      optionName: option.optionName,
      price: option.price || 0,
    };

    const groupSels = selectedModifiers.filter((m) => m.typeId === typeId);
    const alreadyIdx = groupSels.findIndex((m) => m.optionId === option.optionId);

    let newGroupSels;
    if (alreadyIdx !== -1) {
      newGroupSels = groupSels.filter((_, i) => i !== alreadyIdx);
    } else if (maxRequired === 1) {
      newGroupSels = [enriched];
    } else if (Number.isFinite(cap) && groupSels.length >= cap) {
      return;
    } else {
      newGroupSels = [...groupSels, enriched];
    }

    onUpdate([...selectedModifiers.filter((m) => m.typeId !== typeId), ...newGroupSels]);
  }

  return (
    <div className="idp__mod-selector">
      {groups.map((group) => {
        const label    = group.type || group.typeName || 'Options';
        const groupSels = selectedModifiers.filter((m) => m.typeId === group.typeId);
        const minR     = group.minRequired ?? 0;
        const maxR     = group.maxRequired ?? 0;
        const needed   = minR > 0 && groupSels.length < minR;
        const isRadio  = maxR === 1;
        const availOpts = (group.options || []).filter((o) => o.optionAvailable !== 0);

        return (
          <div key={group.typeId} className="idp__mod-group">
            <div className="idp__mod-group-header">
              <span className="idp__mod-group-name">{label}</span>

              {/* Badges hidden in info-only mode */}
              {!infoOnly && (
                <div className="idp__mod-group-meta">
                  {minR > 0 && (
                    <span className={`idp__mod-badge ${needed ? 'idp__mod-badge--required' : 'idp__mod-badge--met'}`}>
                      {needed ? (
                        'Required'
                      ) : (
                        <>
                          Selected
                          {isRadio ? '' : `${groupSels.length}/${minR}`}
                        </>
                      )}
                    </span>
                  )}
                  {minR === 0 && (
                    <span className="idp__mod-badge idp__mod-badge--optional">Optional</span>
                  )}
                  {maxR > 1 && (
                    <span className="idp__mod-group-limit">up to {maxR}</span>
                  )}
                </div>
              )}
            </div>

            <div className="idp__mod-pills">
              {availOpts.map((opt) => {
                const selected = !infoOnly && groupSels.some((m) => m.optionId === opt.optionId);
                const atCap    = !infoOnly && !selected && Number.isFinite(maxR) && maxR > 0 && groupSels.length >= maxR && !isRadio;
                const price    = Number(opt.price) || 0;
                return (
                  <button
                    key={opt.optionId}
                    type="button"
                    disabled={infoOnly || atCap || disabled}
                    onClick={() => toggleOption(group, opt)}
                    className={[
                      'idp__mod-pill',
                      !infoOnly && selected    ? 'idp__mod-pill--selected' : '',
                      !infoOnly && atCap       ? 'idp__mod-pill--disabled' : '',
                      (disabled || infoOnly)   ? 'idp__mod-pill--readonly' : '',
                    ].join(' ').trim()}
                  >
                    <span className="idp__mod-pill-name">{opt.optionName}</span>
                    <span className="idp__mod-pill-sep" aria-hidden="true">|</span>
                    <span className="idp__mod-pill-price">
                      {price > 0 ? `+${currencySymbol}${price.toFixed(2)}` : 'Free'}
                    </span>

                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ItemDetailPage() {
  const location = useLocation();
  const state    = location.state as { item?: any; forceNewLine?: boolean; editLineId?: string } | null;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartLines      = useSelector((s: RootState) => s.cart.cartLines);
  const favouriteIds   = useSelector((s: RootState) => s.favourites.ids);
  const isLoggedIn     = useSelector((s: RootState) => s.auth.isLoggedIn);
  const currencySymbol = useSelector((s: RootState) => getCurrencySymbol(s.slug.data));

  const isRestaurantClosed = useIsRestaurantClosed();

  const item         = state?.item;
  const forceNewLine = state?.forceNewLine ?? false;
  const editLineId   = state?.editLineId ?? null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!item) navigate('/indian-restaurant-menu', { replace: true });
  }, [item, navigate]);

  // ── Normalize modifier groups ──────────────────────────────────────────────
  const customGroups = useMemo(
    () => normalizeCustomGroups(item?.customization),
    [item?.customization],
  );

  const hasModifiers = customGroups.length > 0;

  if (!item) return null;

  const {
    itemName, price, description,
    ingredient = [], diet = [],
    allergicInfo, specialInstructions,
    itemUnAvailableUntil,
    prepTimeInMins, subCategory,
    kidsFriendly, isSpecial, specialName,
    itemFilter = [], availability = [],
    itemTagResponses = [],
  } = item;

  const itemId         = String(item.id || item.itemId || '');
  const safePrice      = Number.isFinite(price) ? price : Number(price) || 0;
  const safeIngredient = Array.isArray(ingredient) ? ingredient : [];
  const safeDiet       = Array.isArray(diet) ? diet : [];
  const safeFilters    = Array.isArray(itemFilter) ? itemFilter : [];
  const safeAvail      = Array.isArray(availability) ? availability : [];
  const safeTags       = Array.isArray(itemTagResponses) ? itemTagResponses : [];
  const specialInstructionList = normalizeSpecialInstructions(specialInstructions);
  const allergyList    = normalizeAllergyInfo(allergicInfo);
  const hasAllergyInfo = allergyList.length > 0;

  // ── Item-specific unavailability — derived individually ───────────────────
  const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } = getItemUnavailability(item);
  const isItemBlocked = isTemporarilyUnavailable || isOutOfStock || !!isUnAvailableUntil;

  const imageSrc = getImageUrl(item.itemImage, item.itemType) || placeholderImg;
  const isFav    = favouriteIds.includes(itemId);
  const cartLine = forceNewLine
    ? undefined
    : editLineId
      ? cartLines.find((l) => l.lineId === editLineId)
      : cartLines.find((l) => l.lineId === itemId || l.itemId === itemId);
  const cartQty  = cartLine?.qty ?? 0;
  const lineId   = cartLine?.lineId ?? itemId;
  const availTime = formatTime(itemUnAvailableUntil);

  // ── Local state ───────────────────────────────────────────────────────────
  const [localQty, setLocalQty] = useState(cartQty > 0 ? cartQty : 1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(
    () => cartLine?.modifiers || [],
  );
  const [descExpanded, setDescExpanded] = useState<boolean>(false);
  const [descOverflows, setDescOverflows] = useState<boolean>(false);
  const descRef = useRef<HTMLParagraphElement | null>(null);

  // Item note
  const [pendingNote, setPendingNote] = useState<string>(cartLine?.comment || '');
  const [noteOpen, setNoteOpen] = useState<boolean>(false);
  useEffect(() => { setPendingNote(cartLine?.comment || ''); }, [cartLine?.comment]);
  const savedComment = cartLine?.comment || '';
  const currentNote  = cartQty > 0 ? savedComment : pendingNote;
  const hasNote      = currentNote.trim().length > 0;

  const openNoteModal  = () => { if (!isItemBlocked) setNoteOpen(true); };
  const closeNoteModal = () => setNoteOpen(false);
  const saveNote = (next: string) => {
    setPendingNote(next);
    if (cartQty > 0) dispatch(setLineCommentAction(lineId, next));
  };

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [description]);

  useEffect(() => {
    setLocalQty(cartQty > 0 ? cartQty : 1);
  }, [cartQty]);

  useEffect(() => {
    if (cartLine?.modifiers) setSelectedModifiers(cartLine.modifiers);
  }, [cartLine?.modifiers]);

  // ── Modifier validation ───────────────────────────────────────────────────
  const modifierValidation = useMemo(() => {
    if (!hasModifiers) return { valid: true, messages: [] };
    const messages = [];
    for (const group of customGroups) {
      const minR = group.minRequired ?? 0;
      if (minR > 0) {
        const count = selectedModifiers.filter((m) => m.typeId === group.typeId).length;
        if (count < minR) {
          const label = group.type || group.typeName || 'Options';
          messages.push(`Select ${minR > 1 ? `at least ${minR} for` : ''} ${label}`);
        }
      }
    }
    return { valid: messages.length === 0, messages };
  }, [customGroups, hasModifiers, selectedModifiers]);

  // ── Modifier price total ──────────────────────────────────────────────────
  const modTotal   = selectedModifiers.reduce((s, m) => s + (Number(m.price) || 0), 0);
  const unitPrice  = safePrice + modTotal;
  const totalPrice = unitPrice * localQty;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFav = () => {
    if (isFav) dispatch(removeFavouriteRequest(itemId));
    else dispatch(addFavouriteRequest(itemId, item));
  };

  const handleConfirmAdd = () => {
    if (hasModifiers && !modifierValidation.valid) return;

    if (hasModifiers) {
      if (forceNewLine) {
        dispatch(addCartLineNewAction(item, selectedModifiers, localQty));
      } else if (editLineId) {
        // Update the specific line; reducer deduplicates if modifiers now match another line
        dispatch(updateLineWithModsAction(editLineId, selectedModifiers, localQty));
      } else {
        dispatch(addToCartWithModsAction(item, selectedModifiers, localQty));
      }
    } else if (cartQty === 0) {
      for (let i = 0; i < localQty; i++) dispatch(addToCartAction(item));
    } else {
      const diff = localQty - cartQty;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) dispatch(addToCartAction(item));
      } else if (diff < 0) {
        dispatch(updateQtyAction(lineId, diff));
      }
    }
    if (localQty > 0 && pendingNote !== savedComment) {
      dispatch(setLineCommentAction(lineId, pendingNote));
    }
    navigate(-1);
  };

  const isAddDisabled = hasModifiers && !modifierValidation.valid;

  const addBtnLabel =
    localQty === 0
      ? 'Remove from Cart'
      : cartQty > 0
        ? 'Update Cart'
        : 'Add to Cart';

  const useSectionCounter = () => {
    let count = 0;
    return () => String(++count).padStart(2, '0');
  };
  const nextSection = useSectionCounter();

  return (
    <PageBg className="idp-page">
      <main className="idp">

        <div className="idpspace"></div>

        {/* ── Back button ── */}
        <div className="idp__back-bar">
          <button className="idp__back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
            Back
          </button>
        </div>

        {/* ── Split layout ── */}
        <div className="idp__split">

          {/* ═══ LEFT — details ═══ */}
          <motion.div className="idp__left" {...fu(0.05)}>

            {/* Eyebrow badges */}
            <div className="idp__eyebrow">
              {subCategory && <span className="idp__badge idp__badge--cat">{subCategory}</span>}
              {safeFilters.map((f) => (
                <span key={f.id} className="idp__badge idp__badge--cat">{f.name}</span>
              ))}
              {prepTimeInMins && Number(prepTimeInMins) > 0 && (
                <span className="idp__chip">
                  <i className="fa-solid fa-fire-alt" /> {prepTimeInMins} min
                </span>
              )}
              {kidsFriendly && (
                <span className="idp__badge idp__badge--kids" aria-label="Kids Friendly">
                  <i className="fa-solid fa-child-reaching" />
                </span>
              )}
            </div>

            {/* Name + Price inline */}
            <div className="idp__name-price-row">
              <h1 className="idp__name">{itemName}</h1>
              <span className="idp__price">{currencySymbol}{safePrice.toFixed(2)}</span>
            </div>
            <div className="idp__name-rule" />

            {/* Description + Item Note */}
            <div className="idp__desc-note-wrap">
              {description && (
                <div className="idp__desc-wrap">
                  <p ref={descRef} className={`idp__desc${descExpanded ? ' idp__desc--expanded' : ''}`}>
                    {description}
                  </p>
                  {descOverflows && !descExpanded && (
                    <button
                      className="idp__desc-more"
                      onClick={() => setDescExpanded(true)}
                      type="button"
                    >
                      more
                    </button>
                  )}
                </div>
              )}

              {/* Item note — hidden entirely when restaurant is closed */}
              {!isRestaurantClosed && (
                <div className="idp__note-row">
                  <button
                    type="button"
                    className={`idp__note-btn${isItemBlocked ? ' idp__note-btn--disabled' : ''}`}
                    disabled={isItemBlocked}
                    onClick={openNoteModal}
                    aria-label={hasNote ? 'Edit item note' : 'Add item note'}
                  >
                    <img src={itemNoteSvg} alt="" className="idp__note-icon" />
                    <span className="idp__note-label" title={hasNote ? currentNote : undefined}>
                      {hasNote ? currentNote : 'Item Note'}
                    </span>
                    {hasNote && <span className="idp__note-indicator" aria-hidden="true" />}
                  </button>
                </div>
              )}
            </div>

            {/* ── Modifier section ── */}
            {hasModifiers && (
              <motion.div className="idp__mod-section" {...fu(0.08)}>
                <div className="idp__section-head">
                  <span className="idp__section-num">{nextSection()}</span>
                  <div>
                    <h2 className="idp__section-title">Customise Your Order</h2>
                    <p className="idp__section-sub">Pick your preferences below</p>
                  </div>
                </div>
                <ModifierSelector
                  groups={customGroups}
                  selectedModifiers={selectedModifiers}
                  onUpdate={setSelectedModifiers}
                  disabled={isItemBlocked}
                  infoOnly={isRestaurantClosed}
                  currencySymbol={currencySymbol}
                />
                {/* Validation — hidden when closed or item blocked */}
                {!isItemBlocked && !isRestaurantClosed && !modifierValidation.valid && (
                  <div className="idp__mod-validation">
                    <i className="fa-solid fa-circle-info" />
                    <span>{modifierValidation.messages[0]}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Cart block (desktop) — hidden when restaurant is closed ── */}
            {!isRestaurantClosed && (
              <div className="idp__cart-block">
                {isItemBlocked ? (
                  <div className="idp__cart-disabled">
                    <i className="fa-regular fa-clock" />
                    <span>{availTime ? `Opens at ${availTime}` : 'Unavailable'}</span>
                  </div>
                ) : (
                  <>
                    <div className="idp__qty-row">
                      <button
                        className="idp__qty-btn"
                        onClick={() => setLocalQty((q) => Math.max(cartQty > 0 ? 0 : 1, q - 1))}
                        type="button"
                        disabled={localQty <= (cartQty > 0 ? 0 : 1)}
                      >-</button>
                      <div className="idp__qty-info">
                        <span className="idp__qty-num">{localQty}</span>
                      </div>
                      <button
                        className="idp__qty-btn"
                        onClick={() => setLocalQty((q) => q + 1)}
                        type="button"
                      >+</button>
                    </div>
                    <button
                      className={`idp__add-btn${isAddDisabled ? ' idp__add-btn--disabled' : ''}`}
                      onClick={handleConfirmAdd}
                      type="button"
                      disabled={isAddDisabled}
                    >
                      {addBtnLabel}
                    </button>
                  </>
                )}

                {isLoggedIn && (
                  <button
                    className={`idp__fav-btn${isFav ? ' idp__fav-btn--on' : ''}`}
                    onClick={handleFav}
                    type="button"
                    aria-label="Toggle favourite"
                  >
                    <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                  </button>
                )}
              </div>
            )}

          </motion.div>

          {/* ═══ RIGHT — image ═══ */}
          <motion.div className="idp__right" {...fu(0.12)}>
            <div className="idp__img-frame">
              <img src={imageSrc} alt={itemName} className="idp__img" loading="eager" />

              {/* Mobile back button */}
              <button
                className="idp__img-back"
                onClick={() => navigate(-1)}
                type="button"
                aria-label="Go back"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              {/* Fav on image — only visible when logged in */}
              {isLoggedIn && (
                <button
                  className={`idp__img-fav${isFav ? ' idp__img-fav--on' : ''}`}
                  onClick={handleFav}
                  type="button"
                  aria-label="Toggle favourite"
                >
                  <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                </button>
              )}

              {/* Item-specific unavailability scrim — not shown for closed restaurant */}
              {isItemBlocked && (
                <div className="idp__img-scrim">
                  {availTime && <i className="fa-regular fa-clock" />}
                  <span className="idp__img-scrim-label">
                    {availTime ? 'Will be available at' : 'Currently unavailable'}
                  </span>
                  {availTime && <span className="idp__img-scrim-time">{availTime}</span>}
                </div>
              )}
            </div>

            {/* Mobile qty + add bar (below image) — hidden when closed or item blocked */}
            {!isItemBlocked && !isRestaurantClosed && (
              <div className="idp__img-bar">
                <div className="idp__img-spinner">
                  <button
                    className="idp__img-spin-btn"
                    onClick={() => setLocalQty((q) => Math.max(cartQty > 0 ? 0 : 1, q - 1))}
                    type="button"
                    disabled={localQty <= (cartQty > 0 ? 0 : 1)}
                  >-</button>
                  <span className="idp__img-spin-val">{localQty}</span>
                  <button
                    className="idp__img-spin-btn"
                    onClick={() => setLocalQty((q) => q + 1)}
                    type="button"
                  >+</button>
                </div>
                <button
                  className={`idp__img-add-btn${isAddDisabled ? ' idp__img-add-btn--disabled' : ''}`}
                  onClick={handleConfirmAdd}
                  type="button"
                  disabled={isAddDisabled}
                >
                  {addBtnLabel}
                </button>
              </div>
            )}
          </motion.div>

        </div>{/* /split */}

        {/* ── Below split — full-width sections ── */}
        <div className="idp__below">

          {/* Dietary filters */}
          {safeFilters.length > 0 && (
            <motion.section className="idp__section" {...fu(0.15)}>
              <div className="idp__section-head">
                <span className="idp__section-num">{nextSection()}</span>
                <div>
                  <h2 className="idp__section-title">Food Preparation</h2>
                  <p className="idp__section-sub">How this dish is crafted</p>
                </div>
              </div>
              <div className="idp__filter-grid">
                {safeFilters.map((f) => (
                  <div key={f.id} className="idp__filter-card">
                    <div className="idp__filter-icon">
                      <i className="fa-solid fa-check" />
                    </div>
                    <div className="idp__filter-text">
                      <span className="idp__filter-name">{f.name}</span>
                      {f.summary && <span className="idp__filter-summary">{f.summary}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Ingredients */}
          {safeIngredient.length > 0 && (
            <motion.section className="idp__section" {...fu(0.2)}>
              <div className="idp__section-head">
                <span className="idp__section-num">{nextSection()}</span>
                <div>
                  <h2 className="idp__section-title">Ingredients</h2>
                  <p className="idp__section-sub">Key ingredients in this dish</p>
                </div>
              </div>
              <div className="idp__ingredient-row">
                {safeIngredient.map((ing) => (
                  <span key={ing.id} className="idp__ingredient-pill">
                    <span className="idp__ingredient-dot" />
                    {ing.name}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* Allergen Info */}
          {hasAllergyInfo && (
            <motion.section className="idp__section" {...fu(0.22)}>
              <div className="idp__section-head">
                <span className="idp__section-num">{nextSection()}</span>
                <div>
                  <h2 className="idp__section-title">Allergy Information</h2>
                </div>
              </div>
              <div className="idp__allergy-list">
                {allergyList.map((allergy, index) => {
                  const isSafe = /no allergen|none/i.test(allergy);
                  return (
                    <span
                      key={`${allergy}-${index}`}
                      className={`idp__allergy-card ${isSafe ? 'idp__allergy-card--safe' : 'idp__allergy-card--warn'}`}
                    >
                      {allergy}
                    </span>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Special instructions */}
          {specialInstructionList.length > 0 && (
            <motion.section className="idp__section idp__section--last" {...fu(0.25)}>
              <div className="idp__section-head">
                <span className="idp__section-num">{nextSection()}</span>
                <div>
                  <h2 className="idp__section-title">Special instructions</h2>
                </div>
              </div>
              <div className="idp__special-list">
                {specialInstructionList.map((instruction, index) => (
                  <div key={`${instruction}-${index}`} className="idp__special-item">
                    <span className="idp__special-item-num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="idp__special-instr">{instruction}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </div>{/* /below */}

        {/* ── Mobile sticky bottom bar — hidden when restaurant is closed ── */}
        {!isRestaurantClosed && (
          <div className="idp__mobile-bar">
            {isItemBlocked ? (
              <div className="idp__mobile-unavail">
                <i className="fa-regular fa-clock" />
                <span>{availTime ? `Available at ${availTime}` : 'Currently unavailable'}</span>
              </div>
            ) : (
              <>
                <div className="idp__mobile-qty">
                  <button
                    onClick={() => setLocalQty((q) => Math.max(cartQty > 0 ? 0 : 1, q - 1))}
                    type="button"
                    disabled={localQty <= (cartQty > 0 ? 0 : 1)}
                  >
                    -
                  </button>
                  <span>{localQty}</span>
                  <button
                    onClick={() => setLocalQty((q) => q + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <button
                  className={`idp__mobile-add${isAddDisabled ? ' idp__mobile-add--disabled' : ''}`}
                  onClick={handleConfirmAdd}
                  type="button"
                  disabled={isAddDisabled}
                >
                  {addBtnLabel}
                </button>
              </>
            )}
            {isLoggedIn && (
              <button
                className={`idp__mobile-fav${isFav ? ' idp__mobile-fav--on' : ''}`}
                onClick={handleFav}
                type="button"
                aria-label="Toggle favourite"
              >
                <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              </button>
            )}
          </div>
        )}

      </main>

      <ItemNoteModal
        isOpen={noteOpen}
        initialValue={currentNote}
        itemName={itemName}
        onClose={closeNoteModal}
        onSave={saveNote}
      />
      <ClosedBar />
    </PageBg>
  );
}
