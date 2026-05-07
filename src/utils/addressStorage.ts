export interface NormalizedAddress {
  label: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  instructions: string;
}

function normalizeAddress(raw: Record<string, unknown>): NormalizedAddress | null {
  if (!raw) return null;
  return {
    label:        (raw.label as string)        || (raw.name as string)        || 'Saved Address',
    addressLine1: (raw.addressLine1 as string) || (raw.address1 as string)   || (raw.street as string) || '',
    addressLine2: (raw.addressLine2 as string) || (raw.address2 as string)   || '',
    addressLine3: (raw.addressLine3 as string) || (raw.address3 as string)   || '',
    city:         (raw.city as string)         || (raw.town as string)       || '',
    state:        (raw.state as string)        || (raw.province as string)   || '',
    postalCode:   (raw.postalCode as string)   || (raw.zipCode as string)    || (raw.zip as string) || '',
    country:      (raw.country as string)      || '',
    phone:        (raw.phone as string)        || (raw.mobilePhone as string) || '',
    instructions: (raw.instructions as string) || (raw.deliveryInstructions as string) || '',
  };
}

/**
 * Resolution chain:
 * 1. user.savedAddresses[0]
 * 2. user.addresses[0]
 * 3. user.address  (single object)
 * 4. user itself   (if it has addressLine1 / city)
 */
export function getSavedAddress(user: Record<string, unknown> | null): NormalizedAddress | null {
  if (user) {
    const savedAddresses = user.savedAddresses as Record<string, unknown>[] | undefined;
    const addresses = user.addresses as Record<string, unknown>[] | undefined;
    const fromArray =
      savedAddresses?.[0] ||
      addresses?.[0]      ||
      null;
    if (fromArray) return normalizeAddress(fromArray);

    if (user.address && typeof user.address === 'object') {
      return normalizeAddress(user.address as Record<string, unknown>);
    }

    if (user.addressLine1 || user.city) {
      return normalizeAddress(user);
    }
  }

  return null;
}

/**
 * Formats a normalized address into the three addressLine fields
 * expected by createOrder.
 * addressLine1 = "28244 Diehl Rd, Warrenville, IL, 60555"
 */
export function getAddressLinesForPayload(address: NormalizedAddress | null): { addressLine1: string; addressLine2: string; addressLine3: string } {
  if (!address) return { addressLine1: '', addressLine2: '', addressLine3: '' };

  const parts = [
    address.addressLine1,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return {
    addressLine1: parts.join(', '),
    addressLine2: address.addressLine2 || '',
    addressLine3: address.addressLine3 || '',
  };
}
