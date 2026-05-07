import {
  TOGGLE_FAVOURITE,
  LOAD_FAVOURITES,
  CLEAR_FAVOURITES,
} from './favouritesConstants';
import { LOGOUT } from '../auth/authConstants';
import type { FavouritesState, MenuItem, ReduxAction } from '../../types';

// ── Initial state ──────────────────────────────────────────────────────────────
const initialState: FavouritesState = {
  ids:   [],
  items: {},
};

// ── Reducer ────────────────────────────────────────────────────────────────────
export default function favouritesReducer(state: FavouritesState = initialState, action: ReduxAction): FavouritesState {
  switch (action.type) {

    case TOGGLE_FAVOURITE: {
      const { itemId, item } = action.payload as { itemId: string; item?: MenuItem };
      const alreadySaved = state.ids.includes(itemId);

      if (alreadySaved) {
        const { [itemId]: _removed, ...restItems } = state.items;
        return { ids: state.ids.filter((id) => id !== itemId), items: restItems };
      }
      return {
        ids:   [...state.ids, itemId],
        items: item ? { ...state.items, [itemId]: item } : state.items,
      };
    }

    case LOAD_FAVOURITES: {
      const itemList = Array.isArray(action.payload) ? action.payload : [];
      const ids: string[]   = [];
      const items: Record<string, MenuItem> = {};
      itemList.forEach((item: MenuItem) => {
        const id = String(item?.itemId || item?.id || '');
        if (!id) return;
        ids.push(id);
        items[id] = item;
      });
      return { ids, items };
    }

    case CLEAR_FAVOURITES:
      return initialState;
    case LOGOUT:
      return initialState;

    default:
      return state;
  }
}
