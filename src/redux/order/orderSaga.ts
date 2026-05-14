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

// API disabled — safe failure without network request
function* handlePlaceOrder(_action: ReduxAction): SagaIterator {
  yield put(placeOrderFailure('This feature is coming soon. Please check back later.'));
}

function* _handlePlaceOrder_disabled(action: ReduxAction): SagaIterator {
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
// API disabled — returns empty list without network request
function* handleFetchCustomerOrders(): SagaIterator {
  yield put(fetchCustomerOrdersSuccess([]));
}

// ── Order Tracking — fetch order details + restaurant info ────────────────────
// API disabled — safe failure without network request
function* handleFetchOrderTracking(_action: ReduxAction): SagaIterator {
  yield put(fetchOrderTrackingFailure('This feature is coming soon.'));
}

export default function* orderSaga(): SagaIterator {
  yield all([
    takeLatest(PLACE_ORDER_REQUEST,           handlePlaceOrder),
    takeLatest(FETCH_CUSTOMER_ORDERS_REQUEST, handleFetchCustomerOrders),
    takeLatest(FETCH_ORDER_TRACKING_REQUEST,  handleFetchOrderTracking),
  ]);
}
