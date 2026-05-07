/**
 * sessionUtils.ts
 *
 * Shared timezone-aware session helpers used by ClosedBar and useIsRestaurantClosed.
 * Logic mirrors the scheduler helper functions exactly.
 *
 * Functions:
 *   getServerTime(timeZoneCd)
 *     → Returns current wall-clock time in the restaurant's timezone.
 *       Falls back to local system time when no timezone code is provided.
 *
 *   getActualSessionEndTime(timeStr, timeZoneCd, currentDate)
 *     → Converts an "HH:MM:SS" session time string to a concrete Date,
 *       handling cross-midnight scenarios:
 *       if the computed time for today has already passed, tomorrow's
 *       equivalent is returned instead.
 */
import moment from 'moment-timezone';

// ─────────────────────────────────────────────────────────────────────────────
// getServerTime
// Returns the current moment in the restaurant's timezone as a JS Date.
// When timeZoneCd is absent/empty, falls back to local system time (new Date()).
// Mirrors scheduler's getServerTime().
// ─────────────────────────────────────────────────────────────────────────────
export const getServerTime = (timeZoneCd: string): Date => {
  if (!timeZoneCd) return new Date();
  return moment().tz(timeZoneCd).toDate();
};

// ─────────────────────────────────────────────────────────────────────────────
// getActualSessionEndTime
// Converts an "HH:MM:SS" time string (activeSessionEndTime or
// nextSession.nextSessionStartTime) into an absolute Date, respecting the
// restaurant's timezone.
//
// Cross-midnight handling:
//   - Compute todayTime  = today's date + timeStr in timeZoneCd
//   - Compute tomorrowTime = tomorrow's date + timeStr in timeZoneCd
//   - If todayTime is already in the past relative to `currentDate`,
//     return tomorrowTime (the session wraps past midnight).
//   - Otherwise return todayTime.
//
// Mirrors scheduler's getActualSessionEndTime().
// ─────────────────────────────────────────────────────────────────────────────
export const getActualSessionEndTime = (
  timeStr: string,
  timeZoneCd?: string,
  currentDate: Date = new Date()
): Date => {
  // Base moment anchored to the restaurant's timezone (or local if absent)
  const baseMoment = timeZoneCd
    ? moment.tz(currentDate, timeZoneCd)
    : moment(currentDate);

  const today    = baseMoment.clone();
  const tomorrow = baseMoment.clone().add(1, 'day');

  // Build full ISO-like strings: "YYYY-MM-DDTHH:MM:SS" in the correct tz
  const todayTime = timeZoneCd
    ? moment.tz(`${today.format('YYYY-MM-DD')}T${timeStr}`, timeZoneCd)
    : moment(`${today.format('YYYY-MM-DD')}T${timeStr}`);

  const tomorrowTime = timeZoneCd
    ? moment.tz(`${tomorrow.format('YYYY-MM-DD')}T${timeStr}`, timeZoneCd)
    : moment(`${tomorrow.format('YYYY-MM-DD')}T${timeStr}`);

  // If today's session time has already passed → the session is tomorrow
  return todayTime.isBefore(baseMoment) ? tomorrowTime.toDate() : todayTime.toDate();
};
