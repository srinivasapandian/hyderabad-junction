import { combineReducers } from 'redux';
import { persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

import slugReducer         from './slug/slugReducer';
import menuReducer         from './menu/menuReducer';
import authReducer         from './auth/authReducer';
import activeOrdersReducer from './activeOrders/activeOrdersReducer';
import favouritesReducer   from './favourites/favouritesReducer';
import reservationReducer  from './reservation/reservationReducer';
import orderReducer        from './order/orderReducer';
import cartReducer         from './cart/cartReducer';
import totalsReducer       from './totals/totalsReducer';
import addressReducer      from './address/addressReducer';
import type { ActiveOrdersState, FavouritesState, CartState } from '../types';

// ── Persist configs ───────────────────────────────────────────────────────────
const activeOrdersPersistConfig: PersistConfig<ActiveOrdersState> = {
  key:       'activeOrders',
  storage,
  whitelist: ['orders'],
};

const favouritesPersistConfig: PersistConfig<FavouritesState> = {
  key:       'favourites',
  storage,
  whitelist: ['ids', 'items'],
};

const cartPersistConfig: PersistConfig<CartState> = {
  key:      'cart',
  storage,
  whitelist: ['cartLines', 'orderType'],
};

// ── Root ──────────────────────────────────────────────────────────────────────
export default combineReducers({
  slug:         slugReducer,
  menu:         menuReducer,
  auth:         authReducer,
  activeOrders: persistReducer(activeOrdersPersistConfig, activeOrdersReducer),
  favourites:   persistReducer(favouritesPersistConfig,   favouritesReducer),
  reservation:  reservationReducer,
  order:        orderReducer,
  cart:         persistReducer(cartPersistConfig, cartReducer),
  totals:       totalsReducer,
  address:      addressReducer,
});
