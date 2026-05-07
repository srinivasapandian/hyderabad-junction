# Reservation Flow Skill

## Purpose

This skill teaches how to build a complete **table reservation flow** for a restaurant web app — from selecting party size, date, and time slot, to filling in guest details, receiving a confirmed reservation with QR code, and handling cancellations. Use this skill whenever you need to replicate a full reservation pipeline in any React + Redux-Saga project.

## Prerequisites

### Language

The current reference implementation uses **JavaScript (`.js` / `.jsx`)**. For new projects, use **TypeScript (`.ts` / `.tsx`)** instead. Convert all code snippets to TS when implementing.

Key interfaces for the reservation flow:

```typescript
interface ReservationState {
  slots: SlotsResponse | null;
  slotsLoading: boolean;
  slotsError: string | null;
  bookingResult: BookingResult | null;
  reservationDetail: ReservationDetail | null;
  bookingLoading: boolean;
  bookingError: string | null;
  bookingSuccess: boolean;
  cancelLoading: boolean;
  cancelError: string | null;
  cancelSuccess: boolean;
}

interface SlotsResponse {
  sessions: Array<{
    sessionName: string;
    slots: Array<string | { time: string; available: boolean }>;
  }>;
}

interface CreateReservationPayload {
  userId: string;
  locationId: string;
  merchantSlug: string;
  partyName: string;
  partyPhone: string;
  kidSize: number;
  sectionId: string;
  isReceiveTransMsg: 0 | 1;
  partySize: number;
  deviceId: string;
  channelName: string;
  seatTogether: string;
  isReservation: number;
  reservationDate: string;      // 'YYYY-MM-DD'
  reservationSlot: string;      // '6:00 PM'
  sessionName: string;
  notes: string;
  highChairSize: number;
}

interface BookingResult {
  id: string;
  reservationId: string;
  confirmationNo: string;
  partyName: string;
  partySize: number;
  reservationDate: string;
  reservationSlot: string;
}

interface ReservationDetail extends BookingResult {
  partyPhone: string;
  tableDetails: Array<{ sectionName: string; tableName: string }>;
}

interface CancelPayload {
  locationId: string;
  reservationId: string;
  cancelReason: string;
}

interface ReservationForm {
  countryCode: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  seatPref: string;
  occasion: string;
  smsConsent: boolean;
}

interface CountryCode {
  code: string;       // '+1'
  label: string;      // '🇺🇸 +1'
  country: string;    // 'United States'
  maxLen: number;     // 10
}

// See order-flow/SKILL.md for shared types: SlugData, RootState, AuthState, etc.
```

### Packages to Install

```json
{
  "axios": "^1.14.0",
  "crypto-js": "^4.2.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-redux": "^9.2.0",
  "react-router-dom": "^7.13.0",
  "redux": "^5.0.1",
  "redux-saga": "^1.4.2",
  "framer-motion": "^12.38.0"
}
```

### Environment Variables

```env
VITE_BASE_URL=https://apiq.gcp.magilhub.com/magilhub-data-services  # single base URL for ALL internal APIs
VITE_E_KEY=<32-character AES encryption key>
VITE_MERCHANT_SLUG=<merchant-location-slug>
```

### Service Accounts / API Keys Required

- AES-128/256 encryption key (shared with backend, same key as order flow)
- No additional payment or reCAPTCHA keys needed (reservation is free)

---

## API Integration Layer

### LEGEND: Token Requirements

- `[No Token]` — Public endpoint, no Authorization header needed
- `[Token Required]` — Must send `Authorization: Bearer <access_token>` header
- `[*]` — Plain JSON (no encryption)
- `[**]` — Encrypted payload and/or response (AES via crypto-js)

### Prerequisite APIs (shared with order-flow)

Before the reservation flow can work, two APIs must have already been called:

1. **Slug API** (`POST /api/customers/locations/slug`) — `[No Token]` `[**]`
   - Provides `locationId`, `maxOnlineCheckin`, `sectionDetailsList`, `specialRequests`, `branch` data
   - See `order-flow/SKILL.md` for full details

2. **Auth Flow** (optional for reservation but enhances UX)
   - Request OTP → Verify OTP → (Register if new user)
   - If logged in, reservation form auto-fills from user profile
   - `access_token` used as Bearer token for all reservation APIs
   - See `order-flow/SKILL.md` for full auth flow details

