import type { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';
import { encryptJson, decryptJson } from '../../helpers/encryption';

// [*] Plain JSON — no encryption
export const requestOtpApi = (mobilePhone: string): Promise<AxiosResponse> =>
  API_MENU.post('/api/customers/auth/request-otp', {
    mobilePhone,
    sendOtpViaEmail: false,
  });

// [**] Encrypted payload & response
export const verifyOtpApi = async (mobilePhone: string, otp: string): Promise<{ data: unknown }> => {
  const payload = { mobilePhone, otp, sendOtpViaEmail: false };
  const response = await API_MENU.post('/api/customers/auth/verify-otp', {
    data: encryptJson(payload),
  });
  const decrypted = decryptJson(response.data?.encryptedText || response.data?.data || response.data);
  return { data: decrypted };
};

// [**] Encrypted payload & response — requires Bearer token
export const registerUserApi = async (userData: Record<string, unknown>, token: string): Promise<{ data: unknown }> => {
  const authHeader = token
    ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`)
    : null;
  const response = await API_MENU.put('/api/customers/user/update', {
    data: encryptJson(userData),
  }, {
    headers: {
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
  const decrypted = decryptJson(response.data?.encryptedText || response.data?.data || response.data);
  return { data: decrypted };
};
