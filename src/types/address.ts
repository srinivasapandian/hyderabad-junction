export interface Address {
  id: string;
  addressId?: string;
  customerId?: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  streetAddress?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCd?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

export interface DeliveryQuote {
  deliveryFee?: number;
  estimatedDeliveryTime?: string | number;
  deliveryProviderId?: string;
  distanceInKm?: number;
  [key: string]: unknown;
}

export interface AddressState {
  addresses: Address[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
  mutateError: string | null;
  quote: DeliveryQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  selectedAddressId: string | null;
}
