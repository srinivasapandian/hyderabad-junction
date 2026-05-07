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
function* fetchSlotsWorker(action: ReduxAction): SagaIterator {
  try {
    const token: string = yield* resolveToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any  = yield call(fetchReservationSlotsApi as CallableApi, action.payload, token);
    const data = res.data ?? {};
    yield put(fetchSlotsSuccess(data));
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
    yield put(fetchSlotsFailure(
      error?.response?.data?.message || 'Could not load available times.'
    ));
  }
}

/* ── Create (2-step: create → fetch detail) ───────────────────────────────── */
function* createReservationWorker(action: ReduxAction): SagaIterator {
  try {
    const token: string = yield* resolveToken();

    // Step 1 — create
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res1: any = yield call(createReservationApi as CallableApi, action.payload, token);
    const enc1 = res1.data?.encryptedText ?? res1.data?.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingResult: any = enc1 ? decryptJson(enc1) : (res1.data ?? {});
    const body1 = bookingResult?.body ?? bookingResult;

    const reservationId: string =
      body1?.id || body1?.reservationId ||
      bookingResult?.id || bookingResult?.reservationId || '';

    // Step 2 — fetch detail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res2: any = yield call(fetchReservationByIdApi as CallableApi, { reservationId }, token);
    const enc2 = res2.data?.encryptedText ?? res2.data?.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw2: any = enc2 ? decryptJson(enc2) : (res2.data ?? {});
    const body2 = raw2?.body ?? raw2;
    const reservationDetail = Array.isArray(body2) ? (body2[0] || {}) : body2;

    yield put(createReservationSuccess({ bookingResult: body1, reservationDetail }));
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
    yield put(createReservationFailure(
      error?.response?.data?.message || 'Booking failed. Please try again.'
    ));
  }
}

/* ── Cancel ───────────────────────────────────────────────────────────────── */
function* cancelReservationWorker(action: ReduxAction): SagaIterator {
  try {
    const token: string = yield* resolveToken();
    yield call(cancelReservationApi as CallableApi, action.payload, token);
    yield put(cancelReservationSuccess());
  } catch (err: unknown) {
    // Always dispatch success so the UI doesn't get stuck
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
    yield put(cancelReservationFailure(
      error?.response?.data?.message || 'Cancellation error.'
    ));
    yield put(cancelReservationSuccess());
  }
}

/* ── Watcher ──────────────────────────────────────────────────────────────── */
export default function* reservationSaga(): SagaIterator {
  yield takeLatest(FETCH_SLOTS_REQUEST,       fetchSlotsWorker);
  yield takeLatest(CREATE_RESERVATION_REQUEST, createReservationWorker);
  yield takeLatest(CANCEL_RESERVATION_REQUEST, cancelReservationWorker);
}
