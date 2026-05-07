import {
  REQUEST_OTP_REQUEST, REQUEST_OTP_SUCCESS, REQUEST_OTP_FAILURE,
  VERIFY_OTP_REQUEST,  VERIFY_OTP_SUCCESS,  VERIFY_OTP_FAILURE,
  REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAILURE,
  LOGOUT, RESET_AUTH_MODAL, AUTH_KEY,
} from './authConstants';
import type { ReduxAction, AuthState, PersistedAuth, User } from '../../types';

const loadPersisted = (): PersistedAuth => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persisted = loadPersisted();

const initialState: AuthState = {
  loading: false,
  error: null,
  step: 'idle',
  mobilePhone: '',
  customerId: persisted.customerId || '',
  isNewUser: false,
  isLoggedIn: persisted.isLoggedIn || false,
  user: persisted.user || null,
};

const authReducer = (state: AuthState = initialState, action: ReduxAction): AuthState => {
  switch (action.type) {
    case REQUEST_OTP_REQUEST:
      return { ...state, loading: true, error: null, mobilePhone: (action.payload as { mobilePhone: string }).mobilePhone };
    case REQUEST_OTP_SUCCESS:
      return { ...state, loading: false, step: 'otp_sent' };
    case REQUEST_OTP_FAILURE:
      return { ...state, loading: false, error: action.payload as string };

    case VERIFY_OTP_REQUEST:
      return { ...state, loading: true, error: null };
    case VERIFY_OTP_SUCCESS: {
      const { customerId, isNewUser, user } = action.payload as { customerId: string; isNewUser: boolean; user: User };
      const base = { ...state, loading: false, customerId, isNewUser, user };
      return isNewUser
        ? { ...base, step: 'needs_registration' as const }
        : { ...base, step: 'done' as const, isLoggedIn: true };
    }
    case VERIFY_OTP_FAILURE:
      return { ...state, loading: false, error: action.payload as string };

    case REGISTER_USER_REQUEST:
      return { ...state, loading: true, error: null };
    case REGISTER_USER_SUCCESS:
      return { ...state, loading: false, step: 'done', isLoggedIn: true, user: action.payload as User };
    case REGISTER_USER_FAILURE:
      return { ...state, loading: false, error: action.payload as string };

    case LOGOUT:
      try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
      return {
        loading: false,
        error: null,
        step: 'idle',
        mobilePhone: '',
        customerId: '',
        isNewUser: false,
        isLoggedIn: false,
        user: null,
      };

    case RESET_AUTH_MODAL:
      return { ...state, loading: false, error: null, step: 'idle', mobilePhone: '' };

    default:
      return state;
  }
};

export default authReducer;
