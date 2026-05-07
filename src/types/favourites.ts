import type { MenuItem } from './menu';

export interface FavouritesState {
  ids: string[];
  items: Record<string, MenuItem>;
}
