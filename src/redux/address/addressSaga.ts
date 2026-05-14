import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_ADDRESS_REQUEST,
  SAVE_ADDRESS_REQUEST,
  UPDATE_ADDRESS_REQUEST,
  DELETE_ADDRESS_REQUEST,
  DELIVERY_QUOTE_REQUEST,  // invoked from Checkout on address selection
} from './addressConstants';
import {
  fetchAddressSuccess, fetchAddressFailure,
  saveAddressSuccess,  saveAddressFailure,
  updateAddressSuccess, updateAddressFailure,
  deleteAddressSuccess, deleteAddressFailure,
  deliveryQuoteSuccess, deliveryQuoteFailure,
  fetchAddressRequest,
  setSelectedAddressId,
} from './addressActions';
import { fetchTotalsRequest } from '../totals/totalsActions';
import {
  fetchAddressApi,
  saveAddressApi,
  updateAddressApi,
  deleteAddressApi,
  deliveryQuoteApi,
} from './addressAPI';
import type { ReduxAction, RootState } from '../../types';

// ── Token helper ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* getToken(): Generator<any, string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = yield select((s: RootState) => s.auth.user);
  return user?.access_token || '';
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
// API disabled — returns empty list without network request
function* handleFetchAddress(_action: ReduxAction): SagaIterator {
  yield put(fetchAddressSuccess([]));
}

// ── Save ──────────────────────────────────────────────────────────────────────
// API disabled — safe failure without network request
function* handleSaveAddress(_action: ReduxAction): SagaIterator {
  yield put(saveAddressFailure('This feature is coming soon.'));
}

// ── Update ────────────────────────────────────────────────────────────────────
// API disabled — safe failure without network request
function* handleUpdateAddress(_action: ReduxAction): SagaIterator {
  yield put(updateAddressFailure('This feature is coming soon.'));
}

// ── Delete ────────────────────────────────────────────────────────────────────
// API disabled — safe failure without network request
function* handleDeleteAddress(_action: ReduxAction): SagaIterator {
  yield put(deleteAddressFailure('This feature is coming soon.'));
}

// ── Delivery Quote ────────────────────────────────────────────────────────────
// API disabled — safe failure without network request
function* handleDeliveryQuote(_action: ReduxAction): SagaIterator {
  yield put(deliveryQuoteFailure('This feature is coming soon.'));
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* addressSaga(): SagaIterator {
  yield takeLatest(FETCH_ADDRESS_REQUEST,  handleFetchAddress);
  yield takeLatest(SAVE_ADDRESS_REQUEST,   handleSaveAddress);
  yield takeLatest(UPDATE_ADDRESS_REQUEST, handleUpdateAddress);
  yield takeLatest(DELETE_ADDRESS_REQUEST, handleDeleteAddress);
  yield takeLatest(DELIVERY_QUOTE_REQUEST, handleDeliveryQuote);
}
