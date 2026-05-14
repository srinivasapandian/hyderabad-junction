import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_SLOTS_REQUEST,
  CREATE_RESERVATION_REQUEST,
  CANCEL_RESERVATION_REQUEST,
} from './reservationConstants';
import {
  fetchSlotsSuccess, fetchSlotsFailure,
  createReservationSuccess, createReservationFailure,
  cancelReservationSuccess, cancelReservationFailure,
} from './reservationActions';
import {
  fetchReservationSlotsApi,
  createReservationApi,
  fetchReservationByIdApi,
  cancelReservationApi,
} from './reservationAPI';
import { decryptJson } from '../../helpers/encryption';
import type { ReduxAction, RootState } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallableApi = (...args: any[]) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* resolveToken(): Generator<any, string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth: any = yield select((s: RootState) => s.auth);
  const user = auth?.user;
  return user?.access_token || user?.token || user?.accessToken || '';
}

/* ── Slots ────────────────────────────────────────────────────────────────── */
// API disabled — safe failure without network request
function* fetchSlotsWorker(_action: ReduxAction): SagaIterator {
  yield put(fetchSlotsFailure('This feature is coming soon.'));
}

/* ── Create ───────────────────────────────────────────────────────────────── */
// API disabled — safe failure without network request
function* createReservationWorker(_action: ReduxAction): SagaIterator {
  yield put(createReservationFailure('This feature is coming soon.'));
}

/* ── Cancel ───────────────────────────────────────────────────────────────── */
// API disabled — safe success without network request
function* cancelReservationWorker(_action: ReduxAction): SagaIterator {
  yield put(cancelReservationSuccess());
}

/* ── Watcher ──────────────────────────────────────────────────────────────── */
export default function* reservationSaga(): SagaIterator {
  yield takeLatest(FETCH_SLOTS_REQUEST,       fetchSlotsWorker);
  yield takeLatest(CREATE_RESERVATION_REQUEST, createReservationWorker);
  yield takeLatest(CANCEL_RESERVATION_REQUEST, cancelReservationWorker);
}
