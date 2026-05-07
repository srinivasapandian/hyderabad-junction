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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* handleFetchFavourites(): Generator<any, void, any> {
  try {
    const { customerId, locationId, token } = yield* resolveContext();
    if (!customerId || !locationId) return;

    const res: { data: Record<string, unknown> }  = yield call(fetchFavouritesApi, customerId, locationId, token);
    const data = res.data ?? {};
    const list: MenuItem[] =
      Array.isArray(data)            ? data :
      Array.isArray((data as Record<string, unknown>).body)       ? (data as Record<string, unknown>).body as MenuItem[] :
      Array.isArray((data as Record<string, unknown>).favourites) ? (data as Record<string, unknown>).favourites as MenuItem[] :
      Array.isArray((data as Record<string, unknown>).favorites)  ? (data as Record<string, unknown>).favorites as MenuItem[] :
      Array.isArray((data as Record<string, unknown>).data)       ? (data as Record<string, unknown>).data as MenuItem[] :
      [];

    yield put(loadFavouritesAction(list));
  } catch {
    // Silently ignore — user can still toggle favourites manually
  }
}

// ── Add ───────────────────────────────────────────────────────────────────────
function* handleAddFavourite(action: ReduxAction): SagaIterator {
  const { itemId, item } = action.payload as { itemId: string; item?: MenuItem };

  const { customerId, locationId, token } = yield* resolveContext();

  // Guest user: store locally only (persisted via redux-persist)
  if (!customerId || !locationId) {
    yield put(toggleFavouriteAction(itemId, item));
    return;
  }

  // Logged-in user: optimistic update then API
  try {
    yield put(toggleFavouriteAction(itemId, item));
    yield call(addFavouriteApi, itemId, locationId, customerId, token);
    yield* handleFetchFavourites();
  } catch {
    // Rollback optimistic update
    yield put(toggleFavouriteAction(itemId, item));
  }
}

// ── Remove ────────────────────────────────────────────────────────────────────
function* handleRemoveFavourite(action: ReduxAction): SagaIterator {
  const { itemId } = action.payload as { itemId: string };

  const { customerId, locationId, token } = yield* resolveContext();

  // Guest user: remove locally only
  if (!customerId || !locationId) {
    yield put(toggleFavouriteAction(itemId));
    return;
  }

  // Logged-in user: optimistic update then API
  try {
    yield put(toggleFavouriteAction(itemId));
    yield call(removeFavouriteApi, itemId, locationId, customerId, token);
    yield* handleFetchFavourites();
  } catch {
    // Rollback optimistic update — re-toggle back
    const items: Record<string, MenuItem> = (yield select((s: RootState) => s.favourites.items)) as Record<string, MenuItem>;
    yield put(toggleFavouriteAction(itemId, items[itemId]));
  }
}

// ── Sync guest favourites to server on login ──────────────────────────────────
function* handleLoginSync(): SagaIterator {
  // Capture local guest favourites before server fetch overwrites them
  const guestIds: string[]   = (yield select((s: RootState) => s.favourites.ids)) as string[];
  const guestItems: Record<string, MenuItem> = (yield select((s: RootState) => s.favourites.items)) as Record<string, MenuItem>;

  // Fetch server favourites (replaces local state)
  yield* handleFetchFavourites();

  if (!guestIds.length) return;

  const serverIds: string[] = (yield select((s: RootState) => s.favourites.ids)) as string[];
  const toSync    = guestIds.filter((id: string) => !serverIds.includes(id));

  if (!toSync.length) return;

  const { customerId, locationId, token } = yield* resolveContext();
  if (!customerId || !locationId) return;

  // Push each guest favourite that isn't already on the server
  for (const itemId of toSync) {
    try {
      yield call(addFavouriteApi, itemId, locationId, customerId, token);
    } catch {
      // Keep it in local state even if the API call fails
    }
  }

  // Final sync so the store reflects the true server state
  yield* handleFetchFavourites();
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
