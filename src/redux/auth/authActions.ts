import {
  REQUEST_OTP_REQUEST, REQUEST_OTP_SUCCESS, REQUEST_OTP_FAILURE,
  VERIFY_OTP_REQUEST,  VERIFY_OTP_SUCCESS,  VERIFY_OTP_FAILURE,
  REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAILURE,
  LOGOUT, RESET_AUTH_MODAL,
} from './authConstants';
import type { ReduxAction, User } from '../../types';

interface VerifyOtpPayload {
  customerId: string;
  isNewUser: boolean;
  user: User;
}

export const requestOtp = (mobilePhone: string): ReduxAction<{ mobilePhone: string }> => ({
  type: REQUEST_OTP_REQUEST,
  payload: { mobilePhone },
});
export const requestOtpSuccess = (): ReduxAction => ({ type: REQUEST_OTP_SUCCESS });
export const requestOtpFailure = (error: string): ReduxAction<string> => ({ type: REQUEST_OTP_FAILURE, payload: error });

export const verifyOtp = (mobilePhone: string, otp: string): ReduxAction<{ mobilePhone: string; otp: string }> => ({
  type: VERIFY_OTP_REQUEST,
  payload: { mobilePhone, otp },
});
export const verifyOtpSuccess = (data: VerifyOtpPayload): ReduxAction<VerifyOtpPayload> => ({ type: VERIFY_OTP_SUCCESS, payload: data });
export const verifyOtpFailure = (error: string): ReduxAction<string> => ({ type: VERIFY_OTP_FAILURE, payload: error });

export const registerUser = (data: Record<string, unknown>): ReduxAction<Record<string, unknown>> => ({
  type: REGISTER_USER_REQUEST,
  payload: data,
});
export const registerUserSuccess = (user: User): ReduxAction<User> => ({ type: REGISTER_USER_SUCCESS, payload: user });
export const registerUserFailure = (error: string): ReduxAction<string> => ({ type: REGISTER_USER_FAILURE, payload: error });

export const logout = (): ReduxAction => ({ type: LOGOUT });
export const resetAuthModal = (): ReduxAction => ({ type: RESET_AUTH_MODAL });
