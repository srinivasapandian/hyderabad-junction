import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  VALIDATE_CART_ITEMS_REQUEST,
  VALIDATE_CART_ITEMS_SUCCESS,
  VALIDATE_CART_ITEMS_FAILURE,
} from './cartConstants';
import { validateCartItemsApi } from './cartAPI';
import { fetchTotalsRequest } from '../totals/totalsActions';
import { getOrderTypeIdFromSlug } from '../../utils/buildTotalsPayload';
import type { ReduxAction, CartLine, RootState } from '../../types';
import type { AxiosError, AxiosResponse } from 'axios';

function* handleValidateCartItems(action: ReduxAction): SagaIterator {
  try {
    const { source } = action.payload as { source: 'ordering' | 'cart' };

    const cartLines: CartLine[] = (yield select((s: RootState) => s.cart.cartLines)) as CartLine[];
    const orderType: string = (yield select((s: RootState) => s.cart.orderType)) as string;
    const slugData: Record<string, unknown> | null  = (yield select((s: RootState) => s.slug.data)) as Record<string, unknown> | null;
    const user: { access_token?: string } | null      = (yield select((s: RootState) => s.auth.user)) as { access_token?: string } | null;
    const token: string     = user?.access_token || '';

    // No items in cart — nothing to validate
    if (!cartLines.length) return;

    const orderTypeId = getOrderTypeIdFromSlug(slugData as Parameters<typeof getOrderTypeIdFromSlug>[0], orderType);
    const locationId: string  = (slugData?.id as string) || '';

    const payload = {
      itemIds: cartLines.map((l) => l.itemId),
      itemObj: cartLines.map((l) => ({
        itemId:      l.itemId,
        modifierIds: l.modifiers.map((m) => m.optionId),
      })),
      orderTypeId,
      locationId,
    };

    const response: AxiosResponse = (yield call(validateCartItemsApi, payload, token)) as AxiosResponse;
    const data = response.data; // plain JSON array

    yield put({ type: VALIDATE_CART_ITEMS_SUCCESS, payload: data });

    // Cart page needs totals refreshed after validation
    if (source === 'cart') {
      yield put(fetchTotalsRequest());
    }
  } catch (error) {
    const err = error as AxiosError;
    yield put({
      type: VALIDATE_CART_ITEMS_FAILURE,
      payload: err?.response?.data || err.message,
    });
  }
}

export default function* cartSaga(): SagaIterator {
  yield takeLatest(VALIDATE_CART_ITEMS_REQUEST, handleValidateCartItems);
}
