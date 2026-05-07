import type { SagaIterator } from 'redux-saga';
import { call, put, select, take, takeLatest } from 'redux-saga/effects';
import { GET_MENU_REQUEST } from './menuConstants';
import { getMenuSuccess, getMenuFailure } from './menuActions';
import { GET_SLUG_SUCCESS } from '../slug/slugConstants';
import { AUTH_KEY } from '../auth/authConstants';
import { getOrderMenuApi } from './menuAPI';
import type { ReduxAction, AuthState } from '../../types';

function resolveToken(auth: AuthState): string {
  const { user } = auth || {};
  const direct = user?.access_token || user?.token || user?.accessToken || user?.authToken || '';
  if (direct) return direct;
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    return stored?.user?.access_token || stored?.user?.token || stored?.user?.accessToken || '';
  } catch {
    return '';
  }
}

function* handleGetMenu(action: ReduxAction): SagaIterator {
  try {
    const orderType = action.payload as string;
    let locationId: string | undefined = yield select((state: { slug: { data: { id?: string } | null } }) => state.slug.data?.id);

    // Slug not resolved yet (e.g. direct /menu navigation) — wait for it
    if (!locationId) {
      yield take(GET_SLUG_SUCCESS);
      locationId = yield select((state: { slug: { data: { id?: string } | null } }) => state.slug.data?.id);
    }

    if (!locationId) {
      throw new Error('locationId not available in store (slug.data.id)');
    }

    const auth: AuthState = yield select((state: { auth: AuthState }) => state.auth);
    const token = resolveToken(auth);
    const customerId: string = auth?.customerId || auth?.user?.customerId || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: { data: any } = yield call(getOrderMenuApi, {
      locationId,
      orderType,
      customerId,
      token,
    });
    yield put(getMenuSuccess(response.data));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(getMenuFailure(err?.response?.data || err.message));
  }
}

export default function* menuSaga(): SagaIterator {
  yield takeLatest(GET_MENU_REQUEST, handleGetMenu);
}
