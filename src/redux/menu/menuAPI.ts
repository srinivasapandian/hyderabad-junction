import { API_MENU } from '../../api';
import { encryptJson, decryptJson } from '../../helpers/encryption';

interface GetOrderMenuParams {
  locationId: string;
  orderType: string;
  customerId: string;
  token: string;
}

// [**] Encrypted payload & response — requires Bearer token
export async function getOrderMenuApi({ locationId, orderType, customerId, token }: GetOrderMenuParams): Promise<{ data: unknown }> {
  const payload = {
    type: orderType,
    locationId,
    customerId: customerId || null,
    searchText: null,
    visibleTo: ['C'],
    ...(orderType === 'Delivery' ? { from: 's' } : {}),
  };

  const authHeader = token
    ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`)
    : null;

  const response = await API_MENU({
    method: 'post',
    url: '/api/customers/menu',
    data: { data: encryptJson(payload) },
    headers: {
      'content-type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const decrypted = decryptJson(response.data?.encryptedText || response.data?.data || response.data);
  return { data: decrypted };
}
