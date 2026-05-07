# Reservation Design Skill

## Purpose

This skill teaches how to build the **complete UI/UX design system** for a restaurant table reservation flow — every screen, component, form field, animation, layout pattern, and interaction from date/time selection through confirmation with QR code to cancellation. Use this skill whenever you need to replicate the visual design and component architecture of this reservation experience in any React project.

## Prerequisites

- **Language:** Current reference is **JavaScript (`.jsx`)** — for new projects use **TypeScript (`.tsx`)**. Type all component props with interfaces. See `order-flow/SKILL.md` for shared types and `reservation-flow/SKILL.md` for reservation-specific types (`ReservationForm`, `CountryCode`, `ReservationDetail`, etc.)
- React 19+ with TSX
- Framer Motion for animations (`framer-motion ^12.38.0`)
- Font Awesome (loaded via CDN — `fa-solid`, `fa-regular`, `fa-brands` icon classes)
- CSS files per component (this project uses component-scoped `.css` imports)
- Redux + React-Redux with typed hooks (`useAppSelector`, `useAppDispatch`)
- React Router DOM v7 for `Link` and navigation

---

## Screen-by-Screen Breakdown

### Screen Layout: Two-Column Split

The reservation page uses a two-column layout at all steps:

```
┌──────────────────────────────────────────────────┐
│                   res-container                    │
│ ┌─────────────────────────┬────────────────────┐  │
│ │   reservation-left      │ reservation-right   │  │
│ │   (glass card)          │ (sticky panel)      │  │
│ │                         │                     │  │
│ │   Step Indicator        │ Restaurant poster   │  │
│ │   ─────────────         │ image               │  │
│ │                         │                     │  │
│ │   [Step Content]        │ About Us text       │  │
│ │   (animated swap)       │ (with Read more)    │  │
│ │                         │                     │  │
│ │                         │ Payment icons       │  │
│ │                         │ (Visa, Amex, etc)   │  │
│ └─────────────────────────┴────────────────────┘  │
│                     Footer                         │
└──────────────────────────────────────────────────┘
```

### Screen 1: Step 1 — Book (Party Size + Date + Time)

**Components on screen:**

1. **StepIndicator** — 3-step horizontal progress: Book → Your Details → Confirmed
2. **Party Size Selector** — row of numbered buttons (1 to maxPartySize)
3. **InlineCalendar** — full month grid calendar
4. **TimeSlots** — horizontally wrapped pill buttons

**State driving display:**
- `partySize` (local) → which party button is active
- `selectedDate` (local) → which calendar cell is highlighted
- `selectedTime` (local) → which time pill has checkmark
- `state.reservation.slotsLoading` → spinner in time slots area
- `state.reservation.slots` → available time slot data

**Sub-components:**

**StepIndicator:**
```
┌────┐     ┌────┐     ┌────┐
│ 1  │─────│ 2  │─────│ 3  │
└────┘     └────┘     └────┘
 Book    Your Details  Confirmed
```
- Badge states: `.active` (current step, highlighted), `.done` (completed, shows checkmark)
- Connecting line: `.res-steps__line` with `.done` class for completed

**InlineCalendar:**
```
       ◀  April 2026  ▶
 SUN MON TUE WED THU FRI SAT
           1   2   3   4   5
   6   7  [8]  9  10  11  12
  13  14  15  16  17  18  19
```
- Cell states: `.past` (disabled, greyed), `.today` (subtle highlight), `.selected` (primary color)
- Navigation: `‹` and `›` buttons change month/year
- Past dates are disabled (`isPast` check)

**TimeSlots:**
- Before date selected: "Select a date to see available times" prompt with calendar icon
- Loading: spinner (`.res-spinner`)
- No slots: "No available times for this date" with clock icon
- Slots available: pill buttons in a flex-wrap grid
- Selected pill: gets `.selected` class + `fa-check` icon prefix

### Screen 2: Step 2 — Your Details (Guest Form)

**Components on screen:**

1. **BookingSummaryBar** — compact bar showing: guests + date + time + "Change" button
2. **Step2 Form** — contact details form

