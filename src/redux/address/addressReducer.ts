import {
  FETCH_ADDRESS_REQUEST,  FETCH_ADDRESS_SUCCESS,  FETCH_ADDRESS_FAILURE,  CLEAR_ADDRESSES,
  SAVE_ADDRESS_REQUEST,   SAVE_ADDRESS_SUCCESS,   SAVE_ADDRESS_FAILURE,
  UPDATE_ADDRESS_REQUEST, UPDATE_ADDRESS_SUCCESS, UPDATE_ADDRESS_FAILURE,
  DELETE_ADDRESS_REQUEST, DELETE_ADDRESS_SUCCESS, DELETE_ADDRESS_FAILURE,
  DELIVERY_QUOTE_REQUEST, DELIVERY_QUOTE_SUCCESS, DELIVERY_QUOTE_FAILURE, CLEAR_DELIVERY_QUOTE,
  SET_SELECTED_ADDRESS_ID,
} from './addressConstants';
import type { AddressState, Address, DeliveryQuote, ReduxAction } from '../../types';

const initialState: AddressState = {
  addresses:         [],
  loading:           false,
  mutating:          false,   // save / update / delete in progress
  error:             null,
  mutateError:       null,
  quote:             null,
  quoteLoading:      false,
  quoteError:        null,
  selectedAddressId: null,    // set on address selection, persists across flows
};

export default function addressReducer(state: AddressState = initialState, action: ReduxAction): AddressState {
  switch (action.type) {

    // ── Fetch ────────────────────────────────────────────────────────────────
    case FETCH_ADDRESS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_ADDRESS_SUCCESS:
      return { ...state, loading: false, addresses: action.payload as Address[] };
    case FETCH_ADDRESS_FAILURE:
      return { ...state, loading: false, error: action.payload as string };
    case CLEAR_ADDRESSES:
      return initialState;

    // ── Save ─────────────────────────────────────────────────────────────────
    case SAVE_ADDRESS_REQUEST:
      return { ...state, mutating: true, mutateError: null };
    case SAVE_ADDRESS_SUCCESS:
      return { ...state, mutating: false };
    case SAVE_ADDRESS_FAILURE:
      return { ...state, mutating: false, mutateError: action.payload as string };

    // ── Update ───────────────────────────────────────────────────────────────
    case UPDATE_ADDRESS_REQUEST:
      return { ...state, mutating: true, mutateError: null };
    case UPDATE_ADDRESS_SUCCESS:
      return { ...state, mutating: false };
    case UPDATE_ADDRESS_FAILURE:
      return { ...state, mutating: false, mutateError: action.payload as string };

    // ── Delete ───────────────────────────────────────────────────────────────
    case DELETE_ADDRESS_REQUEST:
      return { ...state, mutating: true, mutateError: null };
    case DELETE_ADDRESS_SUCCESS:
      // Optimistically remove from list
      return {
        ...state,
        mutating:  false,
        addresses: state.addresses.filter((a) => a.id !== action.payload),
      };
    case DELETE_ADDRESS_FAILURE:
      return { ...state, mutating: false, mutateError: action.payload as string };

    // ── Delivery Quote ───────────────────────────────────────────────────────
    case DELIVERY_QUOTE_REQUEST:
      return { ...state, quoteLoading: true, quoteError: null, quote: null };
    case DELIVERY_QUOTE_SUCCESS:
      return { ...state, quoteLoading: false, quote: action.payload as DeliveryQuote };
    case DELIVERY_QUOTE_FAILURE:
      return { ...state, quoteLoading: false, quoteError: action.payload as string };
    case CLEAR_DELIVERY_QUOTE:
      return { ...state, quote: null, quoteLoading: false, quoteError: null };

    // ── Selected address — persists after selection ──────────────────────────
    case SET_SELECTED_ADDRESS_ID:
      return { ...state, selectedAddressId: action.payload as string };

    default:
      return state;
  }
}
