# Closed Bar Feature — Implementation Skill

> Replicate the full "restaurant closed" feature in any project with the same folder structure.
> Follow every step in order. File paths are relative to `src/`.

---

## Overview of what this feature does

| Behaviour | When restaurant is CLOSED |
|---|---|
| `ClosedBar` | Fixed red bottom bar shows next opening time |
| `MenuItemCard` | ADD button → VIEW button; note button hidden |
| `ExclusiveItemCard` | ADD button → VIEW button; note button hidden |
| `ItemDetailPage` | Cart block, mobile bar, note row hidden; modifiers shown info-only |
| Pages | `ClosedBar` mounted inside `menu.tsx`, `ordering.tsx`, `ItemDetailPage.tsx` |

---

## Step 1 — Type definitions

**File:** `types/slug.ts`

Add these interfaces and fields to your existing `SlugData`:

```ts
export interface NextSession {
  nextSessionStartTime: string; // "HH:MM:SS"
  nextSessionDay: string;       // "TODAY" | "TOMORROW" | day name
}

// Add to SlugData interface:
activeSessionEndTime?: string | null;
isLastActiveSession?: boolean;
nextSession?: NextSession | null;
timeZoneCd?: string;          // IANA code e.g. "America/New_York"
timeZone?: string;            // Display label e.g. "Eastern Time (ET)"
```

---

## Step 2 — Install dependency

```bash
npm install moment moment-timezone
```

---

## Step 3 — Shared session utilities

**New file:** `utils/sessionUtils.ts`

```ts
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
```

---

## Step 4 — useIsRestaurantClosed hook

**New file:** `hooks/useIsRestaurantClosed.ts`

```ts
/**
 * useIsRestaurantClosed
 *
 * Returns true when the restaurant is currently closed for online ordering.
 * Logic mirrors the scheduler's session-state cases 4–9 exactly.
 *
 * Data consumed from Redux (slug.data):
 *   timeZoneCd           – IANA timezone code, e.g. "America/New_York"
 *   activeSessionEndTime – "HH:MM:SS" end time of the current active session,
 *                          or null/undefined when no session is active right now.
 *   isLastActiveSession  – true when there is no further session after the active one today.
 *   nextSession          – { nextSessionStartTime, nextSessionDay } describing
 *                          the upcoming session, or null when none exists.
 *
 * Case mapping (mirrors scheduler):
 *   Case 1  – single session, now within it                      → OPEN
 *   Case 2  – multiple sessions, now within a non-last session   → OPEN
 *   Case 3  – multiple sessions, now within the last session     → OPEN
 *   Case 4  – activeSessionEndTime present, now > endTime        → CLOSED (session just ended)
 *   Case 5  – no active session, isLastSession, now > nextTime   → CLOSED (past last session)
 *   Case 6  – no active session, now <= nextTime                 → CLOSED (before first session)
 *   Case 8  – no active session, !isLastSession, now >= nextTime → CLOSED (between sessions)
 *   Case 9  – no active session, fallthrough                     → CLOSED
 */
import { useSelector } from 'react-redux';
import type { RootState } from '../types';
import { getServerTime, getActualSessionEndTime } from '../utils/sessionUtils';

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
  // activeSessionEndTime is set only while a session is ongoing.
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
  // nextSessionTime tells us when it will re-open (if at all today).
  if (!activeSessionEndTime && nextSessionTime) {
    // Case 5: last session of the day, and we are already past it → closed for the day
    if (isLastSession && now > nextSessionTime)  return true;

    // Case 6: before the very first session of the day → closed (not yet open)
    if (now <= nextSessionTime)                  return true;

    // Case 8: between sessions (not the last), but next start has been reached → closed (gap)
    if (!isLastSession && now >= nextSessionTime) return true;

    // Case 9: any remaining scenario with no active session → closed
    return true;
  }

  // ── Default: active session is ongoing and hasn't ended → OPEN ────────────
  return false;
};
```

---

## Step 5 — ClosedBar component

### 5a. SVG asset

