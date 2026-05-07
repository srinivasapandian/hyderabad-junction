/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import type { RootState } from '../../../types';
import DeliveryIcon from '../../../components/DeliveryIcon/DeliveryIcon';
import { fetchOrderTrackingRequest, clearOrderTracking } from '../../../redux/order/orderActions';
import { removeActiveOrderAction } from '../../../redux/activeOrders/activeOrdersReducer';
import {
  resolveActiveStep,
  resolveStatusLabel,
  isOrderCompleted,
  ETA_UNAVAILABLE_STATUSES,
  PAYMENT_PROCESSING_STATUS,
} from '../../../constants/orderStatus';
import { resolveOrderTypeName } from '../../../utils/orderType';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import PageBg from '../../../components/pageBg/PageBg';
import './OrderTracking.css';

/* ── ETA helpers ──────────────────────────────────────────────────────────── */
function resolveTimeZone(order: any, locationInfo: any): string | undefined {
  const address = order?.restaurantInfo?.restaurantAddress || locationInfo?.addressLine1 || '';
  if (/texas|\btx\b|sachse|dallas/i.test(address)) return 'America/Chicago';
  if (/california|\bca\b/i.test(address))           return 'America/Los_Angeles';
  if (/new york|\bny\b/i.test(address))             return 'America/New_York';
  if (/india|tamil nadu|chennai/i.test(address))    return 'Asia/Kolkata';
  return undefined;
}

function buildEtaDate(etaDate: string | undefined, etaTime: string | undefined): Date {
  const base     = etaDate ? new Date(etaDate) : new Date();
  const timePart = etaTime ? new Date(etaTime) : null;
  return new Date(Date.UTC(
    base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(),
    timePart?.getUTCHours() ?? 0, timePart?.getUTCMinutes() ?? 0, 0,
  ));
}

function formatEta(etaDate: string | undefined, etaTime: string | undefined, timeZone: string | undefined) {
  const combined = buildEtaDate(etaDate, etaTime);
  const opts     = timeZone ? { timeZone } : {};
  return {
    dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', ...opts }).format(combined),
    timeLabel: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', ...opts }).format(combined),
    tzLabel:   timeZone
      ? new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', ...opts })
          .formatToParts(combined).find((p) => p.type === 'timeZoneName')?.value || ''
      : '',
  };
}

/* ── Timeline steps ───────────────────────────────────────────────────────── */
interface StepDef {
  label: string;
  icon: string;
}

function getSteps(orderType: string): StepDef[] {
  if (orderType === 'Delivery') {
    return [
      { label: 'Order has been confirmed',          icon: 'fa-check'    },
      { label: 'Order Preparation is in progress',  icon: 'fa-fire'     },
      { label: 'Order is ready for delivery',       icon: 'fa-box'      },
      { label: 'Your order is out for delivery',    icon: 'delivery'    },
      { label: 'Hope you enjoyed our service',      icon: 'fa-utensils' },
    ];
  }
  return [
    { label: 'Order has been confirmed',            icon: 'fa-check'    },
    { label: 'Order Preparation is in progress',    icon: 'fa-fire'     },
    { label: 'Order is ready for Pickup',           icon: 'fa-box'      },
    { label: 'Hope you enjoyed our service',        icon: 'fa-utensils' },
  ];
}

/* ── Step state resolver ──────────────────────────────────────────────────────
 * Returns { active: number|null, completed: number, cancelled: boolean }
 *   active    — index of the currently in-progress step (pulsing), or null
 *   completed — highest index of a fully-done (green) step (-1 = none done)
 *   cancelled — true when order is cancelled
 * ─────────────────────────────────────────────────────────────────────────── */
interface StepState {
  active: number | null;
  completed: number;
  cancelled: boolean;
}

