import type { SagaIterator } from 'redux-saga';
import { call, put, select, take, takeLatest } from 'redux-saga/effects';
import { VERIFY_OTP_SUCCESS, REGISTER_USER_SUCCESS } from '../auth/authConstants';
import { GET_SLUG_SUCCESS } from '../slug/slugConstants';
import {
  ADD_FAVOURITE_REQUEST,
  REMOVE_FAVOURITE_REQUEST,
  FETCH_FAVOURITES_REQUEST,
} from './favouritesConstants';
import {
  toggleFavouriteAction,
  loadFavouritesAction,
} from './favouritesActions';
import {
  fetchFavouritesApi,
  addFavouriteApi,
  removeFavouriteApi,
} from './favouritesAPI';
import type { ReduxAction, MenuItem, RootState } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* resolveContext(): Generator<any, { customerId: string; locationId: string; token: string }, any> {
  const { customerId, user } = (yield select((s: RootState) => s.auth)) as { customerId: string; user: { access_token?: string } | null };
  const token: string = user?.access_token || '';

  let locationId: string = (yield select((s: RootState) => s.slug?.data?.id || '')) as string;
  if (!locationId) {
    yield take(GET_SLUG_SUCCESS);
    locationId = (yield select((s: RootState) => s.slug?.data?.id || '')) as string;
  }

  return { customerId, locationId, token };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
// API disabled — returns empty list without network request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* handleFetchFavourites(): Generator<any, void, any> {
  yield put(loadFavouritesAction([]));
}

// ── Add ───────────────────────────────────────────────────────────────────────
// API disabled — local toggle only, no network request
function* handleAddFavourite(action: ReduxAction): SagaIterator {
  const { itemId, item } = action.payload as { itemId: string; item?: MenuItem };
  yield put(toggleFavouriteAction(itemId, item));
}

// ── Remove ────────────────────────────────────────────────────────────────────
// API disabled — local toggle only, no network request
function* handleRemoveFavourite(action: ReduxAction): SagaIterator {
  const { itemId } = action.payload as { itemId: string };
  yield put(toggleFavouriteAction(itemId));
}

// ── Sync guest favourites to server on login ──────────────────────────────────
// API disabled — no-op, local state is preserved
function* handleLoginSync(): SagaIterator {
  // Intentionally empty — API calls disabled
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* favouritesSaga(): SagaIterator {
  // On login: sync guest favourites to server, then fetch
  yield takeLatest([VERIFY_OTP_SUCCESS, REGISTER_USER_SUCCESS], handleLoginSync);

  // On-demand fetch (from Favourites page mount)
  yield takeLatest(FETCH_FAVOURITES_REQUEST, handleFetchFavourites);

  // Add / remove (guest-safe)
  yield takeLatest(ADD_FAVOURITE_REQUEST,    handleAddFavourite);
  yield takeLatest(REMOVE_FAVOURITE_REQUEST, handleRemoveFavourite);
}
