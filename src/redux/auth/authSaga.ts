import type { SagaIterator } from 'redux-saga';
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  REQUEST_OTP_REQUEST, VERIFY_OTP_REQUEST, REGISTER_USER_REQUEST, LOGOUT,
} from './authConstants';
import {
  requestOtpSuccess, requestOtpFailure,
  verifyOtpSuccess, verifyOtpFailure,
  registerUserSuccess, registerUserFailure,
} from './authActions';
import { requestOtpApi, verifyOtpApi, registerUserApi } from './authAPI';
import { AUTH_KEY } from './authConstants';
import { clearActiveOrdersAction } from '../activeOrders/activeOrdersReducer';
import { clearCartAction } from '../cart/cartReducer';
import type { ReduxAction, PersistedAuth, User } from '../../types';

const persistAuth = (data: PersistedAuth): void => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  } catch (_) {}
};

function* requestOtpSaga(_action: ReduxAction): SagaIterator {
  // API disabled — safe fallback, no network request
  yield put(requestOtpFailure('This feature is coming soon. Please check back later.'));
}

function* verifyOtpSaga(_action: ReduxAction): SagaIterator {
  // API disabled — safe fallback, no network request
  yield put(verifyOtpFailure('This feature is coming soon. Please check back later.'));
}

function* registerUserSaga(_action: ReduxAction): SagaIterator {
  // API disabled — safe fallback, no network request
  yield put(registerUserFailure('This feature is coming soon. Please check back later.'));
}

// Clear all user-specific state on logout
function* logoutSaga(): SagaIterator {
  yield put(clearActiveOrdersAction());
  yield put(clearCartAction());
}

export default function* authSaga(): SagaIterator {
  yield takeLatest(REQUEST_OTP_REQUEST,  requestOtpSaga);
  yield takeLatest(VERIFY_OTP_REQUEST,   verifyOtpSaga);
  yield takeLatest(REGISTER_USER_REQUEST, registerUserSaga);
  yield takeLatest(LOGOUT,              logoutSaga);
}