### Slug Data Fields Used by Reservation Flow

The reservation flow reads these specific fields from `state.slug.data` (populated by the Slug API):

| Slug Field | Used In | Purpose |
|------------|---------|---------|
| `id` / `locationId` | ReservationPage, all 4 reservation API calls | **locationId** — passed to fetch slots, create, cancel |
| `maxOnlineCheckin` | Step1 party-size selector | Max selectable party size (default: 10 if missing) |
| `branchName` / `name` | ConfirmedScreen, RightPanel | Restaurant display name |
| `address` / `branchAddress` | ConfirmedScreen | Address shown on confirmation + used in calendar event `location` field |
| `phoneNumber` / `phone` | ConfirmedScreen | Phone with "Call" link |
| `sectionDetailsList[]` | Step2 SeatDropdown | Array of `{ id, sectionName, isEnabled }`. Only sections with `isEnabled === 1` or `true` shown. First enabled section used as default `sectionId` in payload |
| `specialRequests[]` | Step2 OccasionDropdown | Array of strings (e.g. `["Birthday", "Anniversary", "Business Meeting"]`). Deduped by lowercase. Selected value goes into `notes` field |
| `slug` / `merchantSlug` | createReservation payload | Sent as `merchantSlug` field: `slugData?.slug \|\| slugData?.merchantSlug` |
| `aboutUs` / `about_us` / `about` / `description` | RightPanel | "About Us" text with Read more/less toggle |
| `media[]` / `digiMenuMedia[]` | RightPanel | Poster/banner image lookup: `find(m => m.entityType === 'POSTER' \|\| 'BANNER')` → CDN URL |
| `branch[]` | App.jsx, Header, BottomNav | Matched by `locationSlug === VITE_MERCHANT_SLUG` |
| `branch[].serviceDisable.isReservation` | Route guard + nav visibility | If NOT truthy → `/reservation` redirects to `/`, Reserve tab hidden, header link hidden |

---

### Base URL

All 4 reservation endpoints use a **specific base URL** that is explicitly overridden on each axios call:

```
Base: https://apiq.gcp.magilhub.com/magilhub-data-services
```

This is passed as a `baseURL:` override on each axios call, overriding the default `VITE_BASE_URL`.

| # | Reservation Endpoint | Full URL |
|---|---------------------|----------|
| 1 | Fetch Slots | `GET https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/reservation/generate-reservation-slot/{locationId}?guestCount=2&date=2026-04-22` |
| 2 | Create Reservation | `POST https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/checkIn/fetch?data=<encrypted>` |
| 3 | Reservation Details | `POST https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/checkIn/reservationId` |
| 4 | Cancel Reservation | `PUT https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/reservation/cancel-table?user=customer` |

### Common Header Builder

```javascript
const normalizeBearerToken = (token) =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

const buildHeaders = (token, extra = {}) => ({
  'x-app-version': 'v2',
  ...(normalizeBearerToken(token) ? { Authorization: normalizeBearerToken(token) } : {}),
  ...extra,
});
```

### API Endpoints

#### 1. Fetch Available Time Slots

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/customers/reservation/generate-reservation-slot/{locationId}` |
| **Base URL** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| **When called** | When user selects a date, or changes party size while a date is selected |
| **Encrypted** | `[*]` Plain JSON response |
| **Auth** | `[Token Required]` (optional — works without but recommended) |

**Request params:**
```
?guestCount=4&date=2026-04-15
```

**Full URL example:**
```
GET https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/reservation/generate-reservation-slot/abc-location-uuid?guestCount=4&date=2026-04-15
```

**Response shape:**
```json
{
  "sessions": [
    {
      "sessionName": "Lunch",
      "slots": [
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "12:30 PM",
        "1:00 PM"
      ]
    },
    {
      "sessionName": "Dinner",
      "slots": [
        "5:00 PM",
        "5:30 PM",
        "6:00 PM",
        "6:30 PM",
        "7:00 PM"
      ]
    }
  ]
}
```

**Alternative response shapes (the UI handles all):**
```json
// Shape A: array of day objects
[{ "date": "2026-04-15", "sessions": [...] }]

// Shape B: nested under data
{ "data": { "sessions": [...] } }