**BookingSummaryBar layout:**
```
┌──────────────────────────────────────────────┐
│ 👥 4 guests · Thu, Apr 15 · 6:00 PM  [Change]│
└──────────────────────────────────────────────┘
```

**Form fields (top to bottom):**

```
┌──────────────────────────────────────┐
│ Phone *                              │
│ ┌─────────┬────────────────────────┐ │
│ │ 🇺🇸 +1 ▼ │ (555) 000-0000        │ │
│ └─────────┴────────────────────────┘ │
│                                      │
│ ┌───────────────┬──────────────────┐ │
│ │ First Name *  │ Last Name        │ │
│ │ John          │ Doe              │ │
│ └───────────────┴──────────────────┘ │
│                                      │
│ Email *                              │
│ ┌──┬───────────────────────────────┐ │
│ │✉ │ you@example.com               │ │
│ └──┴───────────────────────────────┘ │
│                                      │
│ ──────── Optional ────────           │
│                                      │
│ Seating Preference                   │
│ ┌──────────────────────────────────┐ │
│ │ 🪑 No Preference            ▼   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Occasion                             │
│ ┌──────────────────────────────────┐ │
│ │ 🎂 Select occasion           ▼  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ☐ I agree to receive SMS updates...  │
│                                      │
│ [← Back]          [📅 Complete Res.] │
└──────────────────────────────────────┘
```

**State driving display:**
- `form` (local) → all form field values
- `selectedCountry` → derived from `form.countryCode`
- `state.reservation.bookingLoading` → submit button shows spinner
- `state.reservation.bookingError` → red error banner above actions

### Screen 3a: Step 3 — Confirmed

**Components on screen:**

1. **StepIndicator** (all steps completed)
2. **ConfirmedScreen** — hero + QR + details + actions + visit us

**Layout:**
```
┌──────────────────────────────────────┐
│    ✓ (animated green circle)         │
│    Reservation Confirmed!            │
│    See you soon, John.               │
│                                      │
│ ┌──────────────┬───────────────────┐ │
│ │              │                   │ │
│ │   [QR CODE]  │  6:00 PM  👥 4   │ │
│ │              │  👤 John Doe     │ │
│ │  #ABCD1234   │  📅 Thu, Apr 15  │ │
│ │  Show at     │  🪑 Patio · T-12 │ │
│ │  entrance    │  🛋 Indoor        │ │
│ │              │  🥂 Birthday      │ │
│ │  [Save QR]   │                   │ │
│ │              │  [📅 Add to Cal]  │ │
│ │              │  [🍽 View Menu]   │ │
│ └──────────────┴───────────────────┘ │
│                                      │
│  Cancel this reservation · Make New  │
│                                      │
│  ── Visit Us (mobile only) ────────  │
│  📍 4275 Miles Rd #101, Sachse, TX   │
│  📞 +1 (469) 555-1234               │
└──────────────────────────────────────┘
```

**Changes from previous version:**
- **Name row moved above date** — guest name shown right after time/guests row
- **Seating preference shown** — if `form.seatPref` has value, shows with couch icon
- **Occasion shown** — if `form.occasion` has value, shows with champagne-glasses icon
- **Cancel + New Reservation buttons** — bottom now has TWO actions separated by `·`: "Cancel this reservation" + "Make New Reservation"
- **"Visit Us" section** — shown at bottom of confirmed screen (mobile-only, hidden when RightPanel is visible on desktop). Shows location address + phone with call link

**State driving display:**
- `state.reservation.reservationDetail` → detail data (date, time, table, confirmation number)
- `state.reservation.bookingResult` → fallback booking data
- `form` (local) → guest name, phone, seatPref, occasion for display
- `qrError` (local) → whether QR image failed to load
- `locationAddress`, `locationPhone` (from parent) → "Visit Us" section

### Screen 3b: Cancel Reasons

**Shown when** user clicks "Cancel this reservation" on confirmed screen.
**StepIndicator is hidden** during cancel flow.

