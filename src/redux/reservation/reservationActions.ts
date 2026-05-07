import {
  FETCH_SLOTS_REQUEST, FETCH_SLOTS_SUCCESS, FETCH_SLOTS_FAILURE,
  CREATE_RESERVATION_REQUEST, CREATE_RESERVATION_SUCCESS, CREATE_RESERVATION_FAILURE,
  CANCEL_RESERVATION_REQUEST, CANCEL_RESERVATION_SUCCESS, CANCEL_RESERVATION_FAILURE,
  RESET_RESERVATION, CLEAR_SLOTS,
} from './reservationConstants';
import type { ReduxAction } from '../../types';

export const fetchSlotsRequest = (params: unknown): ReduxAction  => ({ type: FETCH_SLOTS_REQUEST, payload: params });
export const fetchSlotsSuccess = (data: unknown): ReduxAction    => ({ type: FETCH_SLOTS_SUCCESS, payload: data  });
export const fetchSlotsFailure = (msg: string): ReduxAction<string>     => ({ type: FETCH_SLOTS_FAILURE, payload: msg   });

export const createReservationRequest = (payload: unknown): ReduxAction => ({ type: CREATE_RESERVATION_REQUEST, payload });
export const createReservationSuccess = (data: { bookingResult: unknown; reservationDetail: unknown }): ReduxAction<{ bookingResult: unknown; reservationDetail: unknown }>    => ({ type: CREATE_RESERVATION_SUCCESS, payload: data });
export const createReservationFailure = (msg: string): ReduxAction<string>     => ({ type: CREATE_RESERVATION_FAILURE, payload: msg  });

export const cancelReservationRequest = (payload: unknown): ReduxAction => ({ type: CANCEL_RESERVATION_REQUEST, payload });
export const cancelReservationSuccess = (): ReduxAction        => ({ type: CANCEL_RESERVATION_SUCCESS });
export const cancelReservationFailure = (msg: string): ReduxAction<string>     => ({ type: CANCEL_RESERVATION_FAILURE, payload: msg });

export const resetReservation = (): ReduxAction => ({ type: RESET_RESERVATION });
export const clearSlots       = (): ReduxAction => ({ type: CLEAR_SLOTS });
