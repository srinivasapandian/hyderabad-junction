export const ORDER_STATUS_CODES: Record<string, string> = {
  ORDER_CREATED:                   '6',
  ORDER_MODIFIED:                  '7',
  ORDER_CANCELLED_CUSTOMER:        '8',
  ORDER_CANCELLED_MERCHANT:        '9',
  MERCHANT_ACCEPTED:               '11',
  ORDER_BEING_PREPARED:            '12',
  EVENT_ORDER_BEING_PREPARATION:   '70',
  ORDER_READY:                     '13',
  ORDER_OUT_FOR_DELIVERY:          '14',
  ORDER_DELIVERED:                 '15',
  ORDER_PICKED_UP:                 '16',
  ORDER_COMPLETE:                  '17',
  PAYMENT_INITIATED:               '18',
  PAYMENT_SUCCESS:                 '19',
  PAYMENT_FAILURE_DECLINED:        '20',
  PAYMENT_FAILURE_GATEWAY_ERROR:   '21',
  PAYMENT_FAILURE_MAGIL_APP_ERROR: '22',
  PAYMENT_FAILURE_SIGN_MISMATCH:   '23',
  ORDER_KOT_READY:                 '43',
  ITEM_IN_PREPARATION:             '41',
  ITEM_READY:                      '42',
  PAYMENT_AT_LOCATION_INITIATED:   '25',
  VALET_REACHED_DESTINATION:       '50',
  ORDER_SERVED:                    '59',
  CONTACTLESS_ORDER_SERVED:        '60',
};

const S = ORDER_STATUS_CODES;

// ── Step 0: Queued / Waiting ──────────────────────────────────────────────────
// Waiting step is "colored" (pulsing). No ETA yet.
const STEP_CONFIRMED = new Set([
  S.ORDER_CREATED,                  // 6  – just placed, no ETA
  S.ORDER_MODIFIED,                 // 7  – intermediate
  S.PAYMENT_INITIATED,              // 18 – payment being processed
  S.PAYMENT_SUCCESS,                // 19 – payment confirmed, queued (NOT completed)
  S.PAYMENT_AT_LOCATION_INITIATED,  // 25 – pay-at-location, queued
]);

// ── Step 1: Being Prepared ────────────────────────────────────────────────────
// Waiting=tick, Preparing=colored/pulsing.
const STEP_PREPARING = new Set([
  S.MERCHANT_ACCEPTED,              // 11 – accepted, about to prepare
  S.ORDER_BEING_PREPARED,           // 12 – actively preparing
  S.ORDER_KOT_READY,               // 43 – KOT ready, still preparing
  S.EVENT_ORDER_BEING_PREPARATION,  // 70 – event order preparing
]);

// ── Step 2: Ready / Out for Delivery ─────────────────────────────────────────
// Waiting=tick, Preparing=tick, ReadyPickUp=colored/pulsing.
const STEP_READY = new Set([
  S.ORDER_READY,                   // 13 – ready for pickup/delivery
  S.ORDER_OUT_FOR_DELIVERY,        // 14 – out for delivery
  S.VALET_REACHED_DESTINATION,     // 50 – valet at destination
]);

// ── Step 3: Completed ─────────────────────────────────────────────────────────
// All steps ticked. "Hope you enjoyed our service."
const STEP_DONE = new Set([
  S.ORDER_DELIVERED,               // 15 – delivered
  S.ORDER_PICKED_UP,               // 16 – picked up
  S.ORDER_COMPLETE,                // 17 – dine-in complete
  S.ORDER_SERVED,                  // 59 – dine-in served
  S.CONTACTLESS_ORDER_SERVED,      // 60 – contactless served
]);

// ── Cancelled ─────────────────────────────────────────────────────────────────
const STEP_CANCELLED = new Set([
  S.ORDER_CANCELLED_CUSTOMER,      // 8
  S.ORDER_CANCELLED_MERCHANT,      // 9
]);

// ── Queued statuses where ETA is unavailable ("Will be updated soon") ─────────
export const ETA_UNAVAILABLE_STATUSES = new Set([
  S.ORDER_CREATED,                 // 6
  S.PAYMENT_SUCCESS,               // 19
  S.PAYMENT_AT_LOCATION_INITIATED, // 25
]);

// ── Payment-processing status ─────────────────────────────────────────────────
export const PAYMENT_PROCESSING_STATUS = S.PAYMENT_INITIATED; // 18

/**
 * Returns timeline step index 0–3 (or -1 for cancelled).
 * Input: raw status string or number from API response.
 */
export function resolveActiveStep(status: string | number | undefined, order?: Record<string, unknown>): number {
  if (order?.isTransactionCompleted) return 3;
  const s = String(status ?? order?.status ?? order?.orderStatus ?? '');
  if (STEP_DONE.has(s))      return 3;
  if (STEP_READY.has(s))     return 2;
  if (STEP_PREPARING.has(s)) return 1;
  if (STEP_CANCELLED.has(s)) return -1;
  if (STEP_CONFIRMED.has(s)) return 0;
  // Numeric fallback for legacy / unknown codes
  const n = Number(s);
  if (!isNaN(n)) {
    if (n >= 15) return 3;
    if (n >= 13) return 2;
    if (n >= 11) return 1;
    if (n >= 6)  return 0;
  }
  return 0;
}

/**
 * Human-readable status label for pills and badges.
 */
export function resolveStatusLabel(status: string | number | undefined, order?: Record<string, unknown>): string {
  if (order?.isTransactionCompleted) return 'Completed';
  const s = String(status ?? order?.status ?? order?.orderStatus ?? '');

  if (STEP_CANCELLED.has(s))                                   return 'Cancelled';
  if (STEP_DONE.has(s))                                        return 'Completed';
  if (s === S.ORDER_OUT_FOR_DELIVERY
    || s === S.VALET_REACHED_DESTINATION)                      return 'Out for Delivery';
  if (STEP_READY.has(s))                                       return 'Order Ready';
  if (s === S.ORDER_BEING_PREPARED
    || s === S.EVENT_ORDER_BEING_PREPARATION)                  return 'Being Prepared';
  if (s === S.ORDER_KOT_READY)                                 return 'Order Ready';
  if (s === S.MERCHANT_ACCEPTED)                               return 'Order Accepted';
  if (s === S.PAYMENT_INITIATED)                               return 'Processing Payment';
  if (STEP_CONFIRMED.has(s))                                   return 'In Queue';

  // Numeric fallback
  const n = Number(s);
  if (!isNaN(n)) {
    if (n >= 15) return 'Completed';
    if (n >= 13) return 'Order Ready';
    if (n >= 11) return 'Being Prepared';
    if (n >= 6)  return 'In Queue';
  }
  return 'Received';
}

/**
 * Whether an order should be removed from the active-orders bar.
 * Includes both terminal success states and cancellations.
 */
export function isOrderCompleted(order: Record<string, unknown>): boolean {
  const raw = (order?._raw || order) as Record<string, unknown>;
  const s   = String(raw?.status ?? raw?.orderStatus ?? order?.orderStatus ?? '');
  return !!(
    raw?.isTransactionCompleted ||
    STEP_DONE.has(s)            ||
    STEP_CANCELLED.has(s)
  );
}

/**
 * Whether the order status is still active (should stay in active-orders bar).
 */
export function isOrderActive(order: Record<string, unknown>): boolean {
  return !isOrderCompleted(order);
}