**Layout:**
```
┌──────────────────────────────────────┐
│ ← Cancel Reservation                │
│   Please let us know why you need    │
│   to cancel.                         │
│                                      │
│ ○ Sudden Change of plans             │
│ ● Companion Delay                    │
│ ○ Dietary Restrictions               │
│ ○ Feeling Unwell                     │
│ ○ Location Mismatch                  │
│ ○ Other                              │
│                                      │
│ [Keep Reservation] [✕ Confirm Cancel]│
└──────────────────────────────────────┘
```

If "Other" is selected:
```
│ ● Other                              │
│ ┌──────────────────────────────────┐ │
│ │ Please describe your reason...   │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                              45/100  │
```

**State driving display:**
- `selected` (local) → which reason is checked
- `otherText` (local) → custom reason text
- `state.reservation.cancelLoading` → submit button shows spinner

### Screen 3c: Cancelled

**Shown after** cancel succeeds. Now receives `selectedDate, selectedTime, partySize` props to display cancelled booking details.

**Layout:**
```
┌──────────────────────────────────────┐
│      ✕ (animated red circle)         │
│                                      │
│      Reservation Cancelled           │
│      Your reservation has been       │
│      cancelled. No charges apply.    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ✕ Cancelled                    │  │
│  │ Thursday, April 15, 2026       │  │
│  │ 6:00 PM · 👥 4 guests         │  │
│  │ ABCD1234         No charges    │  │
│  └────────────────────────────────┘  │
│                                      │
│  Notifications Sent                  │
│  ✓ Cancellation confirmation emailed │
│  ✓ SMS confirmation sent             │
│  ✓ Table released for other guests   │
│                                      │
│  We hope to see you next time!       │
│                                      │
│  [📅 Make a New Reservation]         │
└──────────────────────────────────────┘
```

**Changes from previous version:**
- **Booking details card** — shows "Cancelled" badge, formatted date, time + guest count, confirmation number + "No charges"
- **"Notifications Sent" section** — checklist with: emailed, SMS sent, table released
- **"We hope to see you next time!" text** — warm farewell message
- **Subtitle updated** — "Your reservation has been cancelled. No charges apply."

### Right Panel (all steps)

**Component:** `RightPanel`

**Always visible** in the right column across all steps. Now receives `locationAddress` and `locationPhone` props.

```
┌──────────────────────┐
│ [Restaurant Image]   │
│                      │
│ About Us             │
│ We are a family...   │
│ ... Read more        │
│                      │
│ Visit Us             │
│ 📍 4275 Miles Rd     │
│ 📞 +1 (469) 555-1234│
└──────────────────────┘
```

**Changes from previous version:**
- **"We Accept" (payment icons) replaced** with **"Visit Us"** section showing restaurant address + phone
- **New props:** `locationAddress`, `locationPhone` — passed from ReservationPage parent
- Phone shown as clickable `tel:` link

**State driving display:**
- `slugData.aboutUs` → about text (clamped with "Read more" / "Read less" toggle)
- `slugData.media` → poster/banner image (entity type `POSTER` or `BANNER`)
- `locationAddress` prop → address in "Visit Us" section
- `locationPhone` prop → phone with call link in "Visit Us" section
- Image fallback: `placeHolderMedia.jpg` on error

**Overflow detection:** Uses `requestAnimationFrame` + `scrollHeight vs clientHeight` to show/hide "Read more" button. Recalculates on resize.

---

## Component Architecture

### Component Hierarchy

```
ReservationPage
├── reservation-left (glass card column)
│   ├── StepIndicator (hidden during cancel/cancelled views)
│   └── AnimatePresence (step transitions)
│       ├── Step1 (key="s1")
│       │   ├── Party Size buttons
│       │   ├── InlineCalendar
│       │   └── TimeSlots
│       ├── Step2 (key="s2")
│       │   ├── BookingSummaryBar
│       │   └── Form
│       │       ├── CountrySelect (phone code dropdown)
│       │       ├── SeatDropdown
│       │       └── OccasionDropdown
│       └── Step3 (key="s3")
│           └── AnimatePresence (sub-view transitions)
│               ├── ConfirmedScreen (key="confirmed")
│               ├── CancelReasons (key="reasons")
│               └── CancelledScreen (key="cancelled")
├── reservation-right-col (sticky)
│   └── RightPanel
└── Footer
```