// Shape C: slots as objects instead of strings
{ "sessions": [{ "slots": [{ "time": "11:00 AM", "available": true }] }] }
```

**Trigger in saga:** `fetchSlotsRequest({ locationId, date: '2026-04-15', partySize: 4 })`

#### 2. Create Reservation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/checkIn/fetch` |
| **Base URL** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| **When called** | When user submits the details form (Step 2) |
| **Encrypted** | `[**]` Payload sent as query param `?data=encryptJson(payload)` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "userId": "<customer-uuid-or-empty>",
  "locationId": "<location-uuid>",
  "merchantSlug": "masala-twist-sachse",
  "partyName": "John Doe",
  "partyPhone": "+15551234567",
  "kidSize": 0,
  "sectionId": "<section-uuid-or-first-section>",
  "isReceiveTransMsg": 1,
  "partySize": 4,
  "deviceId": "",
  "channelName": "ONLINE",
  "seatTogether": "1",
  "isReservation": 1,
  "reservationDate": "2026-04-15",
  "reservationSlot": "6:00 PM",
  "sessionName": "6:00 PM",
  "notes": "Birthday",
  "highChairSize": 0
}
```

**How the payload is sent:**
```javascript
API_MENU.post(
  '/api/customers/checkIn/fetch',
  null, // no body
  {
    baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
    params: { data: encryptJson(payload) }, // encrypted in query param
    headers: buildHeaders(token, { 'content-type': 'application/json' }),
  },
);
```

**Response shape (encrypted → decrypted):**
```json
{
  "body": {
    "id": "<reservation-uuid>",
    "reservationId": "<reservation-uuid>",
    "confirmationNo": "ABCD1234",
    "partyName": "John Doe",
    "partySize": 4,
    "reservationDate": "2026-04-15",
    "reservationSlot": "6:00 PM"
  }
}
```

**Decryption:** Response has `encryptedText` or `data` field → `decryptJson()`.

#### 3. Fetch Reservation Detail by ID

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/checkIn/reservationId` |
| **Base URL** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| **When called** | Immediately after create succeeds (2-step flow in saga) |
| **Encrypted** | `[**]` Request: `{ data: encryptJson({ reservationId }) }` in body — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{ "reservationId": "<reservation-uuid>" }
```

**Response shape (after decryption):**
```json
{
  "body": [
    {
      "id": "<reservation-uuid>",
      "confirmationNo": "ABCD1234",
      "partyName": "John Doe",
      "partyPhone": "+15551234567",
      "partySize": 4,
      "reservationDate": "2026-04-15",
      "reservationSlot": "6:00 PM",
      "tableDetails": [
        {
          "sectionName": "Patio",
          "tableName": "T-12"
        }
      ]
    }
  ]
}
```

**Note:** Response body is an **array** — the saga extracts `body[0]` or falls back to the whole body if not an array.

#### 4. Cancel Reservation

| Field | Value |
|-------|-------|
| **Endpoint** | `PUT /api/customers/reservation/cancel-table` |
| **Base URL** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| **When called** | When user confirms cancellation with a reason |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` in body |
| **Auth** | `[Token Required]` |
| **Query params** | `?user=customer` (always sent) |

**Full URL example:**
```
PUT https://apiq.gcp.magilhub.com/magilhub-data-services/api/customers/reservation/cancel-table?user=customer
```

**How it's sent:**
```javascript
API_MENU.put(
  '/api/customers/reservation/cancel-table',
  { data: encryptJson({ locationId, reservationId, cancelReason }) },
  {
    baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services',
    params: { user: 'customer' },  // REQUIRED query param
    headers: buildHeaders(token, { 'content-type': 'application/json' }),
  },
);
```

**Request payload (before encryption):**
```json
{
  "locationId": "<location-uuid>",
  "reservationId": "<reservation-uuid>",
  "cancelReason": "Sudden Change of plans"
}
```

**Response:** Success or error. The saga dispatches `cancelReservationSuccess()` even on API error (to prevent UI getting stuck).

---

## Encryption / Decryption

Same encryption system as the order flow. See order-flow/SKILL.md for full details.

**Key difference for reservation:** The `createReservationApi` sends the encrypted payload as a **query parameter** (`?data=...`), not in the request body. The body is `null`.

