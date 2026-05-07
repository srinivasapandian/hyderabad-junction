export type AuthStep = 'idle' | 'otp_sent' | 'needs_registration' | 'done';

export interface User {
  mobilePhone: string;
  customerId: string;
  access_token?: string;
  accessToken?: string;
  authToken?: string;
  token?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AuthState {
  loading: boolean;
  error: string | null;
  step: AuthStep;
  mobilePhone: string;
  customerId: string;
  isNewUser: boolean;
  isLoggedIn: boolean;
  user: User | null;
}

export interface PersistedAuth {
  isLoggedIn?: boolean;
  customerId?: string;
  user?: User | null;
}