Add the disclaimer SVG to `assets/svg/disclaimer.svg`.  
The path data below is the exact icon used (info circle with exclamation):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
  <path d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013
  4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554
  13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787
  19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702
  17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661
  16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM9.375 4.5C9.59751 4.5 9.81501
  4.56598 10 4.6896C10.185 4.81321 10.3292 4.98891 10.4144 5.19448C10.4995 5.40005 10.5218
  5.62625 10.4784 5.84448C10.435 6.06271 10.3278 6.26316 10.1705 6.4205C10.0132 6.57783
  9.81271 6.68498 9.59448 6.72838C9.37625 6.77179 9.15005 6.74951 8.94449 6.66436C8.73892
  6.57922 8.56322 6.43502 8.4396 6.25002C8.31598 6.06501 8.25 5.8475 8.25 5.625C8.25
  5.32663 8.36853 5.04048 8.57951 4.8295C8.79049 4.61853 9.07664 4.5 9.375 4.5ZM10.5
  15C10.1022 15 9.72065 14.842 9.43934 14.5607C9.15804 14.2794 9 13.8978 9 13.5V9.75C8.80109
  9.75 8.61033 9.67098 8.46967 9.53033C8.32902 9.38968 8.25 9.19891 8.25 9C8.25 8.80109
  8.32902 8.61032 8.46967 8.46967C8.61033 8.32902 8.80109 8.25 9 8.25C9.39783 8.25 9.77936
  8.40804 10.0607 8.68934C10.342 8.97064 10.5 9.35218 10.5 9.75V13.5C10.6989 13.5 10.8897
  13.579 11.0303 13.7197C11.171 13.8603 11.25 14.0511 11.25 14.25C11.25 14.4489 11.171
  14.6397 11.0303 14.7803C10.8897 14.921 10.6989 15 10.5 15Z"/>
</svg>
```

### 5b. ClosedBar.tsx

**New file:** `components/ClosedBar/ClosedBar.tsx`

```tsx
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import moment from 'moment-timezone';
import type { RootState } from '../../types';
import { getServerTime, getActualSessionEndTime } from '../../utils/sessionUtils';
import { useIsRestaurantClosed } from '../../hooks/useIsRestaurantClosed';
import './ClosedBar.css';

// AOB bar height kept in sync with ActiveOrdersBar.css (.aob-collapsed height)
const AOB_HEIGHT = 40;

/** Disclaimer SVG — inline so it flows with the text */
function DisclaimerIcon(): React.JSX.Element {
  return (
    <svg
      className="cb-disclaimer-icon"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013
      4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554
      13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787
      19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702
      17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661
      16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM9.375 4.5C9.59751 4.5 9.81501
      4.56598 10 4.6896C10.185 4.81321 10.3292 4.98891 10.4144 5.19448C10.4995 5.40005 10.5218
      5.62625 10.4784 5.84448C10.435 6.06271 10.3278 6.26316 10.1705 6.4205C10.0132 6.57783
      9.81271 6.68498 9.59448 6.72838C9.37625 6.77179 9.15005 6.74951 8.94449 6.66436C8.73892
      6.57922 8.56322 6.43502 8.4396 6.25002C8.31598 6.06501 8.25 5.8475 8.25 5.625C8.25
      5.32663 8.36853 5.04048 8.57951 4.8295C8.79049 4.61853 9.07664 4.5 9.375 4.5ZM10.5
      15C10.1022 15 9.72065 14.842 9.43934 14.5607C9.15804 14.2794 9 13.8978 9 13.5V9.75C8.80109
      9.75 8.61033 9.67098 8.46967 9.53033C8.32902 9.38968 8.25 9.19891 8.25 9C8.25 8.80109
      8.32902 8.61032 8.46967 8.46967C8.61033 8.32902 8.80109 8.25 9 8.25C9.39783 8.25 9.77936
      8.40804 10.0607 8.68934C10.342 8.97064 10.5 9.35218 10.5 9.75V13.5C10.6989 13.5 10.8897
      13.579 11.0303 13.7197C11.171 13.8603 11.25 14.0511 11.25 14.25C11.25 14.4489 11.171
      14.6397 11.0303 14.7803C10.8897 14.921 10.6989 15 10.5 15Z" />
    </svg>
  );
}

/**
 * Builds the closed message — mirrors scheduler's type string logic exactly.
 * SVG icon is inline-linked with the text (not a separate sibling element).
 *   TODAY / ALL  → "[icon] We are closed. We will begin accepting online orders at [time] [tz]."
 *   TOMORROW     → "[icon] We are closed. Online ordering will resume TOMORROW at [time] [tz]."
 *   other day    → "[icon] We are closed. Online ordering will resume on [day] at [time] [tz]."
 */