### Component Responsibility

| Component | Responsibility |
|-----------|---------------|
| `ReservationPage` | Top-level orchestrator: manages step state, form state, dispatches Redux actions |
| `StepIndicator` | Pure presentational: renders 3-step progress bar based on `step` prop |
| `InlineCalendar` | Self-contained calendar with local viewMonth/viewYear state |
| `TimeSlots` | Renders slot pills from Redux `slots` data, handles 3 API response shapes |
| `BookingSummaryBar` | Pure presentational: shows party/date/time summary with Change button |
| `Step1` | Composition: party size + InlineCalendar + TimeSlots; triggers slot fetch on date/size change |
| `Step2` | Form with validation; calls `onSubmit` callback when valid |
| `CountrySelect` | Dropdown with search for 20 country phone codes |
| `SeatDropdown` | Generic dropdown for seating sections (includes "No Preference" default) |
| `OccasionDropdown` | Generic dropdown for occasion options (includes "Select occasion" placeholder) |
| `ConfirmedScreen` | Displays QR, reservation details, calendar links, cancel trigger |
| `CancelReasons` | Radio list + textarea for "Other"; dispatches cancel action |
| `CancelledScreen` | Success message with "Make a New Reservation" CTA |
| `RightPanel` | Restaurant info: poster image, about text with read-more, payment icons |

### Props Between Components

| Component | Key Props | Source |
|-----------|-----------|--------|
| `Step1` | `partySize, setPartySize, maxPartySize, selectedDate, setSelectedDate, selectedTime, onTimeSelect, slots, slotsLoading, slotsError, locationId, dispatch` | ReservationPage state + Redux |
| `Step2` | `partySize, selectedDate, selectedTime, form, setForm, onBack, onSubmit, bookingLoading, bookingError, sections, selectedCountry, occasionOptions` | ReservationPage state + Redux |
| `ConfirmedScreen` | `reservationDetail, bookingResult, selectedDate, selectedTime, partySize, form, locationName, locationAddress, locationPhone, locationId, onStartCancel, onNewReservation` | ReservationPage state + Redux |
| `CancelReasons` | `reservationDetail, bookingResult, locationId, cancelLoading, cancelSuccess, onBack, dispatch` | Redux + callback |
| `CancelledScreen` | `reservationDetail, bookingResult, selectedDate, selectedTime, partySize, onNewReservation` | Redux + callback |
| `RightPanel` | `slugData, locationAddress, locationPhone` | Redux + parent props |
| `InlineCalendar` | `selectedDate, onSelect` | Step1 passthrough |
| `TimeSlots` | `slots, slotsLoading, slotsError, selectedTime, onSelect, selectedDate` | Step1 passthrough |
| `StepIndicator` | `step` | ReservationPage |
| `CountrySelect` | `value, onChange` | Step2 form state |
| `SeatDropdown` | `value, onChange, sections` | Step2 form state + slug data |
| `OccasionDropdown` | `value, onChange, options` | Step2 form state + slug data |

### Components Shared With Order Flow

| Component | Shared? | Notes |
|-----------|---------|-------|
| `Header` | Yes | Global navigation |
| `Footer` | Yes | `footer.jsx` — same component |
| `BottomNav` | Yes | Mobile navigation |
| `ActiveOrdersBar` | Yes | Shows active orders globally |
| `AuthModal` | No (reservation collects contact inline; but if user IS logged in, form auto-fills from `state.auth.user`) |
| `Toast` | No | Not used in reservation flow |
| `AddressModal` | No | No address needed for reservations |

---

## UX Patterns

### Loading States

| Context | Pattern |
|---------|---------|
| Time slots loading | `<span className="res-spinner" />` centered in slots area |
| Booking submission | Submit button: `<span className="res-spinner res-spinner--sm" /> Booking...` — button disabled |
| Cancel submission | Cancel button: `<span className="res-spinner res-spinner--sm" /> Cancelling...` — button disabled |
| QR code loading | Image element with `onError` fallback to `fa-qrcode` placeholder icon |

### Error Display Patterns

