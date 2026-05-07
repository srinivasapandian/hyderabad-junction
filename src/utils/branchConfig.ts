import type { SlugData, Branch, CustomerAppViewType } from '../types';

const MERCHANT_SLUG: string = import.meta.env.VITE_MERCHANT_SLUG || '';
export const LOCATION_SLUG: string = import.meta.env.VITE_LOCATION_SLUG || 'san-jose-ca';

const isTruthy = (value: unknown): boolean => value === 1 || value === '1' || value === true;

export function getMatchedBranchByMerchantSlug(slugData: SlugData | null, merchantSlug: string = MERCHANT_SLUG): Branch | null {
  if (!merchantSlug) return null;
  const slug = merchantSlug.trim().toLowerCase();
  return slugData?.branch?.find((b) => b?.locationSlug?.trim().toLowerCase() === slug) ?? null;
}

export function isReservationEnabledByBranch(slugData: SlugData | null, merchantSlug: string = MERCHANT_SLUG): boolean {
  const branch = getMatchedBranchByMerchantSlug(slugData, merchantSlug);
  return isTruthy(branch?.serviceDisable?.isReservation);
}

export function getCurrencySymbol(slugData: SlugData | null): string {
  const country = (slugData?.country ?? '').toUpperCase();
  if (country === 'IN') return '₹';
  if (country === 'US') return '$';
  return '$';
}

export function getCustomerAppViewType(slugData: SlugData | null): CustomerAppViewType {
  const raw = slugData?.uiFeatureFlags?.customerAppViewType;
  // ! Grid as Default
  // return String(raw).toUpperCase() === 'LIST' ? 'LIST' : 'GRID';
  // ! List as Default
  return String(raw).toUpperCase() === 'GRID' ? 'GRID' : 'LIST';
}
