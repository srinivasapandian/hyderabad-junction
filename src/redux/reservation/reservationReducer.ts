import {
  FETCH_SLOTS_REQUEST, FETCH_SLOTS_SUCCESS, FETCH_SLOTS_FAILURE,
  CREATE_RESERVATION_REQUEST, CREATE_RESERVATION_SUCCESS, CREATE_RESERVATION_FAILURE,
  CANCEL_RESERVATION_REQUEST, CANCEL_RESERVATION_SUCCESS, CANCEL_RESERVATION_FAILURE,
  RESET_RESERVATION, CLEAR_SLOTS,
} from './reservationConstants';
import type { ReservationState, ReduxAction } from '../../types';

const initialState: ReservationState = {
  // Slots
  slots:        null,
  slotsLoading: false,
  slotsError:   null,

  // Booking
  bookingResult:     null,
  reservationDetail: null,
  bookingLoading:    false,
  bookingError:      null,
  bookingSuccess:    false,

  // Cancel
  cancelLoading: false,
  cancelError:   null,
  cancelSuccess: false,
};

export default function reservationReducer(state: ReservationState = initialState, action: ReduxAction): ReservationState {
  switch (action.type) {

    case FETCH_SLOTS_REQUEST:
      return { ...state, slotsLoading: true, slotsError: null, slots: null };
    case FETCH_SLOTS_SUCCESS:
      return { ...state, slotsLoading: false, slots: action.payload };
    case FETCH_SLOTS_FAILURE:
      return { ...state, slotsLoading: false, slotsError: action.payload as string };

    case CREATE_RESERVATION_REQUEST:
      return { ...state, bookingLoading: true, bookingError: null, bookingSuccess: false };
    case CREATE_RESERVATION_SUCCESS: {
      const resPayload = action.payload as { bookingResult: unknown; reservationDetail: unknown };
      return {
        ...state,
        bookingLoading:    false,
        bookingSuccess:    true,
        bookingResult:     resPayload.bookingResult,
        reservationDetail: resPayload.reservationDetail,
      };
    }
    case CREATE_RESERVATION_FAILURE:
      return { ...state, bookingLoading: false, bookingError: action.payload as string };

    case CANCEL_RESERVATION_REQUEST:
      return { ...state, cancelLoading: true, cancelError: null, cancelSuccess: false };
    case CANCEL_RESERVATION_SUCCESS:
      return { ...state, cancelLoading: false, cancelSuccess: true };
    case CANCEL_RESERVATION_FAILURE:
      return { ...state, cancelLoading: false, cancelError: action.payload as string };

    case CLEAR_SLOTS:
      return { ...state, slots: null, slotsLoading: false, slotsError: null };

    case RESET_RESERVATION:
      return { ...initialState };

    default:
      return state;
  }
}