```javascript
// Reservation create — encrypted in query param
API_MENU.post('/api/customers/checkIn/fetch', null, {
  params: { data: encryptJson(payload) },
  ...
});

// vs. Order create — encrypted in request body
API_MENU.post('/api/customers/order/createOrder', {
  data: encryptJson(payload),
}, { ... });
```

**Decryption in saga (2-step):**
```javascript
// Step 1: Create
const res1 = yield call(createReservationApi, payload, token);
const enc1 = res1.data?.encryptedText ?? res1.data?.data;
const bookingResult = enc1 ? decryptJson(enc1) : (res1.data ?? {});
const body1 = bookingResult?.body ?? bookingResult;

// Step 2: Fetch detail
const res2 = yield call(fetchReservationByIdApi, { reservationId }, token);
const enc2 = res2.data?.encryptedText ?? res2.data?.data;
const raw2 = enc2 ? decryptJson(enc2) : (res2.data ?? {});
const body2 = raw2?.body ?? raw2;
const reservationDetail = Array.isArray(body2) ? (body2[0] || {}) : body2;
```

---

## State Management

### Redux Store Shape (reservation slice)

```
store.reservation
├── slots: object | null            // API response from fetchReservationSlotsApi
├── slotsLoading: boolean
├── slotsError: string | null
├── bookingResult: object | null     // raw create response body
├── reservationDetail: object | null // detailed reservation from fetchById
├── bookingLoading: boolean
├── bookingError: string | null
├── bookingSuccess: boolean          // triggers step 2 → 3 transition
├── cancelLoading: boolean
├── cancelError: string | null
└── cancelSuccess: boolean           // triggers confirmed → cancelled view
```

### State Transitions

```
Initial state (all null/false)
  ↓ fetchSlotsRequest
slotsLoading: true, slots: null
  ↓ fetchSlotsSuccess
slotsLoading: false, slots: { sessions: [...] }
  ↓ createReservationRequest
bookingLoading: true, bookingError: null, bookingSuccess: false
  ↓ createReservationSuccess
bookingLoading: false, bookingSuccess: true, bookingResult: {...}, reservationDetail: {...}
  ↓ cancelReservationRequest
cancelLoading: true, cancelSuccess: false
  ↓ cancelReservationSuccess
cancelLoading: false, cancelSuccess: true
  ↓ resetReservation
→ back to initial state (all null/false)
```

### What Persists Across Page Reloads

**Nothing.** The reservation slice is NOT persisted via redux-persist. All reservation state resets on page reload. This is intentional — reservations are one-shot flows.

### What Clears on Completion

On "Make a New Reservation":
1. `resetReservation()` — resets entire reservation slice
2. `clearSlots()` — clears slot data
3. Local state reset: step=1, partySize=2, selectedDate=null, selectedTime=null, form partially reset

---

## Packages Used

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.14.0 | HTTP client; shared `API_MENU` instance with baseURL override |
| `crypto-js` | ^4.2.0 | AES encryption for create/cancel/fetchById payloads |
| `redux` | ^5.0.1 | State container |
| `react-redux` | ^9.2.0 | React bindings |
| `redux-saga` | ^1.4.2 | Async flow: create (2-step), cancel with fallback |
| `react-router-dom` | ^7.13.0 | Navigation, `Link` component |
| `framer-motion` | ^12.38.0 | Step transitions, confirmation animations |

---

## Flow Steps (Step-by-Step)

### Step 1: Select Party Size, Date, and Time

1. User lands on `/reservation` page
2. **Party size** defaults to 2. User selects from 1 to `slugData.maxOnlineCheckin` (default 10)
3. **Date selection** via inline calendar component:
   - Past dates are disabled
   - Today is highlighted
   - Selected date gets "selected" style
4. When date is selected (or party size changes with date already selected):
   - Dispatches `fetchSlotsRequest({ locationId, date: toISODate(selectedDate), partySize })`
   - Shows loading spinner in time slots area
5. **Time slot selection** from pills:
   - Slots extracted from `sessions[].slots[]` in API response
   - Handles 3 response shapes (flat array, day-objects array, nested data)
   - Unavailable slots filtered out (`s.available !== false`)
   - Selected slot gets checkmark icon
6. When time is selected → auto-advances to Step 2 (`setStep(2)`)

### Step 2: Fill Guest Details

