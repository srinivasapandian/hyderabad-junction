import type { AuthState } from './auth';
import type { CartState } from './cart';
import type { SlugState } from './slug';
import type { ActiveOrdersState } from './activeOrders';
import type { FavouritesState } from './favourites';
import type { ReservationState } from './reservation';
import type { OrderState } from './order';
import type { TotalsState } from './totals';
import type { AddressState } from './address';
import type { MenuItem } from './menu';

export interface MenuState {
  loading: boolean;
  data: {
    menu: MenuItem[];
    categoryList?: Record<string, unknown>[];
    availableCategory?: string[];
  } | null;
  error: string | null;
  orderType: string | null;
}

export interface RootState {
  slug: SlugState;
  menu: MenuState;
  auth: AuthState;
  activeOrders: ActiveOrdersState;
  favourites: FavouritesState;
  reservation: ReservationState;
  order: OrderState;
  cart: CartState;
  totals: TotalsState;
  address: AddressState;
}
