import type { SagaIterator } from 'redux-saga';
import { call, put, takeLatest } from 'redux-saga/effects';
import type { AxiosResponse } from 'axios';
import { GET_SLUG_REQUEST } from './slugConstants';
import { getSlugSuccess, getSlugFailure } from './slugActions';
import { fetchSlug } from './slugAPI';
import { decryptJson } from '../../helpers/encryption';
import type { SlugData } from '../../types';

function* handleGetSlug(): SagaIterator {
  try {
    const response: AxiosResponse = yield call(fetchSlug);
    const decrypted = decryptJson(response.data?.encryptedText) as SlugData;
    console.log('[slugSaga] Decrypted slug data:', decrypted);
    yield put(getSlugSuccess(decrypted));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(getSlugFailure(err?.response?.data || err.message));
  }
}

export default function* slugSaga(): SagaIterator {
  yield takeLatest(GET_SLUG_REQUEST, handleGetSlug);
}
