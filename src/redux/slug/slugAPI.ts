import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';
import { encryptJson } from '../../helpers/encryption';

export function fetchSlug(): Promise<AxiosResponse> {
  const payload = { slug: import.meta.env.VITE_MERCHANT_SLUG };

  return API_MENU({
    method: 'post',
    url: '/api/customers/locations/slug',
    data: { data: encryptJson(payload) },
    headers: { 'content-type': 'application/json' },
  })
}
