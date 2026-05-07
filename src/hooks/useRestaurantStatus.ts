/**
 * useRestaurantStatus.ts
 *
 * Single source of truth for all restaurant open / closed / closing-soon state.
 * Merges useIsRestaurantClosed (cases 1–9) and useIsClosingSoon (cases 2–3)
 * into one file so shared imports and timezone utils are co-located.
 *
 * Exports:
 *   useIsRestaurantClosed()       – boolean         (scheduler cases 4–9)
 *   useIsClosingSoon(orderType)   – ClosingSoonState (scheduler cases 2–3)
 *   ClosingSoonState              – interface
 *
 * ─── useIsRestaurantClosed ────────────────────────────────────────────────────
 * Data consumed from Redux (slug.data):
 *   timeZoneCd           – IANA timezone code, e.g. "America/New_York"
 *   activeSessionEndTime – "HH:MM:SS" end time of the current active session,
 *                          or null/undefined when no session is active right now.
 *   isLastActiveSession  – true when there is no further session after the active one today.
 *   nextSession          – { nextSessionStartTime, nextSessionDay } or null.
 *
 * Case mapping:
 *   Case 1  – single session, now within it                      → OPEN
 *   Case 2  – multiple sessions, now within a non-last session   → OPEN
 *   Case 3  – multiple sessions, now within the last session     → OPEN
 *   Case 4  – activeSessionEndTime present, now > endTime        → CLOSED
 *   Case 5  – no active session, isLastSession, now > nextTime   → CLOSED
 *   Case 6  – no active session, now <= nextTime                 → CLOSED
 *   Case 8  – no active session, !isLastSession, now >= nextTime → CLOSED
 *   Case 9  – no active session, fallthrough                     → CLOSED
 *
 * ─── useIsClosingSoon ─────────────────────────────────────────────────────────
 * Data consumed from Redux (slug.data):
 *   activeSessionEndTime – "HH:MM:SS" end time of the current active session.
 *   defaultPickUpETA     – Pickup prep time in minutes.
 *   defaultDeliveryETA   – Delivery prep time in minutes.
 *   timeZoneCd / timeZone – IANA code + display label.
 *
 * ETA selection:
 *   orderType === 'Delivery' → defaultDeliveryETA
 *   orderType === 'Pickup'   → defaultPickUpETA
 *
 * Case mapping:
 *   Case 2 – now >= (activeEndTime − 2×ETA) AND now < (activeEndTime − 1×ETA)
 *            → "Hurry up! closing soon, place your order before [time]."
 *   Case 3 – now >= (activeEndTime − 1×ETA) AND now < activeEndTime
 *            → "We are closing soon. Get your favorites before we close at [time]."
 *
 * Mutual exclusion:
 *   Cases 2 & 3 are OPEN states — ClosedBar (cases 4–9) never renders simultaneously.
 */
import { useSelector } from 'react-redux';
import moment from 'moment-timezone';
import type { RootState } from '../types';
import type { OrderType } from '../types';
import { getServerTime, getActualSessionEndTime } from '../utils/sessionUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Shared type
// ─────────────────────────────────────────────────────────────────────────────
export interface ClosingSoonState {
  isClosingSoon: boolean;
  closingCase:   2 | 3 | null; // which scheduler case triggered the banner
  closingTime:   string;        // formatted "hh:mm A" — shown in the banner
  timeZone:      string;        // display label e.g. "Central Time (CT)"
}

