import type { SlugData } from '../types';

export const paymentTenderTypes = {
  CNP: 'CNP',
  PaymentLinks: 'PAYMENT_LINKS',
  BharatQR: 'BHARAT_QR',
  POS: 'POS',
} as const;

export const paymentCurrencies: Record<string, string> = {
  US: 'USD',
  INR: 'INR',
};

export function resolvePaymentCurrencyFromSlug(slugData: SlugData | null): string {
  const country = String(
    slugData?.country ||
    slugData?.countryCd ||
    slugData?.countryCode ||
    'US',
  ).toUpperCase();

  return paymentCurrencies[country] || paymentCurrencies.US;
}