| Context | Pattern |
|---------|---------|
| Booking error | Red banner in form: `.res-form__error` with `fa-circle-exclamation` icon |
| Slots error | Handled in TimeSlots — shows "No available times" (same as empty) |
| QR load error | Swaps to placeholder div with `fa-qrcode` icon |

### Success / Confirmation Patterns

| Context | Pattern |
|---------|---------|
| Booking confirmed | Animated green checkmark (spring animation: `scale 0→1, stiffness:300, damping:20`) + "Reservation Confirmed!" title |
| Cancellation confirmed | Animated red X (spring animation: `scale 0→1, stiffness:280, damping:18`) + "Reservation Cancelled" title |

### Empty States

| Context | Pattern |
|---------|---------|
| No date selected | TimeSlots shows: `fa-calendar` icon + "Select a date to see available times" |
| No slots available | TimeSlots shows: `fa-clock` icon + "No available times for this date" |
| No seating sections | Dropdown hidden entirely |
| No occasion options | Dropdown shows only "Select occasion" placeholder |

---

## Form Design

### Step 2 — Guest Details Form

| Field | Label | Type | Required | Validation | Max Length | Notes |
|-------|-------|------|----------|-----------|-----------|-------|
| `phone` | Phone | tel | Yes | Non-empty digits | Country-specific (8-11) | With country code dropdown |
| `firstName` | First Name | text | Yes | Non-empty | - | Pre-filled from user |
| `lastName` | Last Name | text | No | - | - | Pre-filled from user |
| `email` | Email | email | Yes | Non-empty | - | Has envelope icon prefix |
| `seatPref` | Seating Preference | dropdown | No | - | - | Only shown if sections exist |
| `occasion` | Occasion | dropdown | No | - | - | From `slugData.specialRequests` |
| `smsConsent` | SMS Consent | checkbox | Yes | Must be checked | - | Blocking — cannot submit without |

**Field ordering and grouping:**
1. Phone (full width, with country selector)
2. First Name + Last Name (side by side, `.res-form__row`)
3. Email (full width, with icon)
4. Divider: "Optional" text separator
5. Seating Preference (full width dropdown)
6. Occasion (full width dropdown)
7. SMS Consent (checkbox with text)

**Submit button behavior:**
- Disabled when: `!smsConsent || !phone.trim() || !firstName.trim() || !email.trim()`
- Loading state: spinner + "Booking..." text
- HTML form `onSubmit` with `e.preventDefault()`

### Cancel Reasons Form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Radio selection | radio group | Yes | 6 predefined options |
| Other text | textarea | Conditional (when "Other" selected) | Max 100 chars, char counter shown |

**Cancel reasons:**
1. Sudden Change of plans
2. Companion Delay
3. Dietary Restrictions
4. Feeling Unwell
5. Location Mismatch
6. Other

**Submit validation:** `!!selected && (selected !== 'Other' || otherText.trim().length > 0)`

### Country Code Selector

**Component:** `CountrySelect`

**Behavior:**
- Click trigger → dropdown opens
- Search input (auto-focused) filters by country name or code
- 20 supported countries
- Active selection highlighted
- Click outside → closes

**Each option shows:** Flag emoji + code + country name

### Custom Dropdowns (SeatDropdown, OccasionDropdown)

Both follow the same pattern:
- Click trigger button with icon + label + chevron
- Dropdown menu below with selectable options
- Active option has checkmark
- Click outside → closes
- "No Preference" / "Select occasion" as default first option

---

## Layout & Spacing Rules

### Two-Column Layout

```css
.reservation-layout {
  display: flex;       /* row on desktop */
  gap: ...;           /* spacing between columns */
}

.reservation-left {
  flex: 1;            /* takes available space */
  /* glass card styling */
}

.reservation-right-col {
  position: sticky;   /* sticks on scroll */
  top: ...;
  width: ...;         /* fixed width */
}
```

On mobile: columns stack vertically (right panel below left).

### Step Content Transitions

All step transitions use `AnimatePresence` with consistent variants:

```javascript
const slideVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0,  opacity: 1 },
  exit:    { x: -24, opacity: 0 },
};
// transition: { duration: 0.22 }
```

