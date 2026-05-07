import {
  VALIDATE_CART_ITEMS_REQUEST,
  VALIDATE_CART_ITEMS_SUCCESS,
} from './cartConstants';
import type { CartState, CartLine, MenuItem, Modifier, OrderType, ReduxAction } from '../../types';

// ── Action types ──────────────────────────────────────────────────────────────
export const ADD_TO_CART              = 'cart/ADD_TO_CART';
export const ADD_TO_CART_WITH_MODS    = 'cart/ADD_TO_CART_WITH_MODS';
export const ADD_CART_LINE_NEW        = 'cart/ADD_CART_LINE_NEW';
export const UPDATE_LINE_WITH_MODS    = 'cart/UPDATE_LINE_WITH_MODS';
export const UPDATE_QTY               = 'cart/UPDATE_QTY';
export const UPDATE_LINE_MODIFIERS    = 'cart/UPDATE_LINE_MODIFIERS';
export const SET_LINE_COMMENT         = 'cart/SET_LINE_COMMENT';
export const REMOVE_LINE              = 'cart/REMOVE_LINE';
export const CLEAR_CART               = 'cart/CLEAR_CART';
export const SET_ORDER_TYPE           = 'cart/SET_ORDER_TYPE';

// ── Action creators ───────────────────────────────────────────────────────────
export const addToCartAction           = (item: MenuItem): ReduxAction<MenuItem>           => ({ type: ADD_TO_CART,           payload: item });
export const addToCartWithModsAction   = (item: MenuItem, modifiers: Modifier[], qty: number): ReduxAction<{ item: MenuItem; modifiers: Modifier[]; qty: number }> => ({ type: ADD_TO_CART_WITH_MODS,  payload: { item, modifiers, qty } });
export const addCartLineNewAction      = (item: MenuItem, modifiers: Modifier[], qty: number): ReduxAction<{ item: MenuItem; modifiers: Modifier[]; qty: number }> => ({ type: ADD_CART_LINE_NEW,       payload: { item, modifiers, qty } });
export const updateLineWithModsAction  = (lineId: string, modifiers: Modifier[], qty: number): ReduxAction<{ lineId: string; modifiers: Modifier[]; qty: number }> => ({ type: UPDATE_LINE_WITH_MODS,   payload: { lineId, modifiers, qty } });
export const updateQtyAction           = (lineId: string, delta: number): ReduxAction<{ lineId: string; delta: number }>  => ({ type: UPDATE_QTY,             payload: { lineId, delta } });
export const updateLineModifiersAction = (lineId: string, mods: Modifier[]): ReduxAction<{ lineId: string; mods: Modifier[] }>   => ({ type: UPDATE_LINE_MODIFIERS, payload: { lineId, mods } });
export const setLineCommentAction      = (lineId: string, comment: string): ReduxAction<{ lineId: string; comment: string }>    => ({ type: SET_LINE_COMMENT,     payload: { lineId, comment } });
export const removeLineAction          = (lineId: string): ReduxAction<string>         => ({ type: REMOVE_LINE,           payload: lineId });
export const clearCartAction           = (): ReduxAction               => ({ type: CLEAR_CART });
export const setOrderTypeAction        = (orderType: OrderType): ReduxAction<OrderType>      => ({ type: SET_ORDER_TYPE,        payload: orderType });

// ── Modifier fingerprint: order-independent canonical key ─────────────────────
// Uses typeId + optionId so display-name changes don't create false duplicates
function modFingerprint(mods: Modifier[]): string {
  return [...mods].map((m) => `${m.typeId}:${m.optionId}`).sort().join('|');
}

// ── Reducer ───────────────────────────────────────────────────────────────────
const initialState: CartState = {
  cartLines: [],
  orderType: 'Pickup', // 'Pickup' | 'Delivery' | 'DineIn'
};