1. **Booking summary bar** shows: party size, date, time — with "Change" button to go back
2. **Form fields:**
   - Phone (required): country code selector + phone input
   - First Name (required)
   - Last Name (optional)
   - Email (required)
   - Seating Preference (optional): dropdown from `slugData.sectionDetailsList`
   - Occasion (optional): dropdown from `slugData.specialRequests`
   - SMS Consent (required checkbox): "I agree to receive SMS updates"
3. **Auto-fill from logged-in user:**
   - `user.mobilePhone` → parsed with `splitPhoneWithCountry()` → populates country code + number
   - `user.firstName`, `user.lastName`, `user.email` → pre-filled
4. **Submit validation:** `smsConsent && phone.trim() && firstName.trim() && email.trim()`
5. On submit → builds reservation payload → dispatches `createReservationRequest(payload)`

### Step 3: Reservation Confirmed

1. Saga performs **2-step creation:**
   - Step A: `createReservationApi(payload, token)` — creates reservation
   - Step B: `fetchReservationByIdApi({ reservationId }, token)` — fetches full detail
2. On `bookingSuccess === true` → UI transitions to Step 3 confirmed view
3. **Confirmed screen shows:**
   - Animated green checkmark circle
   - "Reservation Confirmed!" title
   - QR code (generated via external API: `https://api.qrserver.com/v1/create-qr-code/`)
   - Confirmation number
   - Time + guest count row
   - Guest name (moved above date)
   - Date, seating info (from API `tableDetails`)
   - Seating preference (if selected — from `form.seatPref`)
   - Occasion (if selected — from `form.occasion`)
   - "Add to Calendar" button (Google, Outlook, Yahoo, iCal)
   - "View Menu" link
   - Two bottom actions: "Cancel this reservation" · "Make New Reservation"
   - "Visit Us" section (mobile-only) — address + phone from slug data

### Step 4: Cancel Reservation (optional)

1. User clicks "Cancel this reservation" → transitions to cancel reasons view
2. **Cancel reasons** (radio selection):
   - Sudden Change of plans
   - Companion Delay
   - Dietary Restrictions
   - Feeling Unwell
   - Location Mismatch
   - Other (shows textarea, max 100 chars)
3. User selects reason → clicks "Confirm Cancellation"
4. Dispatches `cancelReservationRequest({ locationId, reservationId, cancelReason })`
5. On success → transitions to "Cancelled" view:
   - Red X icon animation
   - "Reservation Cancelled" title + "Your reservation has been cancelled. No charges apply."
   - Cancelled booking details card: "Cancelled" badge, formatted date, time + guest count, confirmation # + "No charges"
   - "Notifications Sent" checklist: emailed, SMS sent, table released
   - "We hope to see you next time!" farewell
   - "Make a New Reservation" CTA

### Step 5: New Reservation (from cancelled state)

1. User clicks "Make a New Reservation"
2. `resetReservation()` + `clearSlots()` dispatched
3. All local state reset: step=1, partySize=2, selectedDate=null, selectedTime=null
4. Form partially reset (keeps name/phone/email, clears seatPref, occasion, smsConsent)

---

## Conditional Logic

### Authentication Branching

| Condition | Behavior |
|-----------|----------|
| User logged in | Form auto-fills from `user.mobilePhone`, `user.firstName`, `user.lastName`, `user.email` |
| User not logged in | Form starts empty; `userId` sent as empty string in payload |
| Token available | Passed as Bearer in all API calls |
| No token | APIs called without Authorization header |

### Reservation Feature Toggle

```javascript
// src/utils/branchConfig.js
export function isReservationEnabledByBranch(slugData, merchantSlug) {
  const branch = getMatchedBranchByMerchantSlug(slugData, merchantSlug);
  return isTruthy(branch?.serviceDisable?.isReservation);
}
```

If `isReservation` is not truthy for the matched branch, the reservation page/link should be hidden.

### Seating Sections Availability

```javascript
const sections = (Array.isArray(slugData?.sectionDetailsList)
  ? slugData.sectionDetailsList
  : []
).filter(s => s.isEnabled === 1 || s.isEnabled === true || s.enabled === 1);
```

- If `sections.length > 0`: show seating preference dropdown
- If `sections.length === 0`: hide seating preference entirely
- Default payload `sectionId`: first available section or empty string

### Occasion Options

```javascript
const occasionOptions = Array.from(
  new Map(
    (Array.isArray(slugData?.specialRequests) ? slugData.specialRequests : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .map((item) => [item.toLowerCase(), item])
  ).values()
);
```