// ─────────────────────────────────────────────────────────────────────────────
// useIsRestaurantClosed
// Returns true when the restaurant is currently closed for online ordering.
// ─────────────────────────────────────────────────────────────────────────────
export const useIsRestaurantClosed = (): boolean => {
  const slugData = useSelector((s: RootState) => s.slug.data);

  const timeZoneCd           = slugData?.timeZoneCd           ?? '';
  const activeSessionEndTime = slugData?.activeSessionEndTime ?? null;
  const isLastSession        = slugData?.isLastActiveSession  ?? false;
  const nextSession          = slugData?.nextSession;

  // Current wall-clock time in the restaurant's timezone
  const now = getServerTime(timeZoneCd);

  // Resolve nextSession start time to an absolute Date (handles cross-midnight)
  let nextSessionTime: Date | null = null;
  if (nextSession?.nextSessionStartTime) {
    nextSessionTime = getActualSessionEndTime(
      nextSession.nextSessionStartTime,
      timeZoneCd,
      now
    );
  }

  // ── Cases 1 / 2 / 3 / 4: active session end time is present ──────────────
  // Case 1: single session for the day, currently within it             → OPEN
  // Case 2: multiple sessions, currently within a non-last session      → OPEN
  // Case 3: multiple sessions, currently within the last session        → OPEN
  // Case 4: active session end time has now passed (session just ended) → CLOSED
  if (activeSessionEndTime) {
    const activeEndTime = getActualSessionEndTime(activeSessionEndTime, timeZoneCd, now);
    if (now > activeEndTime) return true;   // Case 4: session ended → CLOSED
    return false;                           // Cases 1 / 2 / 3: inside session → OPEN
  }

  // ── Cases 5 / 6 / 8 / 9: no active session → restaurant is closed ─────────
  if (!activeSessionEndTime && nextSessionTime) {
    // Case 5: last session of the day, already past it → closed for the day
    if (isLastSession && now > nextSessionTime)   return true;

    // Case 6: before the very first session of the day → not yet open
    if (now <= nextSessionTime)                   return true;

    // Case 8: between sessions (not last), next start reached → gap / closed
    if (!isLastSession && now >= nextSessionTime) return true;

    // Case 9: any remaining scenario with no active session → closed
    return true;
  }

  // ── Default: inside active session → OPEN ────────────────────────────────
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// useIsClosingSoon
// Returns closing-soon state when the restaurant is open but approaching close.
// ─────────────────────────────────────────────────────────────────────────────
export const useIsClosingSoon = (orderType: OrderType): ClosingSoonState => {
  const slugData = useSelector((s: RootState) => s.slug.data);

  const timeZoneCd           = slugData?.timeZoneCd           ?? '';
  const timeZone             = slugData?.timeZone             ?? '';
  const activeSessionEndTime = slugData?.activeSessionEndTime ?? null;

  // ── Resolve ETA based on active order type ────────────────────────────────
  // Mirrors scheduler: deliveryETA vs pickupETA selection by typeName match.
  const rawEta  = orderType === 'Delivery'
    ? slugData?.defaultDeliveryETA
    : slugData?.defaultPickUpETA;
  const etaMins = Number(rawEta) || 0;

  // Guard: no active session or no ETA configured → not closing soon
  if (!activeSessionEndTime || etaMins === 0) {
    return { isClosingSoon: false, closingCase: null, closingTime: '', timeZone };
  }

  // Current wall-clock time in the restaurant's timezone
  const now = getServerTime(timeZoneCd);

  // Resolve absolute closing time (handles cross-midnight)
  const activeEndTime = getActualSessionEndTime(activeSessionEndTime, timeZoneCd, now);

  // ── Compute the two threshold boundaries ─────────────────────────────────
  // preparationStart      = activeEndTime − 1×ETA  (Case 3 window starts)
  // preparationAlertStart = activeEndTime − 2×ETA  (Case 2 window starts)
  const preparationStart      = moment(activeEndTime).subtract(etaMins,     'minutes').toDate();
  const preparationAlertStart = moment(activeEndTime).subtract(etaMins * 2, 'minutes').toDate();

  // Formatted closing time shown in the banner
  const closingTime = timeZoneCd
    ? moment(activeEndTime).tz(timeZoneCd).format('hh:mm A')
    : moment(activeEndTime).format('hh:mm A');

  // ── Case 3: final 1×ETA window before close ───────────────────────────────
  if (now >= preparationStart && now < activeEndTime) {
    return { isClosingSoon: true, closingCase: 3, closingTime, timeZone };
  }

  // ── Case 2: 2×ETA → 1×ETA window before close ────────────────────────────
  if (now >= preparationAlertStart && now < preparationStart) {
    return { isClosingSoon: true, closingCase: 2, closingTime, timeZone };
  }

  // ── Default: not within any closing-soon window ───────────────────────────
  return { isClosingSoon: false, closingCase: null, closingTime: '', timeZone };
};