export default function cartReducer(state: CartState = initialState, action: ReduxAction): CartState {
  switch (action.type) {

    case ADD_TO_CART: {
      const item   = action.payload as MenuItem;
      const itemId = String(item.id || item.itemId || '');
      const lineId = itemId;
      const exists = state.cartLines.find((l) => l.lineId === lineId);
      if (exists) {
        return {
          ...state,
          cartLines: state.cartLines.map((l) =>
            l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return {
        ...state,
        cartLines: [
          ...state.cartLines,
          {
            lineId,
            itemId,
            itemName:       item.itemName    || '',
            itemAltName:    item.itemAltName || '',
            itemImage:      item.itemImage   || null,
            itemType:       item.itemType    || null,
            basePrice:      Number(item.price) || 0,
            modifiers:      [],
            qty:            1,
            customization:  item.customization || [],
            tax:            item.tax           || [],
            digiMenuMedia:  item.digiMenuMedia || [],
            _item:          item,
          },
        ],
      };
    }

    case ADD_TO_CART_WITH_MODS: {
      const { item, modifiers, qty } = action.payload as { item: MenuItem; modifiers: Modifier[]; qty: number };
      const itemId = String(item.id || item.itemId || '');
      const fp = modFingerprint(modifiers);
      const match = state.cartLines.find((l) => l.itemId === itemId && modFingerprint(l.modifiers) === fp);
      if (match) {
        return {
          ...state,
          cartLines: state.cartLines.map((l) =>
            l.lineId === match.lineId ? { ...l, qty: l.qty + qty } : l
          ),
        };
      }
      const lineId = itemId;
      return {
        ...state,
        cartLines: [
          ...state.cartLines,
          {
            lineId,
            itemId,
            itemName:       item.itemName    || '',
            itemAltName:    item.itemAltName || '',
            itemImage:      item.itemImage   || null,
            itemType:       item.itemType    || null,
            basePrice:      Number(item.price) || 0,
            modifiers,
            qty,
            customization:  item.customization || [],
            tax:            item.tax           || [],
            digiMenuMedia:  item.digiMenuMedia || [],
            _item:          item,
          },
        ],
      };
    }

    case ADD_CART_LINE_NEW: {
      const { item, modifiers, qty } = action.payload as { item: MenuItem; modifiers: Modifier[]; qty: number };
      const itemId = String(item.id || item.itemId || '');
      const fp = modFingerprint(modifiers);
      const match = state.cartLines.find((l) => l.itemId === itemId && modFingerprint(l.modifiers) === fp);
      if (match) {
        return {
          ...state,
          cartLines: state.cartLines.map((l) =>
            l.lineId === match.lineId ? { ...l, qty: l.qty + qty } : l
          ),
        };
      }
      const lineId = `${itemId}_${Date.now()}`;
      return {
        ...state,
        cartLines: [
          ...state.cartLines,
          {
            lineId,
            itemId,
            itemName:       item.itemName    || '',
            itemAltName:    item.itemAltName || '',
            itemImage:      item.itemImage   || null,
            itemType:       item.itemType    || null,
            basePrice:      Number(item.price) || 0,
            modifiers,
            qty,
            customization:  item.customization || [],
            tax:            item.tax           || [],
            digiMenuMedia:  item.digiMenuMedia || [],
            _item:          item,
          },
        ],
      };
    }

    case UPDATE_LINE_WITH_MODS: {
      const { lineId, modifiers, qty } = action.payload as { lineId: string; modifiers: Modifier[]; qty: number };
      const target = state.cartLines.find((l) => l.lineId === lineId);
      if (!target) return state;

      const newFp = modFingerprint(modifiers);
      // Check if another line already has the same item + same modifier combination
      const duplicate = state.cartLines.find(
        (l) => l.lineId !== lineId && l.itemId === target.itemId && modFingerprint(l.modifiers) === newFp
      );

      if (duplicate) {
        // Merge: fold qty into the duplicate line, drop the edited line
        return {
          ...state,
          cartLines: state.cartLines
            .filter((l) => l.lineId !== lineId)
            .map((l) => l.lineId === duplicate.lineId ? { ...l, qty: l.qty + qty } : l),
        };
      }

      return {
        ...state,
        cartLines: state.cartLines.map((l) =>
          l.lineId === lineId ? { ...l, modifiers, qty } : l
        ),
      };
    }

    case UPDATE_QTY: {
      const { lineId, delta } = action.payload as { lineId: string; delta: number };
      const line = state.cartLines.find((l) => l.lineId === lineId);
      if (!line) return state;
      const newQty = line.qty + delta;
      if (newQty <= 0) {
        return { ...state, cartLines: state.cartLines.filter((l) => l.lineId !== lineId) };
      }
      return {
        ...state,
        cartLines: state.cartLines.map((l) =>
          l.lineId === lineId ? { ...l, qty: newQty } : l
        ),
      };
    }

    case UPDATE_LINE_MODIFIERS: {
      const { lineId, mods } = action.payload as { lineId: string; mods: Modifier[] };
      return {
        ...state,
        cartLines: state.cartLines.map((l) =>
          l.lineId === lineId ? { ...l, modifiers: mods } : l
        ),
      };
    }

    case SET_LINE_COMMENT: {
      const { lineId, comment } = action.payload as { lineId: string; comment: string };
      return {
        ...state,
        cartLines: state.cartLines.map((l) =>
          l.lineId === lineId ? { ...l, comment } : l
        ),
      };
    }

    case REMOVE_LINE:
      return {
        ...state,
        cartLines: state.cartLines.filter((l) => l.lineId !== (action.payload as string)),
      };

    case CLEAR_CART:
      return { ...state, cartLines: [] };

    case SET_ORDER_TYPE:
      return { ...state, orderType: action.payload as OrderType };

    // ── Cart validation: reset unavailable flags on new request ──────────
    case VALIDATE_CART_ITEMS_REQUEST:
      return {
        ...state,
        cartLines: state.cartLines.map((l) => ({ ...l, unavailable: false })),
      };

    // ── Cart validation: mark items based on API response ────────────────
    case VALIDATE_CART_ITEMS_SUCCESS: {
      const validationResult = action.payload as Array<{ itemId: string; enabled: boolean }>; // [{ itemId, enabled }]
      const enabledMap = new Map<string, boolean>(
        validationResult.map((r) => [r.itemId, r.enabled])
      );
      return {
        ...state,
        cartLines: state.cartLines.map((l) => ({
          ...l,
          unavailable: enabledMap.has(l.itemId) ? !enabledMap.get(l.itemId) : false,
        })),
      };
    }

    default:
      return state;
  }
}
