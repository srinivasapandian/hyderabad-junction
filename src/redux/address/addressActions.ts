import {
  FETCH_ADDRESS_REQUEST, FETCH_ADDRESS_SUCCESS, FETCH_ADDRESS_FAILURE, CLEAR_ADDRESSES,
  SAVE_ADDRESS_REQUEST,   SAVE_ADDRESS_SUCCESS,   SAVE_ADDRESS_FAILURE,
  UPDATE_ADDRESS_REQUEST, UPDATE_ADDRESS_SUCCESS, UPDATE_ADDRESS_FAILURE,
  DELETE_ADDRESS_REQUEST, DELETE_ADDRESS_SUCCESS, DELETE_ADDRESS_FAILURE,
  DELIVERY_QUOTE_REQUEST, DELIVERY_QUOTE_SUCCESS, DELIVERY_QUOTE_FAILURE, CLEAR_DELIVERY_QUOTE,
  SET_SELECTED_ADDRESS_ID,
} from './addressConstants';
import type { ReduxAction, Address, DeliveryQuote } from '../../types';

// ── Fetch ──────────────────────────────────────────────────────────────────────
export const fetchAddressRequest = (customerId: string): ReduxAction<{ customerId: string }> => ({ type: FETCH_ADDRESS_REQUEST, payload: { customerId } });
export const fetchAddressSuccess = (addresses: Address[]): ReduxAction<Address[]>  => ({ type: FETCH_ADDRESS_SUCCESS, payload: addresses });
export const fetchAddressFailure = (error: string): ReduxAction<string>      => ({ type: FETCH_ADDRESS_FAILURE, payload: error });
export const clearAddresses      = (): ReduxAction           => ({ type: CLEAR_ADDRESSES });

// ── Save ───────────────────────────────────────────────────────────────────────
export const saveAddressRequest = (payload: Partial<Address>): ReduxAction<Partial<Address>> => ({ type: SAVE_ADDRESS_REQUEST, payload });
export const saveAddressSuccess = (data: unknown): ReduxAction    => ({ type: SAVE_ADDRESS_SUCCESS, payload: data });
export const saveAddressFailure = (error: string): ReduxAction<string>   => ({ type: SAVE_ADDRESS_FAILURE, payload: error });

// ── Update ─────────────────────────────────────────────────────────────────────
export const updateAddressRequest = (payload: Partial<Address> & { addressId: string }): ReduxAction<Partial<Address> & { addressId: string }> => ({ type: UPDATE_ADDRESS_REQUEST, payload });
export const updateAddressSuccess = (data: unknown): ReduxAction    => ({ type: UPDATE_ADDRESS_SUCCESS, payload: data });
export const updateAddressFailure = (error: string): ReduxAction<string>   => ({ type: UPDATE_ADDRESS_FAILURE, payload: error });

// ── Delete ─────────────────────────────────────────────────────────────────────
export const deleteAddressRequest = (addressId: string): ReduxAction<{ addressId: string }> => ({ type: DELETE_ADDRESS_REQUEST, payload: { addressId } });
export const deleteAddressSuccess = (addressId: string): ReduxAction<string> => ({ type: DELETE_ADDRESS_SUCCESS, payload: addressId });
export const deleteAddressFailure = (error: string): ReduxAction<string>     => ({ type: DELETE_ADDRESS_FAILURE, payload: error });

// ── Delivery Quote ─────────────────────────────────────────────────────────────
export const deliveryQuoteRequest = (payload: unknown): ReduxAction => ({ type: DELIVERY_QUOTE_REQUEST, payload });
export const deliveryQuoteSuccess = (data: DeliveryQuote): ReduxAction<DeliveryQuote>    => ({ type: DELIVERY_QUOTE_SUCCESS, payload: data });
export const deliveryQuoteFailure = (error: string): ReduxAction<string>   => ({ type: DELIVERY_QUOTE_FAILURE, payload: error });
export const clearDeliveryQuote   = (): ReduxAction        => ({ type: CLEAR_DELIVERY_QUOTE });

// ── Selected address (scoped to one checkout flow) ─────────────────────────────
export const setSelectedAddressId = (addressId: string): ReduxAction<string> => ({ type: SET_SELECTED_ADDRESS_ID, payload: addressId });
