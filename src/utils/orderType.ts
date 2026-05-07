import type { SlugData } from '../types';

function normalizeOrderTypeToken(value: unknown): 'Delivery' | 'Pickup' | 'Dine In' | null {
  if (value == null) return null;

  const token = String(value).trim();
  if (!token) return null;

  const normalized = token.toUpperCase().replace(/[\s_-]/g, '');

  if (normalized === 'D' || normalized === 'DELIVERY') return 'Delivery';
  if (
    normalized === 'P' ||
    normalized === 'PICKUP' ||
    normalized === 'TAKEOUT' ||
    normalized === 'TAKEAWAY'
  ) return 'Pickup';
  if (normalized === 'I' || normalized === 'DINEIN') return 'Dine In';

  return null;
}

function getSlugOrderTypeNameById(slugData: SlugData | null | undefined, order: Record<string, unknown>): string | null {
  const orderTypes = slugData?.orderTypes || slugData?.body?.orderTypes || [];
  if (!Array.isArray(orderTypes) || orderTypes.length === 0) return null;

  const possibleIds = [
    order?.orderTypeId,
    order?.typeId,
    (order?.orderType as Record<string, unknown>)?.id,
    (order?.orderTypeInfo as Record<string, unknown>)?.id,
    (order?.orderTypeDetails as Record<string, unknown>)?.id,
  ]
    .map((id) => String(id ?? '').trim())
    .filter(Boolean);

  if (possibleIds.length === 0) return null;

  const match = orderTypes.find((t) => possibleIds.includes(String(t?.id ?? '').trim()));
  return normalizeOrderTypeToken(match?.typeName || match?.name || match?.type || null);
}

function getDeliveryFee(order: Record<string, unknown>): number {
  const totals = Array.isArray(order?.totals) ? order.totals as Record<string, unknown>[] : [];
  const deliveryLine = totals.find((t) => {
    const code = String(t?.code ?? '').trim();
    return code === '4' || code === '4.0';
  });

  const value = Number(deliveryLine?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function hasDeliveryHints(order: Record<string, unknown>): boolean {
  const addressHints = [
    order?.addressLine1,
    order?.addressLine2,
    order?.deliveryAddress,
    order?.customerAddress,
    (order?.address as Record<string, unknown>)?.addressLine1,
    (order?.address as Record<string, unknown>)?.addressLine2,
    order?.shippingAddress,
  ]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);

  if (addressHints.length > 0) return true;

  if (order?.isDelivery === true) return true;
  if (order?.isPickup === false) return true;

  const fieldDeliveryFee = Number(
    order?.deliveryFee ??
    order?.deliveryCharges ??
    order?.estimatedDeliveryFee ??
    order?.estimatedPrice ??
    0,
  );
  if (Number.isFinite(fieldDeliveryFee) && fieldDeliveryFee > 0) return true;

  if (getDeliveryFee(order) > 0) return true;

  return false;
}

export function resolveOrderTypeName(order: Record<string, unknown>, slugData: SlugData | null = null): string {
  const candidates = [
    order?.orderTypeGroup,
    order?.orderTypeName,
    order?.typeName,
    order?.orderType,
    order?.fulfillmentType,
    order?.serviceType,
    (order?.orderType as Record<string, unknown>)?.typeName,
    (order?.orderType as Record<string, unknown>)?.type,
    (order?.orderType as Record<string, unknown>)?.name,
    (order?.orderTypeInfo as Record<string, unknown>)?.typeName,
    (order?.orderTypeInfo as Record<string, unknown>)?.type,
    (order?.orderTypeInfo as Record<string, unknown>)?.name,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeOrderTypeToken(candidate);
    if (resolved) return resolved;
  }

  const fromSlug = getSlugOrderTypeNameById(slugData, order);
  if (fromSlug) return fromSlug;

  const status = String(order?.status ?? order?.orderStatus ?? '').trim();
  if (status === '14' || status === '15' || status === '50') return 'Delivery';
  if (status === '16') return 'Pickup';

  if (hasDeliveryHints(order)) return 'Delivery';

  return 'Pickup';
}
