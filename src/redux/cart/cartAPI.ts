import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';

/**
 * Validate cart items (availability, stock) before checkout.
 * POST /api/customers/order/cartItems
 * [*] Plain JSON — requires Bearer token.
 */
export const validateCartItemsApi = (payload: Record<string, unknown>, token: string): Promise<AxiosResponse> => {
  const authHeader = token
    ? token.startsWith('Bearer ') ? token : `Bearer ${token}`
    : null;

  return API_MENU.post(
    '/api/customers/order/cartItems',
    payload,
    {
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    },
  );
};