function buildMessage(day: string, time: string, timeZone: string): React.ReactNode {
  const isTodayOrTomorrow = day === 'TODAY' || day === 'TOMORROW';
  const tzLabel = timeZone ? <>&nbsp;{timeZone}</> : null;

  if (day === 'ALL' || day === 'TODAY') {
    return (
      <><DisclaimerIcon />&nbsp;We are closed.&nbsp;We will begin accepting online orders at&nbsp;<strong>{time}</strong>{tzLabel}.</>
    );
  }

  const prefix = isTodayOrTomorrow ? '' : 'on ';
  return (
    <>
      <DisclaimerIcon />&nbsp;We are closed.&nbsp;Online ordering will resume&nbsp;
      {prefix}<strong>{day}</strong> at&nbsp;<strong>{time}</strong>{tzLabel}.
    </>
  );
}

export default function ClosedBar(): React.JSX.Element {
  const restaurantClosed = useIsRestaurantClosed();
  const slugData         = useSelector((s: RootState) => s.slug.data);
  const activeOrders     = useSelector((s: RootState) => s.activeOrders.orders);

  const timeZoneCd  = slugData?.timeZoneCd ?? '';
  const timeZone    = slugData?.timeZone ?? '';
  const nextSession = slugData?.nextSession;

  const now = getServerTime(timeZoneCd);

  let nextSessionTime: Date | null = null;
  let formattedTime = '';

  if (nextSession?.nextSessionStartTime) {
    nextSessionTime = getActualSessionEndTime(
      nextSession.nextSessionStartTime,
      timeZoneCd,
      now
    );
    formattedTime = timeZoneCd
      ? moment(nextSessionTime).tz(timeZoneCd).format('hh:mm A')
      : moment(nextSessionTime).format('hh:mm A');
  }

  const shouldShow      = restaurantClosed && !!nextSessionTime && !!nextSession?.nextSessionDay;
  const day             = nextSession?.nextSessionDay ?? '';
  const hasActiveOrders = activeOrders.length > 0;
  const aobHeight       = hasActiveOrders ? AOB_HEIGHT : 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="cb-root"
          style={{ bottom: aobHeight, width: hasActiveOrders ? undefined : '100%' }}
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          role="status"
          aria-live="polite"
        >
          <span className="cb-text">{buildMessage(day, formattedTime, timeZone)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 5c. ClosedBar.css

**New file:** `components/ClosedBar/ClosedBar.css`

> Adjust colours, font-size, padding, and radius to match your project's AOB bar.

```css
.cb-root {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;           /* one level below AOB (z-index: 1100) */
  display: flex;
  align-items: center;
  padding: 0.5rem 1.4rem;
  background: #d32f2f;     /* red — restaurant closed */
  color: #ffffff;
  font-size: 0.8rem;
  line-height: 1.4;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  width: 97%;
  margin: 0 auto;
}

/* Text span — holds both the icon and the message inline */
.cb-text {
  flex: 1;
  display: inline;
}

/* Disclaimer SVG — inline-linked with the text */
.cb-disclaimer-icon {
  display: inline;
  vertical-align: middle;
  position: relative;
  top: -1px;
  margin-right: 0.35rem;
  flex-shrink: 0;
}

.cb-text strong {
  font-weight: 700;
}

@media (max-width: 640px) {
  .cb-root {
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
    width: 96%;
  }
}

@media (max-width: 576px) {
  .cb-root {
    font-size: 0.75rem;
    padding: 0.4rem 1rem;
    line-height: 1.6;
    border-radius: 12px 12px 0 0;
    width: 96%;
  }
}
```

---

## Step 6 — ActiveOrdersBar CSS tweak

**File:** `components/ActiveOrdersBar/ActiveOrdersBar.css`

Make sure `.aob-collapsed` uses the same border-radius as ClosedBar so they look paired:

```css
.aob-collapsed {
  /* ... existing rules ... */
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

@media (max-width: 640px) {
  .aob-collapsed {
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
  }
}

@media (max-width: 576px) {
  .aob-collapsed {
    border-radius: 12px 12px 0 0;
  }
}
```

> Also keep the `AOB_HEIGHT` constant in `ClosedBar.tsx` in sync with the actual
> pixel height of `.aob-collapsed` (currently `40`).

---

## Step 7 — MenuItemCard changes

**File:** `components/menuItemCard/MenuItemCard.tsx`

### 7a. Add import
```tsx
import { useIsRestaurantClosed } from '../../hooks/useIsRestaurantClosed';
```

### 7b. Add hook inside the component
```tsx
const isRestaurantClosed = useIsRestaurantClosed();
```

### 7c. Remove any combined `isUnavailable` flag
Only use the three individual flags from `getItemUnavailability(item)`:
```tsx
const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } = getItemUnavailability(item);
// showOverlay is derived from these three — do NOT add available/itemOff checks
```

### 7d. Note button — hide when restaurant is closed
```tsx
{!showOverlay && ((!isRestaurantClosed && qty > 0) || hasModifiers) && (
  <div className="mic-badges mic-badges--img">
    {!isRestaurantClosed && qty > 0 && (
      <button type="button" className="mic-note-btn" onClick={openNoteModal} ...>
        ...
      </button>
    )}
    {hasModifiers && (
      <span className="mic-modifier-badge">...</span>
    )}
  </div>
)}
```

### 7e. ADD / VIEW / Qty control
```tsx
{!showOverlay && (
  isRestaurantClosed ? (
    <button className="mic-add-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
      VIEW
    </button>
  ) : qty === 0 ? (
    <button className="mic-add-btn" onClick={handleAddClick}>ADD</button>
  ) : (
    <div className="mic-qty-ctrl">
      <button onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, -1)); }}>−</button>
      <span>{qty}</span>
      <button onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, 1)); }}>+</button>
    </div>
  )
)}
```

---

## Step 8 — ExclusiveItemCard changes

**File:** `components/exclusiveItemCard/ExclusiveItemCard.tsx`

Same pattern as MenuItemCard:

### 8a. Add import + hook
```tsx
import { useIsRestaurantClosed } from '../../hooks/useIsRestaurantClosed';
// inside component:
const isRestaurantClosed = useIsRestaurantClosed();
```

### 8b. Note button — hide when closed
```tsx
{((!isRestaurantClosed && qty > 0) || hasModifiers) && (
  <div className="eic-badges">
    {!isRestaurantClosed && qty > 0 && (
      <button type="button" className="eic-note-btn" onClick={openNoteModal} ...>...</button>
    )}
    {hasModifiers && <span className="eic-modifier-badge">...</span>}
  </div>
)}
```

### 8c. ADD / VIEW / Qty control
```tsx
{isRestaurantClosed ? (
  <button className="eic-add-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
    VIEW
  </button>
) : qty === 0 ? (
  <button className="eic-add-btn" onClick={handleAddClick}>ADD</button>
) : (
  <div className="eic-qty-ctrl">
    <button onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, -1)); }}>−</button>
    <span>{qty}</span>
    <button onClick={(e) => { e.stopPropagation(); dispatch(updateQtyAction(lineId, 1)); }}>+</button>
  </div>
)}
```

---

## Step 9 — ItemDetailPage changes

**File:** `pages/itemDetail/ItemDetailPage.tsx`

### 9a. Add imports
```tsx
import { useIsRestaurantClosed } from '../../hooks/useIsRestaurantClosed';
import ClosedBar from '../../components/ClosedBar/ClosedBar';
```

### 9b. Add hook
```tsx
const isRestaurantClosed = useIsRestaurantClosed();
```

### 9c. Remove combined isUnavailable — use individual flags only
```tsx
const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } = getItemUnavailability(item);
const isItemBlocked = isTemporarilyUnavailable || isOutOfStock || !!isUnAvailableUntil;
```

### 9d. openNoteModal — only guard against item blocked
```tsx
const openNoteModal = () => { if (!isItemBlocked) setNoteOpen(true); };
```

### 9e. Item note row — hidden when restaurant is closed
```tsx
{!isRestaurantClosed && (
  <div className="idp__note-row">
    <button
      type="button"
      className={`idp__note-btn${isItemBlocked ? ' idp__note-btn--disabled' : ''}`}
      disabled={isItemBlocked}
      onClick={openNoteModal}
    >
      ...
    </button>
  </div>
)}
```

### 9f. ModifierSelector — infoOnly when closed, disabled when item blocked
```tsx
<ModifierSelector
  groups={customGroups}
  selectedModifiers={selectedModifiers}
  onUpdate={setSelectedModifiers}
  disabled={isItemBlocked}
  infoOnly={isRestaurantClosed}   // hides Required/Optional badges, pills non-interactive
/>
{/* Validation hidden when closed or item blocked */}
{!isItemBlocked && !isRestaurantClosed && !modifierValidation.valid && (
  <div className="idp__mod-validation">...</div>
)}
```

### 9g. Cart block (desktop) — hidden when closed
```tsx
{!isRestaurantClosed && (
  <div className="idp__cart-block">
    ...
  </div>
)}
```

### 9h. Mobile qty+add bar (below image) — hidden when closed OR item blocked
```tsx
{!isItemBlocked && !isRestaurantClosed && (
  <div className="idp__img-bar">...</div>
)}
```

### 9i. Mobile sticky bottom bar — hidden when closed
```tsx
{!isRestaurantClosed && (
  <div className="idp__mobile-bar">...</div>
)}
```

### 9j. Image scrim — only for item-level unavailability (NOT for restaurant closed)
```tsx
{isItemBlocked && (
  <div className="idp__img-scrim">...</div>
)}
```

### 9k. ClosedBar at the bottom of the return
```tsx
<ItemNoteModal ... />
<ClosedBar />
```

### 9l. ModifierSelector infoOnly prop (add to the component if not already there)
```tsx
interface ModifierSelectorProps {
  groups: ModifierGroup[];
  selectedModifiers: SelectedModifier[];
  onUpdate: (modifiers: SelectedModifier[]) => void;
  disabled: boolean;
  infoOnly?: boolean; // hides badges, pills non-interactive
}

function ModifierSelector({ ..., infoOnly = false }) {
  // In toggleOption: if (disabled || infoOnly) return;
  // Badges: {!infoOnly && <div className="idp__mod-group-meta">...</div>}
  // Pills: disabled={infoOnly || atCap || disabled}
  //        selected state: const selected = !infoOnly && groupSels.some(...)
  //        className includes 'idp__mod-pill--readonly' when (disabled || infoOnly)
}
```

---

## Step 10 — Mount ClosedBar on pages

**File:** `pages/menu/menu.tsx`
```tsx
import ClosedBar from '../../components/ClosedBar/ClosedBar';

// Inside return, at the bottom of the root div:
<ClosedBar />
```

**File:** `pages/ordering/ordering.tsx`
```tsx
import ClosedBar from '../../components/ClosedBar/ClosedBar';

// Inside return, at the bottom of the root div:
<ClosedBar />
```

> **Do NOT** add `<ClosedBar />` to `App.tsx` — it should only render on menu/ordering/item-detail pages.

---

## Step 11 — Remove ClosedBar from App.tsx (if it was added globally)

```tsx
// Remove this import:
import ClosedBar from './components/ClosedBar/ClosedBar';

// Remove this JSX:
<ClosedBar />
```

---

## Quick checklist

- [ ] `types/slug.ts` — `NextSession` interface + 5 fields on `SlugData`
- [ ] `npm install moment moment-timezone`
- [ ] `utils/sessionUtils.ts` — NEW file
- [ ] `hooks/useIsRestaurantClosed.ts` — NEW file
- [ ] `assets/svg/disclaimer.svg` — NEW file
- [ ] `components/ClosedBar/ClosedBar.tsx` — NEW file
- [ ] `components/ClosedBar/ClosedBar.css` — NEW file
- [ ] `components/ActiveOrdersBar/ActiveOrdersBar.css` — border-radius match
- [ ] `components/menuItemCard/MenuItemCard.tsx` — hook + VIEW btn + note guard
- [ ] `components/exclusiveItemCard/ExclusiveItemCard.tsx` — hook + VIEW btn + note guard
- [ ] `pages/itemDetail/ItemDetailPage.tsx` — hook + isItemBlocked + infoOnly + hidden blocks + ClosedBar
- [ ] `pages/menu/menu.tsx` — ClosedBar mounted
- [ ] `pages/ordering/ordering.tsx` — ClosedBar mounted
- [ ] `App.tsx` — ClosedBar NOT present globally
