import {
  TOGGLE_FAVOURITE,
  LOAD_FAVOURITES,
  CLEAR_FAVOURITES,
  ADD_FAVOURITE_REQUEST,
  REMOVE_FAVOURITE_REQUEST,
  FETCH_FAVOURITES_REQUEST,
} from './favouritesConstants';
import type { MenuItem, ReduxAction } from '../../types';

// ── Local / optimistic ─────────────────────────────────────────────────────────
export const toggleFavouriteAction = (itemId: string, item?: MenuItem): ReduxAction<{ itemId: string; item?: MenuItem }> => ({
  type:    TOGGLE_FAVOURITE,
  payload: { itemId, item },
});

export const loadFavouritesAction = (itemList: MenuItem[]): ReduxAction<MenuItem[]> => ({
  type:    LOAD_FAVOURITES,
  payload: itemList,
});

export const clearFavouritesAction = (): ReduxAction => ({
  type: CLEAR_FAVOURITES,
});

// ── API-backed ─────────────────────────────────────────────────────────────────
export const addFavouriteRequest = (itemId: string, item?: MenuItem): ReduxAction<{ itemId: string; item?: MenuItem }> => ({
  type:    ADD_FAVOURITE_REQUEST,
  payload: { itemId, item },
});

export const removeFavouriteRequest = (itemId: string): ReduxAction<{ itemId: string }> => ({
  type:    REMOVE_FAVOURITE_REQUEST,
  payload: { itemId },
});

export const fetchFavouritesRequest = (): ReduxAction => ({
  type: FETCH_FAVOURITES_REQUEST,
});
