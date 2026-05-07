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

function* requestOtpSaga(action: ReduxAction): SagaIterator {
  try {
    const { mobilePhone } = action.payload as { mobilePhone: string };
    yield call(requestOtpApi, mobilePhone);
    yield put(requestOtpSuccess());
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(requestOtpFailure(
      err?.response?.data?.message || err.message || 'Failed to send OTP'
    ));
  }
}

function* verifyOtpSaga(action: ReduxAction): SagaIterator {
  try {
    const { mobilePhone, otp } = action.payload as { mobilePhone: string; otp: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: { data: any } = yield call(verifyOtpApi, mobilePhone, otp);

    const data = response.data;
    const payload = data?.body || data || {};
    const customer = payload?.customerDetails || payload?.customer || {};
    const accessToken = payload?.access_token || customer?.access_token || '';

    const customerId = customer?.customerId || payload?.customerId || '';
    // New user = no customerId in verify-otp response
    const isNewUser = !customerId;

    const user: User = { mobilePhone, customerId, access_token: accessToken, ...customer };

    if (!isNewUser) {
      persistAuth({ isLoggedIn: true, customerId, user });
    }

    yield put(verifyOtpSuccess({ customerId, isNewUser, user }));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(verifyOtpFailure(
      err?.response?.data?.message || err.message || 'Invalid OTP'
    ));
  }
}

function* registerUserSaga(action: ReduxAction): SagaIterator {
  try {
    const { token, ...userData } = action.payload as Record<string, unknown> & { token: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: { data: any } = yield call(registerUserApi, userData, token);

    const body = response.data?.body || response.data || {};
    const customerDetails = body.customerDetails || {};
    const accessToken = body?.access_token || customerDetails?.access_token || '';

    const user: User = { ...userData, ...customerDetails, access_token: accessToken };
    const customerId: string = customerDetails.customerId || userData.customerId || '';

    persistAuth({ isLoggedIn: true, customerId, user });

    yield put(registerUserSuccess(user));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(registerUserFailure(
      err?.response?.data?.message || err.message || 'Registration failed'
    ));
  }
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
