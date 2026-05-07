/**
 * Build the payload for the order totals API.
 * Extracted from Cart.jsx so it can be reused by the totals saga.
 */

import type { CartLine, SlugData, Customization, CustomizationGrouped } from '../types';

export function getOrderTypeIdFromSlug(slugData: SlugData | null, typeName: string): string | undefined {
  const orderTypes =
    slugData?.orderTypes ||
    slugData?.body?.orderTypes ||
    [];
  return orderTypes.find(
    (t) => t?.typeName?.toLowerCase() === typeName.toLowerCase(),
  )?.id;
}

function normalizeCustomization(raw: Customization[]): CustomizationGrouped[] {
  if (!raw || raw.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Array.isArray((raw[0] as any)?.options)) {
    return (raw as CustomizationGrouped[])
      .map((g) => ({
        ...g,
        options: (g.options || []).map((opt) => ({
          ...opt,
          optionId: opt.optionId ?? opt.modifierOptionId,
          optionAvailable: opt.optionAvailable ?? 1,
          price: Number(opt.price) || 0,
        })),
      }))
      .filter((g) => g.typeAvailable !== 0);
  }

  const byType = new Map<string, CustomizationGrouped>();
  for (const row of raw) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const tid = r.typeId;
    if (!tid) continue;
    if (!byType.has(tid)) {
      byType.set(tid, {
        typeId: tid,
        type: r.type,
        typeName: r.type,
        typeAvailable: r.typeAvailable ?? 1,
        minRequired: r.minRequired ?? 0,
        maxRequired: r.maxRequired ?? 0,
        options: [],
      });
    }
    const g = byType.get(tid)!;
    const oid = r.modifierOptionId || r.optionId;
    if (!oid) continue;
    g.options.push({
      optionId: oid,
      optionName: r.optionName,
      price: Number(r.price) || 0,
      optionAvailable: r.optionAvailable ?? 1,
    });
  }
  return [...byType.values()].filter((g) => g.typeAvailable !== 0 && g.options.length > 0);
}

function buildOptionPayload(line: CartLine): { options: Record<string, unknown>[]; modifierIds: string | undefined } {
  if (!line.modifiers || line.modifiers.length === 0) {
    return { options: [], modifierIds: undefined };
  }

  const groups = normalizeCustomization(line.customization);

  const options = line.modifiers.map((m) => {
    const group = groups.find((g) => g.typeId === m.typeId) || {} as Partial<CustomizationGrouped>;
    const opt = (group.options || []).find((o) => o.optionId === m.optionId) || {} as Record<string, unknown>;
    return {
      typeId: m.typeId,
      type: group.type || group.typeName || m.typeName || '',
      sortOrder: group.sortOrder ?? 0,
      typeAvailable: group.typeAvailable ?? 1,
      isBase: null,
      minRequired: group.minRequired ?? 0,
      maxRequired: group.maxRequired ?? 0,
      modifierOptionId: m.optionId,
      optionName: m.optionName,
      optionSortOrder: (opt as Record<string, unknown>).optionSortOrder ?? 1,
      price: String(Number(m.price).toFixed(2)),
      optionAvailable: (opt as Record<string, unknown>).optionAvailable ?? 1,
      isSpinnerEnabled: false,
      quantity: '1',
      singleItemOptionQuantity: 1,
    };
  });

  const modifierIds = options.map((o) => o.modifierOptionId).join(',');
  return { options, modifierIds };
}

export default function buildTotalsPayload(cartLines: CartLine[], orderType: string, slugData: SlugData | null, customerId = '', addressId: string | null = null, deliveryFee: number | null = null): Record<string, unknown> {
  const locationId = slugData?.id || '';
  const orderTypeId =
    orderType === 'Delivery' ? getOrderTypeIdFromSlug(slugData, 'Delivery')
      : orderType === 'DineIn' ? getOrderTypeIdFromSlug(slugData, 'DineIn')
        : getOrderTypeIdFromSlug(slugData, 'Pickup');

  const orderItems = cartLines.map((line) => {
    const subTotal = (line.basePrice * line.qty).toFixed(2);
    const { options, modifierIds } = buildOptionPayload(line);

    return {
      itemId: line.itemId,
      itemName: line.itemName,
      itemAltName: line.itemAltName || '',
      price: line.basePrice.toFixed(2),
      quantity: String(line.qty),
      subTotal,
      comment: line.comment || '',
      is_discount_applied: false,
      options,
      ...(modifierIds ? { modifierIds } : {}),
      tax: line.tax || [],
      offer_data: null,
      offer_amount: 0,
      availability: null,
      stockQuantity: null,
      alertQuantity: null,
    };
  });

  return {
    discountType: 'FLATFEE',
    orderItems,
    orderTypeId,
    locationId,
    tip: 0,
    tipType: 'FLATFEE',
    customerId: customerId || '',
    ...(addressId    ? { addressId }              : {}),
    ...(deliveryFee != null ? { deliveryFee }     : {}),
  };
}
