import { API_MENU } from '../../api';
import { encryptJson, decryptJson } from '../../helpers/encryption';

const normalizeBearerToken = (token: string): string =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

const buildEncryptedHeaders = (token: string): Record<string, string> => {
  const bearer = normalizeBearerToken(token);
  return {
    'x-app-version': 'v2',
    'content-type': 'application/json',
    ...(bearer ? { Authorization: bearer } : {}),
  };
};

const decryptEncryptedResponse = (responseData: Record<string, unknown> | null): unknown => {
  const encrypted = responseData?.encryptedText ?? responseData?.data;
  if (typeof encrypted !== 'string') return responseData ?? {};
  try {
    return decryptJson(encrypted);
  } catch {
    return responseData ?? {};
  }
};

/**
 * Fetch order totals (tax, delivery charges, grand total, etc.)
 * POST /api/customers/order/totals
 * [**] Payload encrypted; response decrypted before returning.
 */
export const getOrderTotalsApi = async (payload: Record<string, unknown>, token: string): Promise<{ data: unknown }> => {
  const response = await API_MENU.post(
    '/api/customers/order/totals',
    { data: encryptJson(payload) },
    { headers: buildEncryptedHeaders(token) },
  );
  return { data: decryptEncryptedResponse(response.data) };
};