Steps slide in from right, slide out to left.

### Calendar Grid

```css
.res-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* 7 days */
}
```

### Time Slots Layout

```css
.res-slots__pills {
  display: flex;
  flex-wrap: wrap;
  gap: ...;
}
```

### Form Layout

```css
.res-form__row {
  display: flex;
  gap: ...;
}
/* Two fields side-by-side (First Name + Last Name) */

.res-form__group {
  display: flex;
  flex-direction: column;
  /* label + input stacked */
}
```

### Confirmed Screen Layout

Two-column within the card:
```css
.res-confirmed__body {
  display: flex; /* QR column + details column */
}
```

On mobile: stacks vertically.

### Design Tokens / CSS Classes

| Class Pattern | Purpose |
|---------------|---------|
| `.res-steps__badge.active` | Current step badge (highlighted) |
| `.res-steps__badge.done` | Completed step (checkmark) |
| `.res-steps__line.done` | Completed connecting line |
| `.res-calendar__cell.past` | Disabled past date |
| `.res-calendar__cell.today` | Today's date highlight |
| `.res-calendar__cell.selected` | Selected date |
| `.res-slots__pill.selected` | Selected time slot |
| `.res-party__btn.active` | Selected party size |
| `.res-btn-primary` | Primary action button |
| `.res-btn-cancel` | Cancel action button (destructive) |
| `.res-form__required` | Red asterisk for required fields |
| `.res-form__consent.checked` | Checked consent checkbox style |
| `.res-form__divider` | "Optional" section divider |
| `.res-form__error` | Error banner with icon |
| `.res-confirmed__check-circle` | Green animated checkmark |
| `.res-cancelled__icon` | Red animated X mark |
| `.res-spinner` | Loading spinner |
| `.res-spinner--sm` | Small inline spinner (in buttons) |

### Image Handling

**Poster/banner image:**
```javascript
const posterMedia = (slugData?.media || slugData?.digiMenuMedia || [])
  .find(m => m.entityType === 'POSTER' || m.entityType === 'BANNER');
const posterUrl = posterMedia
  ? `${MEDIA_CDN}/${posterMedia.id}.${(posterMedia.mimeType || '').split('/').pop() || 'jpg'}`
  : placeHolderMedia;
```

**Error fallback:**
```jsx
<img
  src={posterUrl}
  alt="Restaurant"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = placeHolderMedia;
  }}
/>
```

---

## Interaction Patterns

### User Actions → Effects

| Action | Component | Effect |
|--------|-----------|--------|
| Click party size button | Step1 | Updates `partySize` state; re-fetches slots if date selected |
| Click calendar date | InlineCalendar | Sets `selectedDate`; triggers slot fetch |
| Click calendar nav (‹/›) | InlineCalendar | Changes `viewMonth`/`viewYear` |
| Click time slot pill | TimeSlots | Sets `selectedTime`; **auto-advances to Step 2** |
| Click "Change" on summary bar | BookingSummaryBar | Goes back to Step 1 |
| Type in phone field | Step2 form | Digits-only filter, respects country maxLen |
| Change country code | CountrySelect | Updates `form.countryCode`; truncates phone to new maxLen |
| Toggle SMS consent | Step2 form | Enables/disables submit button |
| Click "Complete Reservation" | Step2 form | Dispatches `createReservationRequest` → saga |
| Click "← Back" | Step2 | Goes back to Step 1 |
| Click "Cancel this reservation" | ConfirmedScreen | Transitions to CancelReasons view |
| Select cancel reason | CancelReasons | Enables cancel button; if "Other", shows textarea |
| Click "Confirm Cancellation" | CancelReasons | Dispatches `cancelReservationRequest` |
| Click "Keep Reservation" | CancelReasons | Returns to ConfirmedScreen view |
| Click "Make a New Reservation" | CancelledScreen | Resets all state, returns to Step 1 |
| Click "Add to Calendar" | ConfirmedScreen | Dropdown with 4 calendar providers |
| Click calendar provider | Calendar dropdown | Opens calendar URL in new tab (or downloads .ics) |
| Click "Save QR" | ConfirmedScreen | Downloads QR code PNG |
| Click "View Menu" | ConfirmedScreen | Navigates to `/order-online/sachse-tx/pickup` |
| Click "Read more" | RightPanel | Expands about text, shows "Read less" |