- Deduped by lowercase key
- If no options: dropdown shows "Select occasion" placeholder only
- Selected occasion goes into `notes` field in the payload

### Phone Number Parsing

The `splitPhoneWithCountry()` function handles multiple input formats:
- `"+1-5551234567"` → `{ country: {code: '+1', ...}, number: '5551234567' }`
- `"+15551234567"` → parsed by longest matching country code
- `"5551234567"` → defaults to `+1` (US)

Supported country codes: US (+1), India (+91), UK (+44), Australia (+61), UAE (+971), Saudi Arabia (+966), Singapore (+65), Malaysia (+60), Qatar (+974), Oman (+968), Bahrain (+973), Kuwait (+965), Nepal (+977), Sri Lanka (+94), Bangladesh (+880), Germany (+49), France (+33), Japan (+81), South Korea (+82), China (+86).

### Cancel Saga Fallback

```javascript
function* cancelReservationWorker(action) {
  try {
    const token = yield* resolveToken();
    yield call(cancelReservationApi, action.payload, token);
    yield put(cancelReservationSuccess());
  } catch (err) {
    // Always dispatch success so the UI doesn't get stuck
    yield put(cancelReservationFailure(err?.response?.data?.message || 'Cancellation error.'));
    yield put(cancelReservationSuccess()); // force UI to proceed
  }
}
```

**This is intentional:** Even if the cancel API fails, the UI shows the "Cancelled" screen. This prevents users from getting stuck.

---

## Code Templates

### Reservation Payload Builder

```javascript
function buildReservationPayload(form, partySize, selectedDate, selectedTime, slugData, customerId, sections) {
  const locationId = slugData?.id || slugData?.locationId || '';
  return {
    userId:            customerId || '',
    locationId,
    merchantSlug:      slugData?.slug || slugData?.merchantSlug || '',
    partyName:         `${form.firstName} ${form.lastName}`.trim(),
    partyPhone:        form.phone
      ? `${form.countryCode || '+1'}${form.phone.replace(/\D/g, '')}`
      : '',
    kidSize:           0,
    sectionId:         form.seatPref || sections[0]?.id || '',
    isReceiveTransMsg: form.smsConsent ? 1 : 0,
    partySize,
    deviceId:          '',
    channelName:       'ONLINE',
    seatTogether:      '1',
    isReservation:     1,
    reservationDate:   toISODate(selectedDate),
    reservationSlot:   selectedTime,
    sessionName:       selectedTime,
    notes:             form.occasion || '',
    highChairSize:     0,
  };
}
```

### Date Utilities

