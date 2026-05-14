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

// API disabled — clears totals without network request
function* handleFetchTotals(_action: ReduxAction): SagaIterator {
  yield put({ type: CLEAR_TOTALS });
}

export default function* totalsSaga(): SagaIterator {
  // takeLatest auto-cancels previous running saga when a new request arrives
  // Combined with the 400ms delay, this effectively debounces rapid cart changes
  yield takeLatest(FETCH_TOTALS_REQUEST, handleFetchTotals);
}