### Animations

| Context | Animation | Config |
|---------|-----------|--------|
| Step transitions | Slide in/out | `x: 24→0` in, `x: 0→-24` out, `duration: 0.22` |
| Sub-view transitions (Step 3) | Same slide | `duration: 0.2` |
| Confirmed checkmark | Spring scale | `scale: 0→1, stiffness: 300, damping: 20` |
| Cancelled X mark | Spring scale | `scale: 0→1, stiffness: 280, damping: 18` |

### Dropdown Close-on-Outside-Click Pattern

All dropdowns (CountrySelect, SeatDropdown, OccasionDropdown, Calendar dropdown) follow the same pattern:

```javascript
useEffect(() => {
  function handler(e) {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
  }
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

---

## SEO Design Considerations

### Page Structure

- The reservation page renders content server-side friendly (no client-only rendering gates)
- Restaurant name, address, and phone are in the DOM (from slug data)
- The right panel with "About Us" text provides SEO-relevant content

### Recommended Meta Tags

```html
<title>Reserve a Table at {restaurantName} | {city}, {state}</title>
<meta name="description" content="Book your table at {restaurantName}. Choose your party size, preferred date and time. Instant confirmation with QR code." />
```

### Structured Data

The reservation page is suitable for `Restaurant` schema with:
- `name`: from `slugData.branchName`
- `address`: from `slugData.address`
- `telephone`: from `slugData.phoneNumber`
- `acceptsReservations`: `true`

### Calendar Event Links

The confirmed screen generates proper calendar URLs with:
- Event title: `"Reservation at {restaurantName}"`
- Location: restaurant address
- Description: `"Confirmation #{confirmNo} · Party of {guests}"`
- Duration: 1 hour
- Supports: Google Calendar, Outlook, Yahoo, .ics download

---

---

## Reservation Route Guard & Branch Availability

### Route Guard in App.jsx

```javascript
const isReservationEnabled = isReservationEnabledByBranch(slugData);

<Route
  path="/reservation"
  element={isReservationEnabled ? <ReservationPage /> : <Navigate to="/" replace />}
/>
```

If reservation is NOT enabled for this branch → `/reservation` redirects to home.

### How Availability is Determined

```javascript
// src/utils/branchConfig.js
export function isReservationEnabledByBranch(slugData, merchantSlug = VITE_MERCHANT_SLUG) {
  const branch = getMatchedBranchByMerchantSlug(slugData, merchantSlug);
  return isTruthy(branch?.serviceDisable?.isReservation);
}

function getMatchedBranchByMerchantSlug(slugData, merchantSlug) {
  const slug = merchantSlug.trim().toLowerCase();
  return slugData?.branch?.find(b => b?.locationSlug?.trim().toLowerCase() === slug) ?? null;
}
```

**Chain:** `slugData.branch[]` → match by `locationSlug === VITE_MERCHANT_SLUG` → check `serviceDisable.isReservation` → `1` or `true` means enabled.

### Affects 3 Places

1. **Route guard** — `/reservation` redirects to `/` if disabled
2. **BottomNav** — "Reserve" tab hidden if disabled
3. **Header nav** — "Reservation" link hidden if disabled

### Reservation Layout — Two-Column Alignment

```
┌─────────────────────────────────────────────────────────────┐
│  .res-container                                              │
│  ┌─────────────────────────────┬───────────────────────────┐ │
│  │  .reservation-left          │  .reservation-right-col   │ │
│  │  (flex: 1)                  │  (sticky, fixed width)    │ │
│  │                             │                           │ │
│  │  StepIndicator              │  Restaurant poster img    │ │
│  │  ─────────────              │                           │ │
│  │                             │  About Us                 │ │
│  │  [Step Content]             │  (clamped + Read more)    │ │
│  │  · Step 1: booking          │                           │ │
│  │  · Step 2: form             │  We Accept                │ │
│  │  · Step 3: confirmed/cancel │  Visa Amex Discover Cash  │ │
│  │                             │                           │ │
│  └─────────────────────────────┴───────────────────────────┘ │
│  Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