function resolveStepState(status: string, orderType: string): StepState {
  const s = String(status ?? '');

  // Cancelled
  if (s === '9' || s === '8') return { active: null, completed: -1, cancelled: true };

  // Payment-processing — no timeline step highlighted (hero text handles it)
  if (s === '18' || s === '19') return { active: null, completed: -1, cancelled: false };

  if (orderType === 'Delivery') {
    // ── Delivery (5 steps, 0-indexed) ──────────────────────────────────────
    // Step 0: Order has been confirmed
    // Step 1: Order Preparation is in progress
    // Step 2: Order is ready for delivery
    // Step 3: Your order is out for delivery
    // Step 4: Hope you enjoyed our service
    //
    // Pattern: status N → prev steps green, current step blinks, next steps grey
    if (s === '15') return { active: null, completed: 4, cancelled: false }; // all green
    if (s === '14') return { active: 4,    completed: 3, cancelled: false }; // step 3 green, step 4 blinks
    if (s === '13') return { active: 3,    completed: 2, cancelled: false }; // step 2 green, step 3 blinks
    if (s === '43') return { active: 2,    completed: 1, cancelled: false }; // step 1 green, step 2 blinks
    if (s === '11' || s === '12') return { active: 1, completed: 0, cancelled: false }; // step 0 green, step 1 blinks
    // 25, 6, 7 → step 0 blinks
    return { active: 0, completed: -1, cancelled: false };
  }

  // ── Pickup ───────────────────────────────────────────────────────────────
  // Step 0 "Order has been confirmed"       → blinks at: 25, 6, 7
  // Step 1 "Order Preparation is in progress" → blinks at: 11, 12  (step 0 → green)
  // Step 2 "Order is ready for Pickup"      → blinks at: 43        (steps 0+1 → green)
  // Step 2 done (green)                     → at: 13
  // All done (green)                        → at: 16
  if (s === '16') return { active: null, completed: 3, cancelled: false };
  if (s === '13') return { active: null, completed: 2, cancelled: false };
  if (s === '43') return { active: 2,    completed: 1, cancelled: false }; // step 1 green, step 2 blinks
  if (s === '11' || s === '12') return { active: 1, completed: 0, cancelled: false }; // step 0 green, step 1 blinks
  if (s === '25' || s === '6' || s === '7') return { active: 0, completed: -1, cancelled: false }; // step 0 blinks

  // Default fallback
  return { active: 0, completed: -1, cancelled: false };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function OrderTracking() {
  const navigate = useNavigate();
  const loc      = useLocation();
  const dispatch = useDispatch();
  const slugData = useSelector((s: RootState) => s.slug.data);
  const { mobilePhone, user } = useSelector((s: RootState) => s.auth);

  const { trackingLoading, trackingOrder, restaurantDetails, trackingError } =
    useSelector((s: RootState) => s.order);

  const routerState    = (loc.state || {}) as any;
  const routerOrderId  = routerState.orderId;
  const routerOrderNo  = routerState.orderNo;
  const routerOrderType = routerState.orderType;
  const routerGrandTotal = routerState.grandTotal;
  const routerOrder    = routerState.order;

  const locationId = slugData?.id || '';

  // Live data — prefer saga-fetched, fall back to router state on first render
  const orderData    = trackingOrder || routerOrder || null;
  const locationInfo = restaurantDetails || null;

  // ── Fetch on mount (single call — no polling) ────────────────────────────
  useEffect(() => {
    if (!routerOrderId) return;
    dispatch(fetchOrderTrackingRequest(routerOrderId, locationId));
    return () => { dispatch(clearOrderTracking()); };
  }, [routerOrderId, locationId]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── When order is terminal, remove from active bar ───────────────────────
  // Saga already handles this via removeActiveOrderAction, but this guards
  // against direct page loads where the saga result drives the removal.
  useEffect(() => {
    if (!orderData) return;
    if (isOrderCompleted(orderData)) {
      dispatch(removeActiveOrderAction(orderData.orderId || routerOrderId));
    }
  }, [orderData, dispatch, routerOrderId]);

  // ── Resolved values ──────────────────────────────────────────────────────
  const orderId    = orderData?.orderId    || routerOrderId  || '';
  const orderNo    = orderData?.orderNo    || routerOrderNo  || '';
  const orderType  = routerOrderType || resolveOrderTypeName(orderData, slugData) || 'Pickup';
  const rawStatus   = String(orderData?.status ?? orderData?.orderStatus ?? '');
  const activeStep  = resolveActiveStep(rawStatus, orderData); // kept for badge / active-orders bar
  const statusLabel = resolveStatusLabel(rawStatus, orderData);
  const steps       = getSteps(orderType);
  const stepState   = resolveStepState(rawStatus, orderType);
  const allDone     = stepState.completed >= steps.length - 1;

  // True when a background refresh is happening (page already has data)
  const isRefreshing = trackingLoading && !!orderData;

  // ── ETA resolution (per skill priority) ─────────────────────────────────
  // Priority: 1. etaDate+etaTime formatted  2. "Will be updated soon" (queued)
  //           3. "Transaction being Processed" (status 18)
  const isPaymentProcessing = rawStatus === PAYMENT_PROCESSING_STATUS;
  const isEtaUnavailable    = ETA_UNAVAILABLE_STATUSES.has(rawStatus) || (!rawStatus && activeStep === 0);
  const etaDate  = orderData?.etaDate || routerState?.etaDate;
  const etaTime  = orderData?.etaTime || routerState?.etaTime;
  const timeZone = resolveTimeZone(orderData, locationInfo);
  const eta      = (etaDate || etaTime) && !isEtaUnavailable && !isPaymentProcessing
    ? formatEta(etaDate, etaTime, timeZone)
    : null;

  // ── Hero text ────────────────────────────────────────────────────────────
  const heroEyebrow = stepState.cancelled ? 'Order Cancelled'
    : allDone                            ? 'Order Complete'
    : isPaymentProcessing                ? 'Payment'
    : isEtaUnavailable                   ? 'Your order is'
    : `Estimated ${orderType === 'Delivery' ? 'delivery' : 'pickup'} around`;

  const heroTime = stepState.cancelled         ? "We're sorry"
    : allDone                                  ? 'Thank You!'
    : isPaymentProcessing                      ? 'Transaction being Processed'
    : isEtaUnavailable                         ? 'Will be updated soon'
    : eta                                      ? `${eta.dateLabel} — ${eta.timeLabel}`
    : 'Preparing your order…';

  // ── Totals ───────────────────────────────────────────────────────────────
  const orderTotals = useMemo(() => {
    const raw = (orderData?.totals || []).slice().sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder));
    if (raw.length > 0) return raw;
    const itemTotal = Number(orderData?.orderTotal || routerGrandTotal || 0) - Number(orderData?.itemTax || 0);
    return [
      { code: '1', title: 'Item Total',  value: itemTotal.toFixed(2),                                             sortOrder: '1' },
      ...(Number(orderData?.itemTax || 0) > 0
        ? [{ code: '2', title: 'Tax', value: Number(orderData.itemTax).toFixed(2), sortOrder: '2' }]
        : []),
      { code: '5', title: 'Grand Total', value: Number(orderData?.orderTotal || routerGrandTotal || 0).toFixed(2), sortOrder: '9' },
    ];
  }, [orderData, routerGrandTotal]);

  const items = orderData?.items || routerState?.order?.items || [];

  // ── Location ─────────────────────────────────────────────────────────────
  const isDelivery = orderType === 'Delivery';

  // Pickup: order tracking API only — no slug fallbacks
  const resName    = String(orderData?.branchName                              || '');
  const resAddress = String(orderData?.restaurantInfo?.restaurantAddress       || '');
  const resPhone   = String(orderData?.restaurantInfo?.restaurantPhoneNumber   || '');

  const deliveryAddrLine1 = orderData?.addressLine1 || routerState?.order?.addressLine1 || '';
  const deliveryAddrLine2 = orderData?.addressLine2 || routerState?.order?.addressLine2 || '';
  const deliveryAddress   = [deliveryAddrLine1, deliveryAddrLine2].filter(Boolean).join(', ');
  const deliveryPhone     = mobilePhone || user?.mobilePhone || '';
  const locName    = isDelivery ? '' : resName;
  const locAddress = isDelivery ? deliveryAddress : resAddress;
  const locPhone   = isDelivery ? deliveryPhone   : resPhone;

  // Hide pickup location card if none of the fields are available
  const showLocationCard = isDelivery ? !!(locAddress || locPhone) : !!(locName || locAddress || locPhone);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (trackingLoading && !orderData) {
    return (
      <PageBg className="tracking-page">
        <div className="tracking-shell">
          <div className="tracking-loading">
            <span className="tracking-spinner" /> Loading order details…
          </div>
        </div>

      </PageBg>
    );
  }

  return (
    <PageBg className="tracking-page">
      <div className="tracking-shell">

        {/* ── Hero ── */}
        <motion.div
          className="tracking-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {isRefreshing
            ? <span className="trk-shimmer trk-shimmer--eyebrow" />
            : <p className="tracking-hero__eyebrow">{heroEyebrow}</p>
          }
          {isRefreshing
            ? <span className="trk-shimmer trk-shimmer--time" />
            : (
              <h1 className={`tracking-hero__time${isEtaUnavailable || isPaymentProcessing ? ' tracking-hero__time--queued' : ''}`}>
                {heroTime}
                {eta?.tzLabel && <span>{eta.tzLabel}</span>}
              </h1>
            )
          }
          <p className="tracking-hero__order">
            Order: <span>#{orderNo || orderId?.slice(-8) || '—'}</span>
          </p>
        </motion.div>

        {/* ── Grid: Timeline + Summary ── */}
        <div className="tracking-grid">

          {/* Timeline */}
          <div className="tracking-timeline">
            {stepState.cancelled ? (
              <motion.div
                className="tracking-cancelled-illustration"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="tracking-cancelled-svg">
                  {/* Store building */}
                  <rect x="40" y="90" width="120" height="80" rx="6" fill="#013531" stroke="rgba(224,192,171,0.2)" strokeWidth="2"/>
                  {/* Roof / awning */}
                  <path d="M30 90 Q100 60 170 90" stroke="rgba(224,192,171,0.2)" strokeWidth="2" fill="#002422" strokeLinejoin="round"/>
                  {/* Door */}
                  <rect x="82" y="130" width="36" height="40" rx="4" fill="rgba(224,192,171,0.15)"/>
                  {/* Window left */}
                  <rect x="50" y="108" width="28" height="22" rx="3" fill="rgba(224,192,171,0.08)" stroke="rgba(224,192,171,0.2)" strokeWidth="1.5"/>
                  {/* Window right */}
                  <rect x="122" y="108" width="28" height="22" rx="3" fill="rgba(224,192,171,0.08)" stroke="rgba(224,192,171,0.2)" strokeWidth="1.5"/>
                  {/* Cancel circle overlay */}
                  <circle cx="145" cy="145" r="32" fill="#002422" stroke="rgba(248,113,113,0.6)" strokeWidth="2.5"/>
                  <line x1="128" y1="128" x2="162" y2="162" stroke="rgba(248,113,113,0.85)" strokeWidth="4.5" strokeLinecap="round"/>
                  <line x1="162" y1="128" x2="128" y2="162" stroke="rgba(248,113,113,0.85)" strokeWidth="4.5" strokeLinecap="round"/>
                </svg>
                <p className="tracking-cancelled-text">Order is Cancelled.<br/>Please contact merchant for more details.</p>
              </motion.div>
            ) : (
              steps.map((step, index) => {
                const { active, completed } = stepState;
                const cls = index <= completed ? 'is-done'
                  : index === active           ? 'is-active'
                  : '';
                return (
                  <motion.div
                    key={index}
                    className={`tracking-step ${cls}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="tracking-step__icon">
                      {step.icon === 'delivery'
                        ? <DeliveryIcon size={16} />
                        : <i className={`fas ${step.icon}`} />
                      }
                    </div>
                    <p className="tracking-step__label">{step.label}</p>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Summary card */}
          <div>
            <div className="tracking-card">
              <div className="tracking-card__header">
                <p className="tracking-card__title">Order Details</p>
                {isRefreshing
                  ? <span className="trk-shimmer trk-shimmer--badge" />
                  : <span className="tracking-card__badge">{statusLabel}</span>
                }
              </div>
              <div className="tracking-card__meta">
                <span>
                  {orderType === 'Delivery' ? <DeliveryIcon size={12} /> : (
                    <i className={`fas ${orderType === 'Dine In' ? 'fa-utensils' : 'fa-store'}`} style={{ fontSize: '0.75rem' }} />
                  )}
                  {' '}{orderType}
                </span>
                {items.length > 0 && (
                  <span>{items.reduce((n: number, i: Record<string, unknown>) => n + Number(i.quantity || 0), 0)} items</span>
                )}
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="tracking-items">
                  {items.slice(0, 4).map((item: Record<string, unknown>) => (
                    <div key={String(item.orderItemId || item.itemId)} className="tracking-item">
                      <span className="tracking-item__qty">{String(item.quantity)}×</span>
                      <span className="tracking-item__name">{String(item.itemName)}</span>
                      <span className="tracking-item__price">${Number(item.subTotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="tracking-items__more">+{items.length - 4} more items</p>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="tracking-totals">
                {orderTotals.map((t: Record<string, unknown>) => {
                  const val = parseFloat(String(t.value));
                  const code = String(t.code);
                  const isGrand = code === '5' || code === '5.0';
                  if (val === 0 && !isGrand) return null;
                  return (
                    <div key={code} className={`tracking-total${isGrand ? ' is-grand' : ''}`}>
                      <span>{String(t.title)}</span>
                      <span>${val.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location card — data from order tracking API */}
            {showLocationCard && (
              <div className="tracking-card tracking-card--soft">
                <p className="tracking-location__title">
                  <i className="fas fa-map-marker-alt" /> {isDelivery ? 'Delivering To' : 'Pickup Location'}
                </p>
                <div className="tracking-location__details">
                  {locName    && <p><strong>{locName}</strong></p>}
                  {locAddress && <p><i className="fas fa-map-location-dot" /> {locAddress}</p>}
                  {!isDelivery && locPhone && <p><i className="fas fa-phone" /> <a href={`tel:${locPhone}`}>{locPhone}</a></p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="tracking-actions">
          <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="tracking-actions__btn-primary">
            Order Again
          </Link>
          <Link to="/orders" className="tracking-actions__link">
            View My Orders <i className="fas fa-arrow-right" />
          </Link>
        </div>

      </div>

    </PageBg>
  );
}
