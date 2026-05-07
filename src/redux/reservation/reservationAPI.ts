import { AxiosResponse } from 'axios';
import { API_MENU } from '../../api';
import { encryptJson } from '../../helpers/encryption';

const normalizeBearerToken = (token: string): string =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

const buildHeaders = (token: string, extra: Record<string, string> = {}): Record<string, string> => ({
  'x-app-version': 'v2',
  ...(normalizeBearerToken(token) ? { Authorization: normalizeBearerToken(token) } : {}),
  ...extra,
});

/**
 * Fetch available time slots for a date + guest count.
 */
export const fetchReservationSlotsApi = (
  { locationId, date, partySize }: { locationId: string; date: string; partySize: number | string },
  token: string
): Promise<AxiosResponse> =>
  API_MENU.get(
    `/api/customers/reservation/generate-reservation-slot/${locationId}`,
    {
      baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
      params: { guestCount: partySize, date },
      headers: buildHeaders(token),
    }
  );

/**
 * Create a reservation.
 */
export const createReservationApi = (payload: Record<string, unknown>, token: string): Promise<AxiosResponse> =>
  API_MENU.post(
    '/api/customers/checkIn/fetch',
    null,
    {
      baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
      params: { data: encryptJson(payload) },
      headers: buildHeaders(token, { 'content-type': 'application/json' }),
    },
  );

/**
 * Fetch full reservation detail by ID.
 */
export const fetchReservationByIdApi = (
  { reservationId }: { reservationId: string },
  token: string
): Promise<AxiosResponse> =>
  API_MENU.post(
    '/api/customers/checkIn/reservationId',
    { data: encryptJson({ reservationId }) },
    {
      baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
      headers: buildHeaders(token, { 'content-type': 'application/json' }),
    },
  );

/**
 * Cancel a reservation.
 */
export const cancelReservationApi = (
  { locationId, reservationId, cancelReason }: { locationId: string; reservationId: string; cancelReason: string },
  token: string
): Promise<AxiosResponse> =>
  API_MENU.put(
    '/api/customers/reservation/cancel-table',
    { data: encryptJson({ locationId, reservationId, cancelReason }) },
    {
      baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
      params: { user: 'customer' },
      headers: buildHeaders(token, { 'content-type': 'application/json' }),
    },
  );
