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

// API disabled — returns safe empty success, no network request
function* handleValidateCartItems(_action: ReduxAction): SagaIterator {
  yield put({ type: VALIDATE_CART_ITEMS_SUCCESS, payload: [] });
}

export default function* cartSaga(): SagaIterator {
  yield takeLatest(VALIDATE_CART_ITEMS_REQUEST, handleValidateCartItems);
}
