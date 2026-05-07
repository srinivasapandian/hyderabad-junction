import type { SagaIterator } from 'redux-saga';
import { all, call, fork, put, select, takeLatest } from 'redux-saga/effects';
import {
  PLACE_ORDER_REQUEST,
  FETCH_CUSTOMER_ORDERS_REQUEST,
  FETCH_ORDER_TRACKING_REQUEST,
} from './orderConstants';
import {
  placeOrderSuccess, placeOrderFailure,
  fetchCustomerOrdersSuccess, fetchCustomerOrdersFailure,
  fetchOrderTrackingSuccess, fetchOrderTrackingFailure,
} from './orderActions';
import {
  addActiveOrderAction,
  updateSingleActiveOrderAction,
  removeActiveOrderAction,
} from '../activeOrders/activeOrdersReducer';
import { isOrderCompleted } from '../../constants/orderStatus';
import {
  createOrderApi,
  initiateOfflinePaymentApi,
  startTransactionApi,
  fetchCustomerOrdersApi,
  fetchOrderDetailsApi,
  fetchRestaurantDetailsApi,
} from './orderAPI';
import { paymentTenderTypes, resolvePaymentCurrencyFromSlug } from '../../constants/paymentConstants';
import type { ReduxAction, RootState } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveToken(auth: any): string {
  const { token, user } = auth || {};
  if (token) return token;

  return (
    user?.access_token ||
    user?.token ||
    user?.accessToken ||
    user?.authToken ||
    ''
  );
}

function* handlePlaceOrder(action: ReduxAction): SagaIterator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    orderPayload,
    orderType,
    grandTotal,
    etaDate,
    etaTime,
    paymentMethod,
    cardPayment,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = action.payload as any;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth: any     = yield select((s: RootState) => s.auth || {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slugData: any = yield select((s: RootState) => s.slug.data);
    const rawToken: string = resolveToken(auth);

    if (!rawToken) {
      yield put(placeOrderFailure('Session expired. Please sign in again.'));
      return;
    }

    // 1. Create order ([**] encrypted request/response handled in API layer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = yield call(createOrderApi, orderPayload, rawToken);
    const data = res.data ?? {};
    const body = data?.body || data;
    const order = body?.order || body;
    const orderId: string = body?.orderId || order?.orderId || body?.id || '';
    const orderNo: string = body?.orderNo || order?.orderNo || '';

    if (!orderId) {
      yield put(placeOrderFailure('Order creation failed. Please try again.'));
      return;
    }

    const customerIdForPayment: string =
      orderPayload?.customerId || auth?.customerId || auth?.user?.customerId || '';
    const paymentCurrency: string = cardPayment?.paymentCurrency || resolvePaymentCurrencyFromSlug(slugData);
    const totalPaymentAmount: string = String(
      grandTotal ?? body?.orderTotal ?? order?.orderTotal ?? orderPayload?.orderTotal ?? 0,
    );

    // 2. Payment
    // - Card (CNP): blocking call; fail order flow if transaction does not complete.
    // - Offline (Pay at Store / Pay on Delivery): non-blocking fire-and-forget.
    if (paymentMethod === paymentTenderTypes.CNP) {
      const paymentProviderId: string =
        cardPayment?.paymentProviderId ||
        import.meta.env.VITE_PAYMENT_PROVIDER_ID;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactionRes: any = yield call(
        startTransactionApi,
        {
          customerId: customerIdForPayment,
          locationId: orderPayload?.locationId || slugData?.id || '',
          orderId,
          totalPaymentAmount,
          paymentCurrency,
          accountNumber: cardPayment?.accountNumber || '',
          tenderType: paymentTenderTypes.CNP,
          postalCode: cardPayment?.postalCode || '',
          streetCode: cardPayment?.streetCode || '',
          cvv: cardPayment?.cvv || '',
          recaptchaToken: cardPayment?.recaptchaToken,
          expiryMonth: cardPayment?.expiryMonth || '',
          expiryYear: cardPayment?.expiryYear || '',
          needToUpdateOrderStatus: true,
          paymentProviderId,
        },
        rawToken,
      );

      const tx = transactionRes?.data?.body || transactionRes?.data || {};
      const isPaymentCompleted = tx?.isPaymentCompleted === true || String(tx?.paymentStatus || '') === '19';

      if (!isPaymentCompleted || tx?.isToRetryPayment) {
        yield put(placeOrderFailure(tx?.responseMessage || 'Card payment failed. Please try again.'));
        return;
      }
    } else {
      yield fork(function* (): SagaIterator {
        try {
          yield call(
            initiateOfflinePaymentApi,
            {
              customerId: customerIdForPayment,
              orderId,
              totalPaymentAmount,
              paymentCurrency,
              amountTendered: 0,
              tenderType: paymentTenderTypes.POS,
            },
            rawToken,
          );
        } catch {
          // Staff can still collect payment manually; order flow stays successful.
        }
      });
    }

    // 3. Add to active orders tracker (triggers polling via watchPolling below)
    // addedAt is set by the reducer; cast to satisfy the action creator signature
    yield put(addActiveOrderAction({
      orderId,
      orderNo,
      orderType,
      orderStatus: body?.orderStatus || order?.status || 0,
      etaDate,
      etaTime,
      grandTotal,
      addedAt: Date.now(),
      _raw: body?.order || body,
    }));

    // 4. Signal success - Checkout.jsx watches this to clearCart + navigate
    yield put(placeOrderSuccess({
      orderId,
      orderNo,
      orderType,
      grandTotal,
      etaDate,
      etaTime,
      order: body?.order || body,
    }));
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
    yield put(
      placeOrderFailure(
        error?.response?.data?.message || error.message || 'Something went wrong. Please try again.',
      ),
    );
  }
}

