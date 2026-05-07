import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';
import { encryptJson, decryptJson } from '../../helpers/encryption';

const normalizeBearerToken = (token: string): string =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

const buildEncryptedHeaders = (token: string, headers: Record<string, string> = {}): Record<string, string> => {
  const bearer = normalizeBearerToken(token);
  return {
    'x-app-version': 'v2',
    'content-type': 'application/json',
    ...headers,
    ...(bearer ? { Authorization: bearer } : {}),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const decryptEncryptedResponse = (responseData: any): unknown => {
  const encrypted = responseData?.encryptedText ?? responseData?.data;
  if (typeof encrypted !== 'string') return responseData ?? {};

  try {
    return decryptJson(encrypted);
  } catch {
    return responseData ?? {};
  }
};

/**
 * Create a new customer order.
 * [**] Full payload is encrypted before sending.
 * Response payload is decrypted before returning.
 */
export const createOrderApi = async (payload: unknown, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/api/customers/order/createOrder',
    { data: encryptJson(payload) },
    { headers: buildEncryptedHeaders(token) },
  );

  return { data: decryptEncryptedResponse(response.data) };
};

/**
 * Initiate offline payment.
 * [**] Payload is encrypted and sent in query param `data`.
 * Response payload is decrypted before returning.
 */
export const initiateOfflinePaymentApi = async (payload: unknown, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/api/customers/payment/initiate-offline-payment',
    null,
    {
      params: { data: encryptJson(payload) },
      headers: buildEncryptedHeaders(token),
    },
  );

  return { data: decryptEncryptedResponse(response.data) };
};

/**
 * Start card-not-present (CNP) transaction.
 * [**] Payload is encrypted in request body as { data }.
 * Response payload is decrypted before returning.
 */
export const startTransactionApi = async (payload: unknown, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/api/customers/payment/start-transaction',
    { data: encryptJson(payload) },
    { headers: buildEncryptedHeaders(token) },
  );

  return { data: decryptEncryptedResponse(response.data) };
};

/**
 * Fetch full order details by orderId.
 * POST /api/customers/order/customer
 * [**] Payload encrypted; response decrypted before returning.
 * Payload: { orderId, splitId: "", transactionId: "" }
 */
export const fetchOrderDetailsApi = async (orderId: string, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/api/customers/order/customer',
    { data: encryptJson({ orderId, splitId: '', transactionId: '' }) },
    { headers: buildEncryptedHeaders(token) },
  );
  return { data: decryptEncryptedResponse(response.data) };
};

/**
 * Fetch all past orders for a customer at a location.
 * GET /api/customers/orders
 * [*] Plain JSON response — requires Bearer token.
 */
export const fetchCustomerOrdersApi = (customerId: string, locationId: string, token: string): Promise<AxiosResponse> => {
  const bearer = normalizeBearerToken(token);
  return API_MENU.get('/api/customers/orders', {
    params:  { customerId, locationId },
    headers: {
      'x-app-version': 'v2',
      ...(bearer ? { Authorization: bearer } : {}),
    },
  });
};

/**
 * Get location details for order tracking.
 * POST /merchants/locations/id
 * [**] Payload encrypted; response decrypted before returning.
 * Payload: { staffId: null, locationId }
 */
export const fetchRestaurantDetailsApi = async (locationId: string, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/merchants/locations/id',
    { data: encryptJson({ staffId: null, locationId }) },
    { headers: buildEncryptedHeaders(token) },
  );
  return { data: decryptEncryptedResponse(response.data) };
};
