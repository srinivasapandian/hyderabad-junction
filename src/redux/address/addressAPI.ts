import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';
import { handleEncrypt, encryptJson, decryptJson } from '../../helpers/encryption';

const authHeader = (token: string): string | null =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;

const bearerHeaders = (token: string): Record<string, string> => ({
  'content-type': 'application/json',
  ...(authHeader(token) ? { Authorization: authHeader(token) as string } : {}),
});

// ── Fetch  [*] ────────────────────────────────────────────────────────────────
export const fetchAddressApi = (customerId: string, token: string): Promise<AxiosResponse> =>
  API_MENU.get('/api/customers/order/fetch-address', {
    params:  { customerId },
    headers: bearerHeaders(token),
  });

// ── Save  [*] ─────────────────────────────────────────────────────────────────
export const saveAddressApi = (payload: unknown, token: string): Promise<AxiosResponse> =>
  API_MENU.post('/api/customers/order/save-address', payload, {
    headers: bearerHeaders(token),
  });

// ── Update  [*] ───────────────────────────────────────────────────────────────
export const updateAddressApi = (addressId: string, payload: unknown, token: string): Promise<AxiosResponse> =>
  API_MENU.put(`/api/customers/order/update-address/${addressId}`, payload, {
    headers: bearerHeaders(token),
  });

// ── Delete  [*] ───────────────────────────────────────────────────────────────
export const deleteAddressApi = (addressId: string, token: string): Promise<AxiosResponse> =>
  API_MENU.delete(`/api/customers/order/remove-address/${addressId}`, {
    headers: bearerHeaders(token),
  });

// ── Delivery Quote  [**] ──────────────────────────────────────────────────────
// payload already contains deliveryProviderId as plain string (encrypted inside body)
// + same value encrypted separately as query param — API expects both
export const deliveryQuoteApi = async (payload: Record<string, unknown>, token: string): Promise<{ data: unknown }> => {
  const encryptedProviderId = payload.deliveryProviderId
    ? handleEncrypt(payload.deliveryProviderId as string)
    : '';

  const response = await API_MENU.post(
    '/api/customers/delivery/quote',
    { data: encryptJson(payload) },
    {
      params:  { deliveryProviderId: encryptedProviderId },
      headers: bearerHeaders(token),
    },
  );

  const raw = response.data?.encryptedText || response.data?.data || response.data;
  try {
    const decrypted = decryptJson(raw);
    return { data: decrypted };
  } catch {
    return { data: response.data };
  }
};