// ── Customer Orders — fetch all past orders ───────────────────────────────────
function* handleFetchCustomerOrders(): SagaIterator {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth: any       = yield select((s: RootState) => s.auth || {});
    const token: string      = resolveToken(auth);
    const customerId: string = auth?.customerId || auth?.user?.customerId || '';
    const locationId: string = yield select((s: RootState) => s.slug.data?.id || '');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(fetchCustomerOrdersApi, customerId, locationId, token);
    const data = response.data;
    const orders = Array.isArray(data) ? data
      : Array.isArray(data?.body)      ? data.body
      : data?.orders || data?.orderList || [];

    yield put(fetchCustomerOrdersSuccess(orders));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(fetchCustomerOrdersFailure(err?.response?.data?.message || err.message));
  }
}

// ── Order Tracking — fetch order details + restaurant info ────────────────────
function* handleFetchOrderTracking(action: ReduxAction): SagaIterator {
  const { orderId, locationId } = action.payload as { orderId: string; locationId: string };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth: any  = yield select((s: RootState) => s.auth || {});
    const token: string = resolveToken(auth);

    // Fetch order details and restaurant details in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orderRes, restaurantRes]: any[] = yield all([
      call(fetchOrderDetailsApi, orderId, token),
      locationId ? call(fetchRestaurantDetailsApi, locationId, token) : call(() => ({ data: null })),
    ]);

    // Merge fresh data with existing to preserve items/totals/ETA if API returns empty
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = yield select((s: RootState) => s.order.trackingOrder);
    const fresh    = orderRes.data?.body || orderRes.data || {};

    const orderData = fresh?.orderId ? {
      ...fresh,
      items:      fresh.items?.length  ? fresh.items  : (existing?.items  || []),
      totals:     fresh.totals?.length ? fresh.totals : (existing?.totals || []),
      orderTotal: fresh.orderTotal     || existing?.orderTotal || 0,
      etaDate:    fresh.etaDate        || existing?.etaDate    || null,
      etaTime:    fresh.etaTime        || existing?.etaTime    || null,
    } : existing;

    const restaurantDetails = restaurantRes.data?.body || restaurantRes.data || null;

    yield put(fetchOrderTrackingSuccess({ orderData, restaurantDetails }));

    // ── Sync active orders bar immediately with fresh status ──────────────
    if (orderData?.orderId) {
      if (isOrderCompleted(orderData)) {
        // Terminal state (delivered / picked-up / cancelled) → remove from bar
        yield put(removeActiveOrderAction(orderData.orderId));
      } else {
        // Still in progress → update the pill with fresh status + ETA
        yield put(updateSingleActiveOrderAction(orderData));
      }
    }
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
    yield put(fetchOrderTrackingFailure(error?.message || 'Failed to load order details.'));
  }
}

export default function* orderSaga(): SagaIterator {
  yield all([
    takeLatest(PLACE_ORDER_REQUEST,           handlePlaceOrder),
    takeLatest(FETCH_CUSTOMER_ORDERS_REQUEST, handleFetchCustomerOrders),
    takeLatest(FETCH_ORDER_TRACKING_REQUEST,  handleFetchOrderTracking),
  ]);
}