```javascript
function toISODate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }).format(date);
}

function formatLongDate(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(`${dateStr}T12:00:00`) : dateStr;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(d);
}

function convertTo24(timeStr) {
  if (!timeStr) return '12:00:00';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '12:00:00';
  let [, h, mins, ap] = match;
  h = parseInt(h, 10);
  if (ap.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mins}:00`;
}
```

### Calendar URL Builder

```javascript
function buildCalendarUrl(provider, { title, location, description, start, end }) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  switch (provider) {
    case 'google':
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    case 'outlook':
      return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    case 'yahoo':
      return `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&st=${fmt(start)}&et=${fmt(end)}&desc=${encodeURIComponent(description)}&in_loc=${encodeURIComponent(location)}`;
    case 'ical': {
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nDESCRIPTION:${description}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
      return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
    }
    default: return '#';
  }
}
```

### Slot Extraction (handles all API response shapes)

```javascript
function extractSlotTimes(slots, selectedDate) {
  const dateKey = toISODate(selectedDate);
  let sessionSlots = [];

  if (Array.isArray(slots)) {
    // Shape A: array of day objects
    const day = slots.find(d => d?.date === dateKey) || slots[0];
    sessionSlots = (day?.sessions || []).flatMap(s => s.slots || []);
  } else if (slots?.sessions) {
    // Shape B: direct sessions
    sessionSlots = (slots.sessions || []).flatMap(s => s.slots || []);
  } else if (slots?.data?.sessions) {
    // Shape C: nested under data
    sessionSlots = (slots.data.sessions || []).flatMap(s => s.slots || []);
  }

  return sessionSlots
    .filter(s => s != null && (typeof s === 'string' || s.available !== false))
    .map(s => typeof s === 'string' ? s : s.time)
    .filter(Boolean);
}
```

---

## SEO Requirements

### Route Structure

| Route | Page | SEO Notes |
|-------|------|-----------|
| `/reservation` | Reservation booking page | Indexable — restaurant reservation landing |

### Metadata Recommendations

- Title: `"Reserve a Table at {restaurantName} | {city}, {state}"`
- Description: `"Book your table at {restaurantName}. Select party size, date, and time. Instant confirmation with QR code."`
- Structured data: `Restaurant` schema with `acceptsReservations: true`

### QR Code for Confirmation

The QR code is generated client-side via an external API:
```
https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data={reservationId}
```

This encodes the `reservationId` UUID. The guest shows this QR at the restaurant entrance for check-in.

---

## Gotchas & Edge Cases

1. **Create is 2-step:** The saga calls `createReservationApi` first, then `fetchReservationByIdApi` immediately after. The second call is needed because the create response may not include full details like `tableDetails`.

2. **Cancel always succeeds in UI:** The cancel saga dispatches `cancelReservationSuccess()` even when the API throws an error. This is intentional to prevent the UI from getting stuck on the cancel screen.

3. **Encrypted in query param, not body:** `createReservationApi` sends the encrypted payload as `?data=encryptedString` query parameter with a `null` body. This is different from order APIs which use the request body.

4. **Response body is array:** `fetchReservationByIdApi` returns `body` as an array. The saga extracts `body[0]` — if it's not an array, it uses the body directly.

5. **Phone format for payload:** Phone must be `{countryCode}{digits}` with no separators, e.g., `"+15551234567"`. The country code selector provides the prefix.

6. **Slot auto-refetch:** Changing party size while a date is already selected triggers a new slot fetch. The `useEffect` in `Step1` watches `[selectedDate, partySize, locationId]`.

7. **Time selection auto-advances:** Clicking a time slot immediately transitions to Step 2. There's no separate "Next" button for Step 1.

8. **Form partial reset on "New Reservation":** When starting a new reservation from the cancelled screen, the form keeps `phone`, `firstName`, `lastName`, `email` but clears `seatPref`, `occasion`, `smsConsent`.

9. **Calendar event duration:** The calendar URL builder defaults to a 1-hour event duration (`endDt = startDt + 60 minutes`).

10. **QR error handling:** If the external QR API fails (image onError), a fallback placeholder icon (`fa-qrcode`) is shown instead.

11. **Max party size from slug:** `slugData.maxOnlineCheckin` controls the maximum selectable party size. Defaults to 10 if not set.

12. **Sections filter:** Only sections with `isEnabled === 1` or `isEnabled === true` or `enabled === 1` are shown in the seating preference dropdown.

---

## Checklist

- [ ] `VITE_BASE_URL` and `VITE_E_KEY` environment variables are set
- [ ] Reservation API calls use `baseURL: 'https://apiq.gcp.magilhub.com/magilhub-data-services'` override
- [ ] `createReservationApi` sends encrypted payload as query param (not body)
- [ ] Saga performs 2-step creation: create → fetchById
- [ ] Slots API called on date selection AND party size change (with date present)
- [ ] Slot extraction handles 3 response shapes (array, direct sessions, nested data)
- [ ] Phone input validates per country code maxLen
- [ ] Country code selector supports 20 countries
- [ ] Form auto-fills from logged-in user data
- [ ] SMS consent checkbox is required before submission
- [ ] Form validation: smsConsent + phone + firstName + email all required
- [ ] Step indicator shows 3 steps: Book → Your Details → Confirmed
- [ ] Time slot selection auto-advances to Step 2
- [ ] Confirmed screen shows QR code from external API
- [ ] "Add to Calendar" supports Google, Outlook, Yahoo, and .ics download
- [ ] Cancel flow has predefined reasons + "Other" with textarea (100 char max)
- [ ] Cancel saga dispatches success even on API error
- [ ] "Make a New Reservation" resets all state and goes to Step 1
- [ ] Reservation slice is NOT persisted (resets on page reload)
- [ ] `isReservationEnabledByBranch()` checked before showing reservation link
- [ ] Seating preference dropdown only shown when enabled sections exist
- [ ] Occasion dropdown populated from `slugData.specialRequests`
