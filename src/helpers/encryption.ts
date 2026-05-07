import CryptoJS from 'crypto-js';

const getKey = (): string => import.meta.env.VITE_E_KEY;

export const handleEncrypt = (dataToEncrypt: string): string => {
  const secretKey = getKey();
  const utf8SecretKey = CryptoJS.enc.Utf8.parse(secretKey);
  const utf8Data = CryptoJS.enc.Utf8.parse(dataToEncrypt);
  return CryptoJS.AES.encrypt(utf8Data, utf8SecretKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
};

export const handleDecrypt = (dataToDecrypt: string): string => {
  const secretKey = getKey();
  const utf8SecretKey = CryptoJS.enc.Utf8.parse(secretKey);
  return CryptoJS.AES.decrypt(dataToDecrypt, utf8SecretKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
};

export const encryptJson = (json: unknown): string => handleEncrypt(JSON.stringify(json));

export const decryptJson = (encrypted: string): unknown => JSON.parse(handleDecrypt(encrypted));
