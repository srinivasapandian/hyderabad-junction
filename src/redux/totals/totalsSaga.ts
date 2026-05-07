import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeLatest, delay } from 'redux-saga/effects';
import { FETCH_TOTALS_REQUEST, FETCH_TOTALS_SUCCESS, FETCH_TOTALS_FAILURE, CLEAR_TOTALS } from './totalsConstants';
import { getOrderTotalsApi } from './totalsAPI';
import { AUTH_KEY } from '../auth/authConstants';
import buildTotalsPayload from '../../utils/buildTotalsPayload';
import type { ReduxAction, CartLine, RootState } from '../../types';
import type { AxiosError } from 'axios';

interface AuthState {
  customerId?: string;
  user?: { access_token?: string; token?: string; accessToken?: string; customerId?: string } | null;
}

function resolveToken(auth: AuthState): string {
  const { user } = auth || {};
  const direct = user?.access_token || user?.token || user?.accessToken || '';
  if (direct) return direct;
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    return stored?.user?.access_token || stored?.user?.token || stored?.user?.accessToken || '';
  } catch {
    return '';
  }
}

function* handleFetchTotals(action: ReduxAction): SagaIterator {
  try {
    // Debounce: if another FETCH_TOTALS_REQUEST arrives within 400ms, this one is cancelled
    yield delay(400);

    const cartLines: CartLine[]  = (yield select((s: RootState) => s.cart.cartLines)) as CartLine[];
    const orderType: string  = (yield select((s: RootState) => s.cart.orderType)) as string;
    const slugData: Parameters<typeof buildTotalsPayload>[2]   = (yield select((s: RootState) => s.slug.data)) as Parameters<typeof buildTotalsPayload>[2];
    const auth: AuthState       = (yield select((s: RootState) => s.auth)) as AuthState;
    const customerId: string = auth?.customerId || auth?.user?.customerId || '';
    const token: string      = resolveToken(auth);

    const availableLines = cartLines.filter((l) => !l.unavailable);

    if (!availableLines.length) {
      yield put({ type: CLEAR_TOTALS });
      return;
    }

    const selectedAddressId: string | null = (yield select((s: RootState) => s.address.selectedAddressId)) as string | null;
    const deliveryFee: number | null = (action.payload as { deliveryFee?: number | null })?.deliveryFee ?? null;
    const payload  = buildTotalsPayload(availableLines, orderType, slugData, customerId, selectedAddressId, deliveryFee);
    const response: { data: Record<string, unknown> } = (yield call(getOrderTotalsApi, payload, token)) as { data: Record<string, unknown> };

    // Response is already decrypted by getOrderTotalsApi
    const inner = (response.data ?? {}) as Record<string, unknown>;
    const totalsArr =
      Array.isArray(inner?.orderTotals) ? inner.orderTotals
        : Array.isArray(inner?.totals) ? inner.totals
          : null;
    const grandFromTotals = totalsArr?.find((t: Record<string, unknown>) => t.code === '5')?.value ?? null;
    const grandTotal      = inner?.orderTotal ?? grandFromTotals ?? null;

    yield put({
      type: FETCH_TOTALS_SUCCESS,
      payload: { totals: totalsArr, grandTotal },
    });
  } catch (error) {
    const err = error as AxiosError;
    yield put({
      type: FETCH_TOTALS_FAILURE,
      payload: err?.response?.data || err.message,
    });
  }
}

export default function* totalsSaga(): SagaIterator {
  // takeLatest auto-cancels previous running saga when a new request arrives
  // Combined with the 400ms delay, this effectively debounces rapid cart changes
  yield takeLatest(FETCH_TOTALS_REQUEST, handleFetchTotals);
}
