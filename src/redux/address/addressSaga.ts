import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_ADDRESS_REQUEST,
  SAVE_ADDRESS_REQUEST,
  UPDATE_ADDRESS_REQUEST,
  DELETE_ADDRESS_REQUEST,
  DELIVERY_QUOTE_REQUEST,  // invoked from Checkout on address selection
} from './addressConstants';
import {
  fetchAddressSuccess, fetchAddressFailure,
  saveAddressSuccess,  saveAddressFailure,
  updateAddressSuccess, updateAddressFailure,
  deleteAddressSuccess, deleteAddressFailure,
  deliveryQuoteSuccess, deliveryQuoteFailure,
  fetchAddressRequest,
  setSelectedAddressId,
} from './addressActions';
import { fetchTotalsRequest } from '../totals/totalsActions';
import {
  fetchAddressApi,
  saveAddressApi,
  updateAddressApi,
  deleteAddressApi,
  deliveryQuoteApi,
} from './addressAPI';
import type { ReduxAction, RootState } from '../../types';

// ── Token helper ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* getToken(): Generator<any, string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = yield select((s: RootState) => s.auth.user);
  return user?.access_token || '';
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
function* handleFetchAddress(action: ReduxAction): SagaIterator {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authCustomerId: any = yield select((s: RootState) => (s.auth as any).customerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId = (action.payload as any)?.customerId || authCustomerId;
    if (!customerId) { yield put(fetchAddressFailure('No customer ID available')); return; }

    const token: string = yield* getToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(fetchAddressApi, customerId, token);
    yield put(fetchAddressSuccess(response.data?.addresses || []));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(fetchAddressFailure(err?.response?.data?.message || err.message));
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────
function* handleSaveAddress(action: ReduxAction): SagaIterator {
  try {
    const token: string = yield* getToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(saveAddressApi, action.payload, token);
    yield put(saveAddressSuccess(response.data));

    // Re-fetch list so UI is up to date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId: string = yield select((s: RootState) => (s.auth as any).customerId);
    yield put(fetchAddressRequest(customerId));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(saveAddressFailure(err?.response?.data?.message || err.message));
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function* handleUpdateAddress(action: ReduxAction): SagaIterator {
  try {
    const { addressId, ...payload } = action.payload as { addressId: string; [key: string]: unknown };
    const token: string = yield* getToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(updateAddressApi, addressId, payload, token);
    yield put(updateAddressSuccess(response.data));

    // Re-fetch list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId: string = yield select((s: RootState) => (s.auth as any).customerId);
    yield put(fetchAddressRequest(customerId));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(updateAddressFailure(err?.response?.data?.message || err.message));
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function* handleDeleteAddress(action: ReduxAction): SagaIterator {
  try {
    const { addressId } = action.payload as { addressId: string };
    const token: string = yield* getToken();
    yield call(deleteAddressApi, addressId, token);
    yield put(deleteAddressSuccess(addressId));

    // Re-fetch list so UI is up to date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId: string = yield select((s: RootState) => (s.auth as any).customerId);
    yield put(fetchAddressRequest(customerId));
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(deleteAddressFailure(err?.response?.data?.message || err.message));
  }
}

// ── Delivery Quote ────────────────────────────────────────────────────────────
function* handleDeliveryQuote(action: ReduxAction): SagaIterator {
  try {
    const token: string = yield* getToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slugData: any = yield select((s: RootState) => s.slug.data);
    const deliveryProviderId: string = slugData?.locationDeliveryProviders?.deliveryProviderId || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user, customerId }: any = yield select((s: RootState) => s.auth);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grandTotal: any = yield select((s: RootState) => s.totals.grandTotal);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { addressData } = action.payload as any;

    // Store selected addressId — Totals saga reads from s.address.selectedAddressId
    yield put(setSelectedAddressId(addressData?.addressId || addressData?.id || ''));

    const locationId: string      = slugData?.id || '';
    const restaurantName: string  = slugData?.name || slugData?.restaurantName || '';
    const restaurantPhone: string = slugData?.phone || slugData?.mobileNo || '+16505555555';

    // Match branch by locationSlug === VITE_MERCHANT_SLUG to get pickup lat/lng
    const merchantSlug: string = import.meta.env.VITE_MERCHANT_SLUG || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branches: any[]     = Array.isArray(slugData?.branch) ? slugData.branch : [];
    const matchedBranch = branches.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b?.locationSlug === merchantSlug,
    );
    const pickupLat: number = matchedBranch?.latitude  || slugData?.latitude  || slugData?.lat  || 0;
    const pickupLng: number = matchedBranch?.longitude || slugData?.longitude || slugData?.lng  || 0;

    const pickupAddr: string = [
      slugData?.addressLine1 || slugData?.address || '',
      slugData?.city  || '',
      slugData?.state || '',
      slugData?.postalCd || '',
    ].filter(Boolean).join(', ');

    // Full combined drop address for streetAddress1
    const dropStreet1: string = [
      addressData?.addressLine1,
      addressData?.city,
      addressData?.state,
      addressData?.postalCd,
    ].filter(Boolean).join(', ');

    const quotePayload: Record<string, unknown> = {
      pickupDetails: {
        Address: {
          streetAddress1: pickupAddr,
          streetAddress2: '',
          city:    slugData?.city     || '',
          state:   slugData?.state    || '',
          pincode: slugData?.postalCd || '',
        },
        lat: pickupLat,
        lng: pickupLng,
      },
      dropDetails: {
        Address: {
          streetAddress1: dropStreet1,
          streetAddress2: addressData?.addressLine2 || '',
          city:    addressData?.city     || '',
          state:   addressData?.state    || '',
          pincode: addressData?.postalCd || '',
        },
        lat: addressData?.latitude  || 0,
        lng: addressData?.longitude || 0,
      },
      locationId,
      deliveryProviderId,                                    // plain string in body
      receiverDetails: {
        name:        [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Customer',
        phoneNumber: user?.mobilePhone || '',
      },
      senderDetails: {
        name:        restaurantName,
        phoneNumber: restaurantPhone,
      },
      tip:        0,
      orderTotal: grandTotal ? String(grandTotal) : '',
      emailId:    user?.email      || '',
      mobileNo:   user?.mobilePhone || '',
      addressId:  addressData?.addressId || '',
      // addressId:  addressData?.addressId || addressData?.id || '',
      customerId: customerId || '',
    };

    // 3. Quote API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(deliveryQuoteApi, quotePayload, token);
    yield put(deliveryQuoteSuccess(response.data));

    // 4. Totals AFTER quote
    yield put(fetchTotalsRequest());
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    yield put(deliveryQuoteFailure(err?.response?.data?.message || err.message));
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* addressSaga(): SagaIterator {
  yield takeLatest(FETCH_ADDRESS_REQUEST,  handleFetchAddress);
  yield takeLatest(SAVE_ADDRESS_REQUEST,   handleSaveAddress);
  yield takeLatest(UPDATE_ADDRESS_REQUEST, handleUpdateAddress);
  yield takeLatest(DELETE_ADDRESS_REQUEST, handleDeleteAddress);
  yield takeLatest(DELIVERY_QUOTE_REQUEST, handleDeliveryQuote);
}
