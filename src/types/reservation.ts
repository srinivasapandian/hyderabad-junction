export interface ReservationState {
  slots: unknown;
  slotsLoading: boolean;
  slotsError: string | null;
  bookingResult: unknown;
  reservationDetail: unknown;
  bookingLoading: boolean;
  bookingError: string | null;
  bookingSuccess: boolean;
  cancelLoading: boolean;
  cancelError: string | null;
  cancelSuccess: boolean;
}