**Mobile:** Columns stack — left panel full-width, right panel below.

---

## Gotchas & Edge Cases

1. **Time selection auto-advances:** There's no "Next" button on Step 1. Clicking a time slot immediately transitions to Step 2. This can surprise users who want to change their time after selecting.

2. **Calendar month navigation doesn't reset date:** Changing months in the calendar doesn't clear `selectedDate`. The previously selected date stays active even if it's not visible.

3. **About text overflow detection:** The "Read more" button only appears if `scrollHeight > clientHeight + 1`. It uses `requestAnimationFrame` for measurement and recalculates on resize.

4. **Country code search in dropdown:** The search filters by both country name AND dial code (e.g., searching "91" shows India).

5. **QR code external dependency:** The QR is generated by `api.qrserver.com`. If this service is down, the QR placeholder icon shows instead.

6. **Step indicator hidden during cancel flow:** When `subView === 'reasons'` or `subView === 'cancelled'`, the StepIndicator is conditionally hidden.

7. **Form partial preservation:** Going back from Step 2 to Step 1 does NOT clear the form. Phone, name, email persist. Only going through "Make a New Reservation" after cancellation partially resets (keeps contact info, clears preferences).

8. **Dropdown z-index:** The country code dropdown and other dropdowns need proper z-index to appear above form fields. The `ref` + mousedown handler pattern ensures clicks outside close the dropdown.

9. **Image poster selection:** The right panel looks for media with `entityType === 'POSTER'` first, falls back to `'BANNER'`. If neither exists, falls back to `placeHolderMedia.jpg`.

10. **Calendar event timezone:** The `.ics` and calendar URLs use the browser's local timezone. The `convertTo24` helper converts "6:00 PM" to "18:00:00" for proper datetime formatting.

---

## Checklist

- [ ] Route guarded by `isReservationEnabledByBranch(slugData)` — redirects to `/` if disabled
- [ ] BottomNav "Reserve" tab only appears when reservation is enabled for branch
- [ ] Branch matching: `slugData.branch[].locationSlug === VITE_MERCHANT_SLUG` → `serviceDisable.isReservation`
- [ ] Two-column layout: left glass card + right sticky panel
- [ ] Step indicator shows 3 steps with active/done states
- [ ] Party size selector: 1 to maxPartySize numbered buttons
- [ ] Inline calendar with month navigation, past dates disabled
- [ ] Time slots: loading state, empty state, pill buttons with selection
- [ ] Time selection auto-advances to Step 2
- [ ] Booking summary bar shows party/date/time with "Change" button
- [ ] Phone input with searchable country code dropdown (20 countries)
- [ ] Country code change truncates phone to country maxLen
- [ ] Form auto-fills from logged-in user data
- [ ] SMS consent checkbox blocks submission when unchecked
- [ ] "Optional" divider separates required and optional fields
- [ ] Seating preference dropdown only shows when sections exist
- [ ] Occasion dropdown from slug `specialRequests` data
- [ ] Submit button disabled state based on validation
- [ ] Loading spinner in submit button during API call
- [ ] Error banner with icon for booking failures
- [ ] Confirmed screen: animated checkmark (spring animation)
- [ ] QR code displayed with fallback on load error
- [ ] Confirmation number, date, time, guests, seating info displayed
- [ ] "Add to Calendar" dropdown with 4 providers (Google, Outlook, Yahoo, iCal)
- [ ] "Save QR" download link
- [ ] Cancel flow: radio reasons + "Other" textarea (100 char max)
- [ ] Cancel button disabled until reason selected
- [ ] Cancelled screen: animated X, no-charge notice, new reservation CTA
- [ ] Right panel: restaurant image with fallback, about text with read more
- [ ] Right panel: payment icons (Visa, Amex, Discover, Cash)
- [ ] All dropdowns close on outside click
- [ ] Step transitions use framer-motion slide animations
- [ ] All images have onError fallback to placeholder
