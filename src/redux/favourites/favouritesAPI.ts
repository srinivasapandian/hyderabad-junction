import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';

const bearerHeaders = (token: string): Record<string, string> => {
  const authHeader = token
    ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`)
    : null;
  return {
    'content-type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
};

// ── Fetch  [*] ─────────────────────────────────────────────────────────────────
export const fetchFavouritesApi = (customerId: string, locationId: string, token: string): Promise<AxiosResponse> =>
  API_MENU.get('api/customers/fetch-favourites', {
    params:  { customerId, locationId },
    headers: bearerHeaders(token),
  });

// ── Add  [*] ───────────────────────────────────────────────────────────────────
export const addFavouriteApi = (itemId: string, locationId: string, customerId: string, token: string): Promise<AxiosResponse> =>
  API_MENU.post(
    'api/customers/add-favourites',
    { itemId: [itemId], locationId, customerId },
    { headers: bearerHeaders(token) },
  );

// ── Remove  [*] ────────────────────────────────────────────────────────────────
export const removeFavouriteApi = (itemId: string, locationId: string, customerId: string, token: string): Promise<AxiosResponse> =>
  API_MENU.delete('api/customers/remove-favourites', {
    data:    { itemId: [itemId], locationId, customerId },
    headers: bearerHeaders(token),
  });
