# Order Flow Skill

## Purpose

This skill teaches how to build a complete **food ordering flow** for a restaurant web app — from browsing the menu, adding items to cart, validating availability, calculating totals (tax, delivery fee, grand total), selecting payment (pay-at-store or card-not-present), placing the order via encrypted API, to real-time order tracking with a status timeline. Use this skill whenever you need to replicate a full guest-to-order pipeline in any React + Redux-Saga project.

## Prerequisites

### Language

The current reference implementation uses **JavaScript (`.js` / `.jsx`)**. For new projects, use **TypeScript (`.ts` / `.tsx`)** instead. All code snippets in this skill are written in JS — when implementing, convert them to TS by:

- Renaming `.js` → `.ts`, `.jsx` → `.tsx`
- Adding explicit types to all function parameters, return values, and props
- Defining interfaces for: API payloads, API responses, Redux state slices, component props, cart line shape, order shape, totals shape
- Using `Record<string, T>`, `Map`, and discriminated unions where appropriate
- Typing Redux: `RootState`, typed `useSelector` / `useDispatch` hooks, typed saga yields
- Typing axios instances with response generics

Key interfaces to define upfront:

```typescript
// ── API & Encryption ──────────────────────────────────────────────────────
interface EncryptedRequest { data: string }
interface EncryptedResponse { encryptedText?: string; data?: string }

// ── Slug ──────────────────────────────────────────────────────────────────
interface OrderType { id: string; typeName: string }
interface Branch {
  locationSlug: string;
  latitude: number;
  longitude: number;
  serviceDisable: { isReservation: number | boolean };
}
interface SectionDetail { id: string; sectionName: string; isEnabled: number | boolean }
interface SlugData {
  id: string;
  name: string;
  branchName: string;
  slug: string;
  merchantSlug: string;
  address: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCd: string;
  country: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  orderTypes: OrderType[];
  maxOnlineCheckin: number;
  sectionDetailsList: SectionDetail[];
  specialRequests: string[];
  branch: Branch[];
  locationDeliveryProviders: { deliveryProviderId: string };
  aboutUs: string;
  media: Array<{ id: string; entityType: string; mimeType: string }>;
}

// ── Auth ──────────────────────────────────────────────────────────────────
interface AuthState {
  loading: boolean;
  error: string | null;
  step: 'idle' | 'otp_sent' | 'needs_registration' | 'done';
  mobilePhone: string;
  customerId: string;
  isNewUser: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
}
interface UserProfile {
  customerId: string;
  mobilePhone: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  access_token: string;
  sendOtpViaEmail: boolean;
}

// ── Cart ──────────────────────────────────────────────────────────────────
interface Modifier {
  typeId: string;
  typeName: string;
  optionId: string;
  optionName: string;
  price: number;
}
interface CartLine {
  lineId: string;
  itemId: string;
  itemName: string;
  itemAltName: string;
  itemImage: string | null;
  itemType: string | null;
  basePrice: number;
  modifiers: Modifier[];
  qty: number;
  customization: any[];
  tax: any[];
  digiMenuMedia: any[];
  _item: MenuItem;
  unavailable?: boolean;
}
type OrderTypeName = 'Pickup' | 'Delivery' | 'DineIn';

// ── Totals ────────────────────────────────────────────────────────────────
interface TotalsLine {
  code: string;       // '1'=Item Total, '2'=Tax, '4'=Delivery, '5'=Grand Total
  title: string;
  value: string;
  sortOrder: string;
}

// ── Order ─────────────────────────────────────────────────────────────────
interface PlaceOrderPayload {
  orderPayload: CreateOrderPayload;
  orderType: OrderTypeName;
  grandTotal: string;
  etaDate: string;
  etaTime: string;
  paymentMethod: string | null;
  cardPayment: CardPaymentDetails | null;
}
interface CardPaymentDetails {
  accountNumber: string;
  postalCode: string;
  streetCode: string;
  cvv: string;
  recaptchaToken: string;
  expiryMonth: string;
  expiryYear: string;
  paymentProviderId: string;
  paymentCurrency: string;
}
interface ActiveOrder {
  orderId: string;
  orderNo: string;
  orderType: OrderTypeName;
  orderStatus: number;
  etaDate: string | null;
  etaTime: string | null;
  grandTotal: string | null;
  addedAt: number;
  _raw: any;
}

// ── Menu ──────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  itemId: string;
  itemName: string;
  price: number;
  description: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string | null;
  subCategoryName: string | null;
  itemImage: string | null;
  itemType: string | null;
  customization: any[];
  tax: any[];
  digiMenuMedia: any[];
  enable: boolean;
  available: boolean;
  itemOff: boolean;
  isExclusiveCategoryItem: boolean;
  isSpecial: boolean;
  specialName: string;
  stockQuantity: number | null;
  itemUnAvailableUntil: string | null;
  nextAvailableDay: string | null;
  ingredient: any[];
  diet: any[];
  allergicInfo: string;
  specialInstructions: string;
  itemFilter: any[];
  itemTagResponses: any[];
}
interface TransformedMenu {
  categories: Array<{ id: string; name: string; categoryOff: boolean }>;
  items: MenuItem[];
  grouped: Record<string, { direct: MenuItem[]; subCategories: Record<string, { name: string; items: MenuItem[] }> }>;
  exclusiveItems: MenuItem[];
  specialGroups: Array<{ title: string; displayType: string | null; desc: string; content: Array<{ image: any[]; dishName: string; menuData: MenuItem }> }>;
}

// ── Address ───────────────────────────────────────────────────────────────
interface SavedAddress {
  id: string;
  addressId: string;
  tag: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCd: string;
  countryCd: string;
  latitude: number;
  longitude: number;
}
interface DeliveryQuote {
  estimatedPrice: string;
  eta: string;
  quoteId: string;
}

// ── Redux Store ───────────────────────────────────────────────────────────
interface RootState {
  slug: { loading: boolean; data: SlugData | null; error: string | null };
  menu: { data: any; loading: boolean; error: string | null; orderType: string };
  auth: AuthState;
  activeOrders: { orders: ActiveOrder[] };
  favourites: { ids: string[]; items: Record<string, MenuItem> };
  reservation: ReservationState;
  order: OrderState;
  cart: { cartLines: CartLine[]; orderType: OrderTypeName };
  totals: { loading: boolean; totals: TotalsLine[] | null; grandTotal: string | null; error: string | null };
  address: AddressState;
}
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
  "redux-persist": "^6.0.0",
  "redux-saga": "^1.4.2",
  "framer-motion": "^12.38.0",
  "lucide-react": "^0.563.0"
}
```

### Environment Variables

```env
VITE_BASE_URL=https://apiq.gcp.magilhub.com/magilhub-data-services  # single base URL for ALL internal APIs
VITE_E_KEY=<32-character AES encryption key>
VITE_MERCHANT_SLUG=<merchant-location-slug>
VITE_RECAPTCHA_SITE_KEY=<Google reCAPTCHA v2 site key>
VITE_PAYMENT_PROVIDER_ID=<payment-gateway provider ID>
```

### Service Accounts / API Keys Required

- Google reCAPTCHA v2 site key (for card payment verification)
- Payment provider ID (for CNP card transactions)
- AES-128/256 encryption key (shared with backend, used for all encrypted payloads)

---

## API Integration Layer

### LEGEND: Token Requirements

- `[No Token]` — Public endpoint, no Authorization header needed
- `[Token Required]` — Must send `Authorization: Bearer <access_token>` header
- `[*]` — Plain JSON (no encryption)
- `[**]` — Encrypted payload and/or response (AES via crypto-js)

---

### 0. Slug API (App Bootstrap — First API Call)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/locations/slug` |
| **When called** | On app mount — this is the FIRST API call, provides all location config |
| **Encrypted** | `[**]` Request: `{ data: encryptJson({ slug }) }` — Response: encrypted |
| **Auth** | `[No Token]` |

**Request payload (before encryption):**
```json
{
  "slug": "salesdemo-ny"
}
```

**How it's sent:**
```javascript
API_MENU.post('/api/customers/locations/slug', {
  data: encryptJson({ slug: import.meta.env.VITE_MERCHANT_SLUG }),
}, {
  headers: { 'content-type': 'application/json' },
});
```

**Response (after decryption):** Returns the complete location configuration object stored in `state.slug.data`:
```json
{
  "id": "<location-uuid>",
  "name": "Masala Twist Xpress",
  "branchName": "Masala Twist Xpress Sachse",
  "slug": "masala-twist-sachse",
  "merchantSlug": "masala-twist-sachse",
  "address": "4275 Miles Rd #101, Sachse, TX 75048",
  "addressLine1": "4275 Miles Rd #101",
  "city": "Sachse",
  "state": "TX",
  "postalCd": "75048",
  "country": "US",
  "phoneNumber": "+14695551234",
  "latitude": 32.97,
  "longitude": -96.59,
  "orderTypes": [
    { "id": "<uuid>", "typeName": "Pickup" },
    { "id": "<uuid>", "typeName": "Delivery" },
    { "id": "<uuid>", "typeName": "DineIn" }
  ],
  "maxOnlineCheckin": 10,
  "sectionDetailsList": [
    { "id": "<uuid>", "sectionName": "Patio", "isEnabled": 1 }
  ],
  "specialRequests": ["Birthday", "Anniversary", "Business Meeting"],
  "branch": [
    {
      "locationSlug": "masala-twist-sachse",
      "latitude": 32.97,
      "longitude": -96.59,
      "serviceDisable": { "isReservation": 1 }
    }
  ],
  "locationDeliveryProviders": {
    "deliveryProviderId": "<delivery-provider-uuid>"
  },
  "aboutUs": "Welcome to Masala Twist...",
  "media": [
    { "id": "<media-uuid>", "entityType": "POSTER", "mimeType": "image/jpg" }
  ]
}
```

**Critical:** This response drives nearly everything — order type IDs, location ID, delivery provider, restaurant info, reservation config, and more. All other APIs depend on `slug.data`.

### Slug Data Field Usage Map — Order Flow

Every `slugData` field consumed by the ordering flow and where it's used:

| Slug Field | Used In | Purpose |
|------------|---------|---------|
| `id` | Cart saga, Totals saga, Order saga, Checkout, Cart, Orders, OrderTracking, Address saga, Favourites saga, Menu saga | **locationId** — passed to nearly every API call |
| `orderTypes[]` | Checkout, Cart, buildTotalsPayload | Array of `{ id, typeName }`. Resolve `orderTypeId` by matching `typeName` to `'Pickup'`/`'Delivery'`/`'DineIn'` |
| `orderTypes[].id` | createOrder payload, totals payload, cartItems validation | The UUID for the selected order type |
| `orderTypes[].typeName` | orderType.js `resolveOrderTypeName()` | Match order type ID back to human-readable name |
| `country` / `countryCd` / `countryCode` | paymentConstants `resolvePaymentCurrencyFromSlug()` | Maps `'US'→'USD'`, `'INR'→'INR'` for payment currency |
| `name` / `restaurantName` | Address saga (sender details for quote) | Restaurant name in delivery quote `senderDetails.name` |
| `branchName` | OrderTracking, Checkout | Display restaurant name for pickup location |
| `address` / `addressLine1` | Address saga (pickup address), OrderTracking | Pickup address for delivery quote `pickupDetails.Address.streetAddress1` and tracking location card |
| `city` | Address saga | Pickup address city for quote payload |
| `state` | Address saga | Pickup address state for quote payload |
| `postalCd` | Address saga | Pickup address zip for quote payload |
| `phone` / `phoneNumber` / `mobileNo` | Address saga (sender phone), OrderTracking | Restaurant phone in quote `senderDetails.phoneNumber` and tracking location card |
| `latitude` / `lat` | Address saga | Fallback pickup lat for delivery quote (if branch match fails) |
| `longitude` / `lng` | Address saga | Fallback pickup lng for delivery quote (if branch match fails) |
| `branch[]` | Address saga, branchConfig.js | Array of branch objects. Matched by `locationSlug === VITE_MERCHANT_SLUG` |
| `branch[].locationSlug` | branchConfig `getMatchedBranchByMerchantSlug()` | Match branch to current merchant slug |
| `branch[].latitude` | Address saga | Primary pickup lat for delivery quote (from matched branch) |
| `branch[].longitude` | Address saga | Primary pickup lng for delivery quote (from matched branch) |
| `branch[].serviceDisable.isReservation` | App.jsx, Header, BottomNav, branchConfig | Controls reservation route guard + nav visibility |
| `locationDeliveryProviders.deliveryProviderId` | Address saga | Required for delivery quote API (sent both in body and as encrypted query param) |
| `slug` / `merchantSlug` | Reservation payload | Passed as `merchantSlug` in createReservation payload |

### Slug Data Field Usage Map — Reservation Flow

| Slug Field | Used In | Purpose |
|------------|---------|---------|
| `id` / `locationId` | ReservationPage, fetchSlotsRequest, createReservation, cancelReservation | **locationId** — passed to all reservation API calls |
| `maxOnlineCheckin` | ReservationPage Step1 | Maximum party size for the party-size selector (default: 10) |
| `branchName` / `name` | ReservationPage ConfirmedScreen, RightPanel | Restaurant display name ("Masala Twist Xpress") |
| `address` / `branchAddress` | ReservationPage ConfirmedScreen | Restaurant address shown on confirmation + calendar event location |
| `phoneNumber` / `phone` | ReservationPage ConfirmedScreen | Restaurant phone shown with "Call" link on confirmation |
| `sectionDetailsList[]` | ReservationPage Step2 | Array of `{ id, sectionName, isEnabled }`. Filtered by `isEnabled === 1`. Populates "Seating Preference" dropdown |
| `specialRequests[]` | ReservationPage Step2 | Array of strings (e.g. "Birthday", "Anniversary"). Populates "Occasion" dropdown. Deduped by lowercase |
| `slug` / `merchantSlug` | createReservation payload | Passed as `merchantSlug` field in reservation create payload |
| `aboutUs` / `about_us` / `about` / `description` | RightPanel | "About Us" text in the right sticky panel (clamped with Read more/less) |
| `media[]` / `digiMenuMedia[]` | RightPanel | Find poster/banner image: `media.find(m => m.entityType === 'POSTER' \|\| 'BANNER')` → construct CDN URL |
| `branch[].serviceDisable.isReservation` | App.jsx route guard, Header, BottomNav | If NOT truthy → `/reservation` redirects to `/`, nav tabs hidden |

**Saga code:**
```javascript
function* handleGetSlug() {
  try {
    const response = yield call(fetchSlug);
    const decrypted = decryptJson(response.data?.encryptedText);
    yield put(getSlugSuccess(decrypted));
  } catch (error) {
    yield put(getSlugFailure(error?.response?.data || error.message));
  }
}
```

---

### 0b. Auth Flow (OTP-Based Authentication)

#### Auth Step 1: Request OTP

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/auth/request-otp` |
| **When called** | User enters phone number in AuthModal and clicks "Send OTP" |
| **Encrypted** | `[*]` Plain JSON — no encryption |
| **Auth** | `[No Token]` |

**Request payload:**
```json
{
  "mobilePhone": "+91-8248727062",
  "sendOtpViaEmail": false
}
```

**Response:**
```json
{
  "headers": {},
  "body": "OTP sent successfully",
  "statusCode": "OK",
  "statusCodeValue": 200
}
```

#### Auth Step 2: Verify OTP

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/auth/verify-otp` |
| **When called** | User enters 6-digit OTP and submits |
| **Encrypted** | `[**]` Request encrypted, response encrypted |
| **Auth** | `[No Token]` |

**Request payload (before encryption):**
```json
{
  "mobilePhone": "+91-8248727062",
  "otp": "614599",
  "sendOtpViaEmail": false
}
```

**Response — Existing User (has `customerId`):**
```json
{
  "status": "OK",
  "body": {
    "message": "Login successful",
    "customerDetails": {
      "customerId": "cc1899dd-65ae-4f00-9e56-cd6cc3fc3012",
      "mobilePhone": "+91-9597942504",
      "name": "Ram Ram",
      "firstName": "Ram",
      "lastName": "Ram",
      "email": "Ram@gmail.com",
      "sendOtpViaEmail": false,
      "access_token": "eyJhbGciOiJSUzI1NiIs...<JWT>",
      "expires_in": "15552000"
    },
    "status": 200
  }
}
```

**Response — New User (NO `customerId`):**
```json
{
  "status": "OK",
  "body": {
    "message": "Login successful",
    "customerDetails": {
      "mobilePhone": "+91-8248727062",
      "sendOtpViaEmail": false,
      "access_token": "eyJhbGciOiJSUzI1NiIs...<JWT>",
      "expires_in": "15552000"
    },
    "status": 200
  }
}
```

**CRITICAL BRANCHING LOGIC:**
- If `customerDetails.customerId` **exists** → Existing user → `isLoggedIn: true`, persist to localStorage, flow done
- If `customerDetails.customerId` **missing** → New user → show registration form (Step 3), phone auto-populated

**Saga logic:**
```javascript
const customerId = customer?.customerId || payload?.customerId || '';
const isNewUser = !customerId; // No customerId = new user

if (!isNewUser) {
  persistAuth({ isLoggedIn: true, customerId, user });
}
yield put(verifyOtpSuccess({ customerId, isNewUser, user }));
```

#### Auth Step 3: Register New User (Update API)

| Field | Value |
|-------|-------|
| **Endpoint** | `PUT /api/customers/user/update` |
| **When called** | Only for NEW users (no `customerId` from verify-otp). User fills first name, last name, email in registration form |
| **Encrypted** | `[**]` Request encrypted, response encrypted |
| **Auth** | `[Token Required]` — uses the `access_token` from verify-otp response |

**Request payload (before encryption):**
```json
{
  "customerId": "",
  "mobilePhone": "+91-8248727062",
  "firstName": "siva",
  "lastName": "",
  "email": "siva@gmail.com",
  "sendOtpViaEmail": false
}
```

**Response (after decryption):**
```json
{
  "status": "OK",
  "body": {
    "message": "Login successful",
    "customerDetails": {
      "customerId": "5ff86b58-6eea-4aa0-b80a-ec33c086ce83",
      "mobilePhone": "+91-8248727062",
      "firstName": "siva",
      "lastName": "",
      "email": "siva@gmail.com",
      "sendOtpViaEmail": false
    },
    "status": 200
  }
}
```

**After registration:** `persistAuth()` saves to localStorage under key `amudham_auth`. User is now logged in with `customerId`.

#### Auth Persistence

```javascript
const AUTH_KEY = 'amudham_auth';

// On verify/register success:
localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: true, customerId, user }));

// On app reload — authReducer reads from localStorage:
const persisted = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
const initialState = {
  customerId: persisted.customerId || '',
  isLoggedIn: persisted.isLoggedIn || false,
  user: persisted.user || null,
  // ...
};
```

#### Logout

Dispatching `LOGOUT`:
1. Removes `amudham_auth` from localStorage
2. Resets auth state to initial
3. Clears active orders (`clearActiveOrdersAction()`)
4. Clears cart (`clearCartAction()`)

---

### Base URL Map (Different Endpoints Use Different Hosts)

**CRITICAL:** Not all endpoints share the same base URL. The project uses `VITE_BASE_URL` as default but some endpoints override it.

| # | API Group | Base URL |
|---|-----------|----------|
| 1 | **Slug** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 2 | **Auth** (OTP, verify, register) | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 3 | **Menu** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 4 | **Cart Items** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 5 | **Totals** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 6 | **Create Order** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 7 | **Offline Payment** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 8 | **Start Transaction** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 9 | **Order Tracking** (order/customer) | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 10 | **Restaurant Details** (locations/id) | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 11 | **Quote** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 12 | **Order History** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 13 | **Reservation** (all 4 endpoints) | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 14 | **Address** (all CRUD) | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 15 | **Favourites** | `https://apiq.gcp.magilhub.com/magilhub-data-services` |
| 16 | **Google Maps** | `https://maps.googleapis.com/maps/api/place/js/AutocompletionService` (External) |
| 17 | **reCAPTCHA** | `https://www.google.com/recaptcha/api.js?render=explicit` (External) |

**All internal APIs use the same base URL:** `https://apiq.gcp.magilhub.com/magilhub-data-services`
Set via `VITE_BASE_URL` env variable. Reservation endpoints pass it as explicit `baseURL:` override on each axios call.

---

### 1. Axios Instance Setup

**File:** `src/api.js`

```javascript
import axios from 'axios';

export const API_MENU = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-app-version': 'v2',
  },
});

API_MENU.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error('Network unavailable. Please check your internet connection.')
      );
    }
    return Promise.reject(error);
  }
);
```

### 2. Common Header Builder (used across all encrypted endpoints)

```javascript
const normalizeBearerToken = (token) =>
  token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

const buildEncryptedHeaders = (token, headers = {}) => {
  const bearer = normalizeBearerToken(token);
  return {
    'x-app-version': 'v2',
    'content-type': 'application/json',
    ...headers,
    ...(bearer ? { Authorization: bearer } : {}),
  };
};
```

### 3. Encrypted Response Decryptor (used by all encrypted endpoints)

```javascript
const decryptEncryptedResponse = (responseData) => {
  const encrypted = responseData?.encryptedText ?? responseData?.data;
  if (typeof encrypted !== 'string') return responseData ?? {};
  try {
    return decryptJson(encrypted);
  } catch {
    return responseData ?? {};
  }
};
```

### 4. API Endpoints

#### 4a. Get Menu Data

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/menu` |
| **Base URL** | `https://apiq.gcp.magilhub.com/magilhub-data-services` (same as all other APIs) |
| **When called** | On page mount of `/menu` or `/ordering` page; skips if data already cached for same orderType |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` — Bearer token |

**Request payload — Pickup (before encryption):**
```json
{
  "type": "Pickup",
  "locationId": "9c485244-afd4-11eb-b6c7-42010a010026",
  "customerId": null,
  "searchText": null,
  "visibleTo": ["C"]
}
```

**Request payload — Delivery (before encryption):**
```json
{
  "type": "Delivery",
  "locationId": "9c485244-afd4-11eb-b6c7-42010a010026",
  "customerId": "5ff86b58-6eea-4aa0-b80a-ec33c086ce83",
  "searchText": null,
  "visibleTo": ["C"],
  "from": "s"
}
```

**Key differences:** Delivery adds `"from": "s"` and passes `customerId`.

**API function:**
```javascript
export async function getOrderMenuApi({ locationId, orderType, customerId, token }) {
  const payload = {
    type: orderType,
    locationId,
    customerId: customerId || null,
    searchText: null,
    visibleTo: ['C'],
    ...(orderType === 'Delivery' ? { from: 's' } : {}),
  };
  const response = await API_MENU.post('/api/customers/menu', {
    data: encryptJson(payload),
  }, {
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const decrypted = decryptJson(response.data?.encryptedText || response.data?.data);
  return { data: decrypted };
}
```

**Response (after decryption):**
```javascript
{
  categories: [{ id, categoryName, categoryOff, sortOrder, ... }],
  items: [{ id, itemName, price, categoryId, description, itemImage, itemType, customization, tax, digiMenuMedia, enable, available, itemOff, ... }]
}
```

#### 4b. Validate Cart Items

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/order/cartItems` |
| **When called** | On Cart page mount and Ordering page mount |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

**Request payload:**
```json
{
  "itemIds": ["item-uuid-1", "item-uuid-2"],
  "itemObj": [
    { "itemId": "item-uuid-1", "modifierIds": ["mod-opt-uuid-1"] },
    { "itemId": "item-uuid-2", "modifierIds": [] }
  ],
  "orderTypeId": "<order-type-uuid-from-slug>",
  "locationId": "<location-uuid>"
}
```

**Response shape:**
```json
[
  { "itemId": "item-uuid-1", "enabled": true },
  { "itemId": "item-uuid-2", "enabled": false }
]
```

**Trigger:** `validateCartItemsRequest({ source: 'cart' | 'ordering' })`
- When `source === 'cart'`: saga auto-dispatches `fetchTotalsRequest()` after validation
- When `source === 'ordering'`: no totals fetch

#### 4c. Get Order Totals

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/order/totals` |
| **When called** | After cart validation on Cart page, on Checkout mount, after delivery quote success |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "discountType": "FLATFEE",
  "orderItems": [
    {
      "itemId": "item-uuid-1",
      "itemName": "Chicken Biryani",
      "itemAltName": "",
      "price": "12.99",
      "quantity": "2",
      "subTotal": "25.98",
      "comment": "",
      "is_discount_applied": false,
      "options": [
        {
          "typeId": "mod-type-uuid",
          "type": "Spice Level",
          "sortOrder": 0,
          "typeAvailable": 1,
          "isBase": null,
          "minRequired": 0,
          "maxRequired": 1,
          "modifierOptionId": "mod-opt-uuid",
          "optionName": "Medium",
          "optionSortOrder": 1,
          "price": "0.00",
          "optionAvailable": 1,
          "isSpinnerEnabled": false,
          "quantity": "1",
          "singleItemOptionQuantity": 1
        }
      ],
      "modifierIds": "mod-opt-uuid",
      "tax": [],
      "offer_data": null,
      "offer_amount": 0,
      "availability": null,
      "stockQuantity": null,
      "alertQuantity": null
    }
  ],
  "orderTypeId": "<order-type-uuid>",
  "locationId": "<location-uuid>",
  "tip": 0,
  "tipType": "FLATFEE",
  "customerId": "<customer-uuid-or-empty>",
  "addressId": "<address-uuid-if-delivery>",
  "deliveryFee": 5.99
}
```

**Response shape (after decryption):**
```json
{
  "orderTotals": [
    { "code": "1", "title": "Item Total", "value": "25.98", "sortOrder": "1" },
    { "code": "2", "title": "Tax", "value": "2.14", "sortOrder": "2" },
    { "code": "4", "title": "Delivery Charges", "value": "5.99", "sortOrder": "4" },
    { "code": "5", "title": "Grand Total", "value": "34.11", "sortOrder": "9" }
  ],
  "orderTotal": "34.11"
}
```

**Important:** The saga uses a 400ms debounce (via `delay(400)` + `takeLatest`) to prevent rapid fire from qty +/- buttons.

#### 4d. Create Order

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/order/createOrder` |
| **When called** | When user clicks "Place Order" on Checkout |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload — PICKUP (before encryption):**
```json
{
  "locationId": "<location-uuid>",
  "customerId": "<customer-uuid>",
  "deviceId": "",
  "staffId": "",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "totalItems": "3",
  "comment": "",
  "customNote": "",
  "orderTypeId": "<pickup-order-type-uuid>",
  "orderTotal": "28.12",
  "isScheduleOrder": false,
  "isFreeOrderEvent": false,
  "items": [
    {
      "itemId": "<item-uuid>",
      "itemName": "Chicken Biryani",
      "itemAltName": "",
      "quantity": "2",
      "price": 12.99,
      "subTotal": "25.98",
      "comment": "",
      "options": [],
      "openItem": false,
      "modifierIds": "0"
    }
  ],
  "totals": [
    { "code": "1", "title": "Item Total",  "value": "25.98", "sortOrder": "1" },
    { "code": "2", "title": "Tax",          "value": "2.14",  "sortOrder": "2" },
    { "code": "5", "title": "Grand Total", "value": "28.12", "sortOrder": "9" }
  ],
  "etaDate": "2026-04-09",
  "etaTime": "14:30:00",
  "pickUpDate": "2026-04-09",
  "pickUpTime": "14:30:00",
  "deliveryDate": "2026-04-09",
  "deliveryTime": "14:30:00",
  "isUtcConversionRequired": true,
  "addressLine1": "",
  "addressLine2": "",
  "addressLine3": "",
  "locationDetails": {
    "locationInfo": {
      "center": { "lat": 0, "lng": 0 },
      "text": "",
      "addressLine2": "",
      "addressLine3": ""
    }
  },
  "orderSource": "O",
  "guestCount": 1,
  "isReceiveTransMsg": 1,
  "sortOrder": 0
}
```

**PICKUP key points:**
- `orderTypeId` = Pickup type UUID (from `slugData.orderTypes.find(t => t.typeName === 'Pickup').id`)
- `addressLine1/2/3` = **empty strings** (no delivery address)
- `locationDetails.locationInfo.center` = `{ lat: 0, lng: 0 }` (no delivery coordinates)
- `totals` array does **NOT** include code `'4'` (Delivery Charges)

---

**Request payload — DELIVERY (before encryption):**
```json
{
  "locationId": "<location-uuid>",
  "customerId": "<customer-uuid>",
  "deviceId": "",
  "staffId": "",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "totalItems": "3",
  "comment": "",
  "customNote": "",
  "orderTypeId": "<delivery-order-type-uuid>",
  "orderTotal": "34.11",
  "isScheduleOrder": false,
  "isFreeOrderEvent": false,
  "items": [
    {
      "itemId": "<item-uuid>",
      "itemName": "Chicken Biryani",
      "itemAltName": "",
      "quantity": "2",
      "price": 12.99,
      "subTotal": "25.98",
      "comment": "",
      "options": [],
      "openItem": false,
      "modifierIds": "0"
    }
  ],
  "totals": [
    { "code": "1", "title": "Item Total",        "value": "25.98", "sortOrder": "1" },
    { "code": "2", "title": "Tax",                "value": "2.14",  "sortOrder": "2" },
    { "code": "4", "title": "Delivery Charges",   "value": "5.99",  "sortOrder": "4" },
    { "code": "5", "title": "Grand Total",        "value": "34.11", "sortOrder": "9" }
  ],
  "etaDate": "2026-04-09",
  "etaTime": "14:30:00",
  "pickUpDate": "2026-04-09",
  "pickUpTime": "14:30:00",
  "deliveryDate": "2026-04-09",
  "deliveryTime": "14:30:00",
  "isUtcConversionRequired": true,
  "addressLine1": "1234 Elm St, Dallas, TX, 75201, US",
  "addressLine2": "Apt 2B",
  "addressLine3": "",
  "addressId": "<selected-address-uuid>",
  "locationDetails": {
    "locationInfo": {
      "center": { "lat": 32.78, "lng": -96.80 },
      "text": "1234 Elm St",
      "addressLine2": "Apt 2B",
      "addressLine3": ""
    }
  },
  "orderSource": "O",
  "guestCount": 1,
  "isReceiveTransMsg": 1,
  "sortOrder": 0
}
```

**DELIVERY key points:**
- `orderTypeId` = Delivery type UUID (from `slugData.orderTypes.find(t => t.typeName === 'Delivery').id`)
- `addressLine1` = **full combined address** formatted as `"street, city, state, zip, country"` via `getAddressLinesForPayload()`
- `addressId` = **included** (selected address UUID) — this field is ONLY added for Delivery
- `locationDetails.locationInfo.center` = **delivery address lat/lng** from selected address
- `totals` array **INCLUDES** code `'4'` (Delivery Charges) with `value` from the Quote API's `estimatedPrice`
- `orderTotal` = Grand Total **including delivery fee** (recalculated: `prevGrand - prevDeliveryFee + newDeliveryFee`)

---

**How the delivery fee flows into createOrder:**

```
1. User selects address on Checkout
   ↓
2. deliveryQuoteRequest({ addressData: addr })
   ↓
3. Quote API returns { estimatedPrice: "5.99", eta: "30-45 min" }
   ↓
4. Checkout stores estimatedDeliveryFee = parseFloat(quote.estimatedPrice)
   ↓
5. Totals API re-fetched with deliveryFee param → returns updated totals with code '4'
   ↓
6. On Place Order click:
   a. totalsPayload patched: code '4' value = estimatedDeliveryFee
   b. Grand Total (code '5') recalculated: prevGrand - prevDelivery + estimatedDeliveryFee
   c. orderTotal = patched grand total value
   ↓
7. createOrderApi(orderPayload, token) — encrypted payload includes delivery fee in totals
```

**Address normalization before payload:**
```javascript
// API returns postalCd / countryCd — must normalize before getAddressLinesForPayload()
const normalizedAddr = {
  ...selectedAddress,
  postalCode: selectedAddress.postalCode || selectedAddress.postalCd || '',
  country:    selectedAddress.country    || selectedAddress.countryCd || 'US',
};
const addrPayload = getAddressLinesForPayload(normalizedAddr);
// Returns: { addressLine1: "1234 Elm St, Dallas, TX, 75201, US", addressLine2: "Apt 2B", addressLine3: "" }
```

**Response shape (after decryption):**
```json
{
  "body": {
    "orderId": "<order-uuid>",
    "orderNo": "ORD-1234",
    "orderStatus": 6,
    "orderTotal": "34.11",
    "order": { "...full order object..." }
  }
}
```

#### 4e. Start Card Transaction (CNP)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/payment/start-transaction` |
| **When called** | After createOrder succeeds, if payment method is CNP (card) |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "customerId": "<customer-uuid>",
  "locationId": "<location-uuid>",
  "orderId": "<order-uuid-from-createOrder>",
  "totalPaymentAmount": "34.11",
  "paymentCurrency": "USD",
  "accountNumber": "4111111111111111",
  "tenderType": "CNP",
  "postalCode": "75048",
  "streetCode": "4275",
  "cvv": "123",
  "recaptchaToken": "<google-recaptcha-token>",
  "expiryMonth": "12",
  "expiryYear": "28",
  "needToUpdateOrderStatus": true,
  "paymentProviderId": "<provider-uuid>"
}
```

**Response shape (after decryption):**
```json
{
  "body": {
    "isPaymentCompleted": true,
    "paymentStatus": "19",
    "isToRetryPayment": false,
    "responseMessage": "Payment successful"
  }
}
```

**Failure:** If `isPaymentCompleted !== true` or `isToRetryPayment === true`, order flow fails with `responseMessage`.

#### 4f. Initiate Offline Payment (Pay at Store / Pay on Delivery)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/payment/initiate-offline-payment` |
| **When called** | After createOrder succeeds, if payment method is POS (offline) |
| **Encrypted** | `[**]` Sent as query param `?data=encryptJson(payload)` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "customerId": "<customer-uuid>",
  "orderId": "<order-uuid>",
  "totalPaymentAmount": "34.11",
  "paymentCurrency": "USD",
  "amountTendered": 0,
  "tenderType": "POS"
}
```

**Important:** This is fire-and-forget. The saga uses `fork()` so failure does NOT block the order flow. Staff can collect payment manually.

#### 4g. Fetch Order Details (for tracking)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/order/customer` |
| **When called** | On OrderTracking page mount |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "orderId": "<order-uuid>",
  "splitId": "",
  "transactionId": ""
}
```

#### 4h. Fetch Restaurant Details (for tracking location display)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /merchants/locations/id` (code uses this path) |
| **Alt Endpoint** | Also accessible as `POST /api/customers/locations/id` (same functionality) |
| **When called** | In parallel with fetchOrderDetails on tracking page |
| **Encrypted** | `[**]` Request: `{ data: encryptJson(payload) }` — Response: encrypted |
| **Auth** | `[Token Required]` |

**Request payload (before encryption):**
```json
{
  "staffId": null,
  "locationId": "<location-uuid>"
}
```

#### 4i. Fetch Customer Past Orders

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/customers/orders` |
| **When called** | On Orders page mount |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

**Request params:** `?customerId=<uuid>&locationId=<uuid>`

#### 4j. Address CRUD APIs

##### Fetch Saved Addresses

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/customers/order/fetch-address` |
| **When called** | On Checkout mount when `orderType === 'Delivery'` and user is logged in |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

**Request params:** `?customerId=<uuid>`

**Response:**
```json
{
  "addresses": [
    {
      "id": "<address-uuid>",
      "addressId": "<address-uuid>",
      "tag": "Home",
      "addressLine1": "4275 Miles Rd #101",
      "city": "Sachse",
      "state": "TX",
      "postalCd": "75048",
      "countryCd": "US",
      "latitude": 32.97,
      "longitude": -96.59
    }
  ]
}
```

##### Save New Address

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/order/save-address` |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

After save, saga auto-dispatches `fetchAddressRequest(customerId)` to refresh list.

##### Update Address

| Field | Value |
|-------|-------|
| **Endpoint** | `PUT /api/customers/order/update-address/{addressId}` |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

##### Delete Address

| Field | Value |
|-------|-------|
| **Endpoint** | `DELETE /api/customers/order/remove-address/{addressId}` |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

Optimistically removes from Redux state, then re-fetches list.

#### 4k. Delivery Quote API

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/delivery/quote` |
| **When called** | When user selects a delivery address on Checkout page |
| **Encrypted** | `[**]` Body: `{ data: encryptJson(payload) }` + Query param: `?deliveryProviderId=handleEncrypt(providerId)` |
| **Auth** | `[Token Required]` |

**IMPORTANT:** This API requires BOTH encrypted body AND encrypted query parameter.

**Request payload (before encryption):**
```json
{
  "pickupDetails": {
    "Address": {
      "streetAddress1": "4275 Miles Rd #101, Sachse, TX, 75048",
      "streetAddress2": "",
      "city": "Sachse",
      "state": "TX",
      "pincode": "75048"
    },
    "lat": 32.97,
    "lng": -96.59
  },
  "dropDetails": {
    "Address": {
      "streetAddress1": "1234 Elm St, Dallas, TX, 75201",
      "streetAddress2": "Apt 2B",
      "city": "Dallas",
      "state": "TX",
      "pincode": "75201"
    },
    "lat": 32.78,
    "lng": -96.80
  },
  "locationId": "<location-uuid>",
  "deliveryProviderId": "<delivery-provider-uuid>",
  "receiverDetails": {
    "name": "John Doe",
    "phoneNumber": "+15551234567"
  },
  "senderDetails": {
    "name": "Masala Twist Xpress",
    "phoneNumber": "+14695551234"
  },
  "tip": 0,
  "orderTotal": "34.11",
  "emailId": "john@example.com",
  "mobileNo": "+15551234567",
  "addressId": "<address-uuid>",
  "customerId": "<customer-uuid>"
}
```

**How it's sent (dual encryption):**
```javascript
export const deliveryQuoteApi = async (payload, token) => {
  const encryptedProviderId = payload.deliveryProviderId
    ? handleEncrypt(payload.deliveryProviderId)  // single string encrypted
    : '';
  const response = await API_MENU.post(
    '/api/customers/delivery/quote',
    { data: encryptJson(payload) },              // full payload encrypted in body
    {
      params: { deliveryProviderId: encryptedProviderId }, // ALSO as query param
      headers: bearerHeaders(token),
    },
  );
  // Response is also encrypted
  const decrypted = decryptJson(response.data?.encryptedText || response.data?.data);
  return { data: decrypted };
};
```

**Response (after decryption):**
```json
{
  "estimatedPrice": "5.99",
  "eta": "30-45 min",
  "quoteId": "<quote-uuid>"
}
```

**Flow after quote success:**
1. Quote succeeds → `deliveryQuoteSuccess(data)` → address confirmed in Checkout
2. Saga auto-dispatches `fetchTotalsRequest()` to recalculate with delivery fee
3. Totals API receives `deliveryFee` from quote's `estimatedPrice`

**Flow after quote failure:**
1. Quote fails → address rejected
2. Checkout shows Toast: "Unable to deliver to this location!"
3. `selectedAddress` set to null

**Where `deliveryProviderId` comes from:**
```javascript
const deliveryProviderId = slugData?.locationDeliveryProviders?.deliveryProviderId || '';
```

**Where pickup lat/lng comes from:**
```javascript
const merchantSlug = import.meta.env.VITE_MERCHANT_SLUG;
const branches = slugData?.branch || [];
const matchedBranch = branches.find(b => b?.locationSlug === merchantSlug);
const pickupLat = matchedBranch?.latitude || slugData?.latitude || 0;
const pickupLng = matchedBranch?.longitude || slugData?.longitude || 0;
```

#### 4l. Favourites APIs

##### Fetch Favourites

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/customers/fetch-favourites` |
| **When called** | On login (auto-sync) and Favourites page mount |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

**Request params:** `?customerId=<uuid>&locationId=<uuid>`

##### Add Favourite

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/customers/add-favourites` |
| **Encrypted** | `[*]` Plain JSON |
| **Auth** | `[Token Required]` |

**Request payload:**
```json
{
  "itemId": ["<item-uuid>"],
  "locationId": "<location-uuid>",
  "customerId": "<customer-uuid>"
}
```

##### Remove Favourite

| Field | Value |
|-------|-------|
| **Endpoint** | `DELETE /api/customers/remove-favourites` |
| **Encrypted** | `[*]` Plain JSON (in `data` field for DELETE body) |
| **Auth** | `[Token Required]` |

**Request body:**
```json
{
  "itemId": ["<item-uuid>"],
  "locationId": "<location-uuid>",
  "customerId": "<customer-uuid>"
}
```

**Favourites behavior:**
- Guest users: favourites stored locally in Redux (persisted via redux-persist)
- Logged-in users: optimistic UI update + API call; rollback on failure
- On login: guest favourites synced to server (any IDs not already on server are pushed)
- Persisted to localStorage: `ids` (array of item IDs) + `items` (map of itemId → item object)

#### 4m. External APIs (Third-Party)

##### Google Maps Places Autocomplete

| Field | Value |
|-------|-------|
| **Service URL** | `https://maps.googleapis.com/maps/api/place/js/AutocompletionService.GetPredictionsJson` |
| **When called** | In AddressModal when user types delivery address |
| **Package** | `use-places-autocomplete` (npm `^4.0.1`) |
| **Auth** | Google Maps API key (loaded via Google Maps script) |

Used for delivery address autocomplete in the AddressModal component. The `use-places-autocomplete` hook handles the Google Places API integration.

##### Google reCAPTCHA v2

| Field | Value |
|-------|-------|
| **Script URL** | `https://www.google.com/recaptcha/api.js?render=explicit` |
| **Verify URL** | `https://www.google.com/recaptcha/api2/userverify` |
| **When called** | In Checkout when card (CNP) payment is selected |
| **Site Key** | `VITE_RECAPTCHA_SITE_KEY` env variable |
| **Auth** | Site key passed to `grecaptcha.render()` |

The reCAPTCHA widget is loaded dynamically via script injection, rendered explicitly into a container div, and scaled responsively. The token from reCAPTCHA is included in the `start-transaction` API payload as `recaptchaToken`.

---

## Encryption / Decryption

### Package

- **crypto-js** version `^4.2.0`

### How It Works

All sensitive API payloads use AES encryption with ECB mode and PKCS7 padding. The key comes from `VITE_E_KEY` environment variable.

**File:** `src/helpers/encryption.js`

```javascript
import CryptoJS from 'crypto-js';

const getKey = () => import.meta.env.VITE_E_KEY;

export const handleEncrypt = (dataToEncrypt) => {
  const secretKey = getKey();
  const utf8SecretKey = CryptoJS.enc.Utf8.parse(secretKey);
  const utf8Data = CryptoJS.enc.Utf8.parse(dataToEncrypt);
  return CryptoJS.AES.encrypt(utf8Data, utf8SecretKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
};

export const handleDecrypt = (dataToDecrypt) => {
  const secretKey = getKey();
  const utf8SecretKey = CryptoJS.enc.Utf8.parse(secretKey);
  return CryptoJS.AES.decrypt(dataToDecrypt, utf8SecretKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
};

export const encryptJson = (json) => handleEncrypt(JSON.stringify(json));
export const decryptJson = (encrypted) => JSON.parse(handleDecrypt(encrypted));
```

### Which Fields Are Encrypted

| Direction | What | How |
|-----------|------|-----|
| **Request body** | Full JSON payload | `{ data: encryptJson(payload) }` |
| **Request params** | Full JSON payload (offline payment, reservation create) | `?data=encryptJson(payload)` |
| **Response** | Entire response body | `responseData.encryptedText` or `responseData.data` → `decryptJson()` |

### Before/After Encryption Example

**Before:**
```json
{ "orderId": "abc-123", "splitId": "", "transactionId": "" }
```

**After (as sent to server):**
```json
{ "data": "U2FsdGVkX1+abc...base64string...==" }
```

**Server response (encrypted):**
```json
{ "encryptedText": "U2FsdGVkX1+xyz...base64string...==" }
```

**After decryption:**
```json
{ "body": { "orderId": "abc-123", "orderNo": "ORD-1234", "status": "6" } }
```

---

## State Management

### Redux Store Shape (order-related slices)

```
store
├── cart (persisted to localStorage)
│   ├── cartLines: CartLine[]
│   └── orderType: 'Pickup' | 'Delivery' | 'DineIn'
├── totals (NOT persisted)
│   ├── loading: boolean
│   ├── totals: TotalsLine[] | null
│   ├── grandTotal: number | null
│   └── error: string | null
├── order (NOT persisted)
│   ├── loading: boolean
│   ├── error: string | null
│   ├── currentOrder: { orderId, orderNo, orderType, grandTotal, etaDate, etaTime, order } | null
│   ├── ordersLoading, ordersError, ordersLoaded, customerOrders
│   ├── trackingLoading, trackingError, trackingOrder, restaurantDetails
├── activeOrders (persisted — whitelist: ['orders'])
│   └── orders: ActiveOrder[]
├── auth (NOT persisted by redux-persist, uses localStorage directly)
│   ├── isLoggedIn, user, customerId, mobilePhone, token
├── address (NOT persisted)
│   ├── addresses, selectedAddressId, loading
│   ├── quoteLoading, quote, quoteError
└── slug (NOT persisted)
    └── data: { id, name, orderTypes[], branchName, address, ... }
```

### CartLine Shape

```typescript
interface CartLine {
  lineId: string;       // same as itemId (one line per unique item)
  itemId: string;
  itemName: string;
  itemAltName: string;
  itemImage: string | null;
  itemType: string | null;
  basePrice: number;
  modifiers: Modifier[];  // [{ typeId, optionId, optionName, price, typeName }]
  qty: number;
  customization: any[];   // raw modifier groups from menu API
  tax: any[];
  digiMenuMedia: any[];
  _item: object;          // full original item object
  unavailable?: boolean;  // set by cart validation
}
```

### What Persists Across Page Reloads

| Slice | Persisted? | Whitelist |
|-------|-----------|-----------|
| `cart` | Yes (localStorage) | `cartLines`, `orderType` |
| `activeOrders` | Yes (localStorage) | `orders` |
| `favourites` | Yes (localStorage) | `ids`, `items` |
| `totals` | No | — |
| `order` | No | — |
| `reservation` | No | — |
| `address` | No | — |

### What Clears on Completion

After successful order placement:
1. `clearCartAction()` — empties `cartLines`
2. `placeOrderReset()` — resets entire order slice to initial state
3. `clearDeliveryQuote()` — clears delivery quote data
4. `clearTotals()` — resets totals slice
5. Navigation to `/order-tracking` with order state

---

## Packages Used

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.14.0 | HTTP client; shared `API_MENU` instance with interceptors |
| `crypto-js` | ^4.2.0 | AES encryption/decryption (ECB mode, PKCS7 padding) |
| `redux` | ^5.0.1 | State container |
| `react-redux` | ^9.2.0 | React bindings for Redux |
| `redux-saga` | ^1.4.2 | Side-effect management (API calls, payment orchestration) |
| `redux-persist` | ^6.0.0 | Persist cart & active orders to localStorage |
| `react-router-dom` | ^7.13.0 | Client-side routing, `useNavigate`, `useLocation` for state passing |
| `framer-motion` | ^12.38.0 | Page/component animations |
| `lucide-react` | ^0.563.0 | Icon library |

---

## Flow Steps (Step-by-Step)

### Step 1: Browse Menu

1. User lands on `/menu` or `/ordering` (ordering page is for active ordering)
2. `useMenuData` hook dispatches `getMenuRequest(orderType)` if not cached
3. Menu API returns categories + items
4. `menuTransformer.transformMenuResponse()` groups items by category/subcategory
5. `IntersectionObserver` tracks which category section is visible → updates active filter pill
6. User can search items (client-side filter by itemName, description, category)

### Step 2: Add to Cart

1. User clicks "+" on MenuItemCard → `addToCartAction(item)` dispatched
2. If item already in cart, qty increments by 1
3. If item has modifiers, user opens ItemDetail page → selects modifiers → `addToCartWithModsAction(item, modifiers, qty)`
4. Cart state persists to localStorage via redux-persist
5. `useTotalsSync` hook watches `cartLines` + `orderType` — dispatches `fetchTotalsRequest()` on every change (saga debounces at 400ms)

### Step 3: View Cart

1. User navigates to `/cart`
2. On mount: `validateCartItemsRequest({ source: 'cart' })` dispatched
3. Cart saga sends item IDs to validation endpoint
4. Response marks items as `enabled: true/false`
5. Unavailable items get `unavailable: true` flag in cartReducer
6. After validation success (source='cart'), saga auto-dispatches `fetchTotalsRequest()`
7. Totals display: Item Total, Tax, Delivery Charges (if applicable), Grand Total

### Step 4: Proceed to Checkout

1. User clicks "Proceed to Checkout" on Cart page
2. Navigation to `/checkout` with `loc.state = { cartLines, totals, grandTotal, orderType }`
3. Checkout page reads cart from `loc.state` AND Redux
4. On mount: `clearTotals()` then `fetchTotalsRequest()` to get fresh totals
5. If `orderType === 'Delivery'`:
   - `fetchAddressRequest(customerId)` loads saved addresses via `GET /api/customers/order/fetch-address` `[Token Required]`
   - User selects address → triggers `deliveryQuoteRequest({ addressData: addr })`
   - Quote saga sequence:
     a. `setSelectedAddressId(addr.id)` — stores in Redux for totals saga
     b. Builds `quotePayload` with pickup coords (from slug branch match) + drop coords (from address)
     c. Gets `deliveryProviderId` from `slugData.locationDeliveryProviders.deliveryProviderId`
     d. Calls `POST /api/customers/delivery/quote` with **dual encryption** (body + query param)
     e. On quote success → `deliveryQuoteSuccess(data)` → saga auto-dispatches `fetchTotalsRequest()`
     f. Totals API recalculates with delivery fee from `quote.estimatedPrice`
   - If quote succeeds (`quote.estimatedPrice && quote.eta`): address confirmed, totals re-fetched with delivery fee
   - If quote fails: address rejected, toast "Unable to deliver to this location"
   - **Delivery fee in create order:** The `estimatedPrice` from quote flows into totals (code '4') and is included in the order payload's totals array

### Step 5: Select Payment Method

Two options:
- **Pay at Store / Pay on Delivery** (offline, `tenderType: 'POS'`)
- **Card** (CNP, `tenderType: 'CNP'`)

If Card selected:
1. User clicks "Add New Card" → card form appears
2. reCAPTCHA widget loads dynamically (`render=explicit`)
3. User fills: Card Number (16 digits), Expiry Month, Expiry Year, CVV (3-4 digits), Street Number (up to 6 digits), Zip Code (5 digits)
4. User completes reCAPTCHA → token stored in `cardForm.recaptchaToken`

### Step 6: Place Order

1. Validation checks:
   - User must be logged in
   - Delivery orders must have selected address
   - Payment method must be selected
   - Card form must be valid (if card payment)
2. Build `orderPayload` with items, totals, address, ETA (now + 30 minutes)
3. Dispatch `placeOrderRequest({ orderPayload, orderType, grandTotal, etaDate, etaTime, paymentMethod, cardPayment })`

### Step 7: Order Saga Execution

1. Saga resolves auth token from `state.auth`
2. Calls `createOrderApi(orderPayload, token)` — encrypted request/response
3. Extracts `orderId`, `orderNo` from response
4. **If CNP payment:**
   - Calls `startTransactionApi(txPayload, token)` — blocking
   - Checks `isPaymentCompleted === true` and `paymentStatus === '19'`
   - If failed: dispatches `placeOrderFailure(responseMessage)` — flow stops
5. **If offline payment:**
   - Calls `initiateOfflinePaymentApi(payload, token)` via `fork()` — non-blocking
   - Failure silently caught — order still succeeds
6. Dispatches `addActiveOrderAction(orderData)` — adds to active orders bar
7. Dispatches `placeOrderSuccess(orderData)`

### Step 8: Post-Order Navigation

1. Checkout `useEffect` watches `currentOrder`
2. On success: `clearCartAction()` + navigate to `/order-tracking` with state
3. `placeOrderReset()` cleans up order slice

### Step 9: Order Tracking

1. OrderTracking page reads `routerState` for initial display
2. Dispatches `fetchOrderTrackingRequest(orderId, locationId)`
3. Saga calls `fetchOrderDetailsApi` + `fetchRestaurantDetailsApi` in parallel
4. **Two loading modes:**
   - **Initial load** (`trackingLoading && !orderData`): full-page spinner
   - **Background refresh** (`trackingLoading && !!orderData`): shimmer placeholders on hero eyebrow, ETA, and status badge — rest of page shows previous data
5. Timeline steps resolve via `resolveStepState(status, orderType)`
6. ETA displays formatted date/time with timezone detection
7. Location card always renders from `slugData` (no API dependency) — shows "Location details unavailable" as fallback
8. If order reaches terminal state → `removeActiveOrderAction(orderId)` removes from bar

---

## Conditional Logic

### Order Type Branching

| Condition | Pickup | Delivery | Dine In |
|-----------|--------|----------|---------|
| Address selection | Not shown | Required — fetch saved addresses, validate with delivery quote | Not shown |
| Delivery fee in totals | Not included (no code `'4'`) | Included — code `'4'` from quote `estimatedPrice` | Not included |
| Grand Total calculation | Item Total + Tax | Item Total + Tax + Delivery Charges | Item Total + Tax |
| Create order `addressLine1` | Empty string `""` | Full combined: `"street, city, state, zip, country"` | Empty string `""` |
| Create order `addressId` | Not included in payload | Included (selected address UUID) | Not included |
| Create order `locationDetails.center` | `{ lat: 0, lng: 0 }` | Delivery address lat/lng | `{ lat: 0, lng: 0 }` |
| Payment options | Pay at Store + Card | Pay on Delivery + Card | Pay at Store + Card |
| Tracking timeline | 4 steps (Confirmed → Preparing → Ready → Enjoyed) | 5 steps (Confirmed → Preparing → Ready for delivery → Out for delivery → Enjoyed) | 4 steps |
| ETA label | "Estimated pickup around" | "Estimated delivery around" | "Estimated pickup around" |

### Payment Method Branching

| Condition | Card (CNP) | Offline (POS) |
|-----------|-----------|--------------|
| Card form | Shown with reCAPTCHA | Hidden |
| API call | `startTransactionApi` — **blocking** | `initiateOfflinePaymentApi` — **fire-and-forget** |
| On failure | Order flow fails, error shown | Silently caught, order succeeds |
| `tenderType` | `'CNP'` | `'POS'` |

### Auth State Branching

| Condition | Logged In | Guest |
|-----------|----------|-------|
| Place order | Proceed with `customerId` + token | Trigger `onSignInClick()` → auth modal |
| Fetch orders | Uses `customerId` + `locationId` | Not available |
| Address fetch | Fetches saved addresses | Not available |

### Order Status Codes → Timeline Steps

```
Status 6, 7, 19, 25  → Step 0 (Confirmed / In Queue)
Status 11, 12         → Step 1 (Being Prepared)
Status 43             → Step 1→2 transition (KOT Ready, label: "Order Ready")
Status 13             → Step 2 (Order Ready)
Status 14, 50         → Step 2→3 for Delivery (Out for Delivery)
Status 15             → Step 3 (Delivered)
Status 16             → Step 3 (Picked Up)
Status 17, 59, 60     → Step 3 (Complete)
Status 8, 9           → Cancelled (-1)
Status 18             → Payment Processing (no step highlighted)
```

---

## Code Templates

### Token Resolution Pattern (used in all sagas)

```javascript
function resolveToken(auth) {
  const { token, user } = auth || {};
  if (token) return token;
  return (
    user?.access_token ||
    user?.token ||
    user?.accessToken ||
    user?.authToken ||
    ''
  );
}
```

### Build Totals Payload

```javascript
import buildTotalsPayload from '../utils/buildTotalsPayload';

// In saga:
const payload = buildTotalsPayload(
  availableCartLines, // cartLines.filter(l => !l.unavailable)
  orderType,          // 'Pickup' | 'Delivery' | 'DineIn'
  slugData,           // from state.slug.data
  customerId,         // from state.auth
  selectedAddressId,  // from state.address (optional)
  deliveryFee,        // from action.payload (optional)
);
const response = yield call(getOrderTotalsApi, payload, token);
```

### Order Type ID Resolution

```javascript
function getOrderTypeIdFromSlug(slugData, typeName) {
  const orderTypes = slugData?.orderTypes || slugData?.body?.orderTypes || [];
  return orderTypes.find(
    (t) => t?.typeName?.toLowerCase() === typeName.toLowerCase(),
  )?.id;
}
```

### useTotalsSync Hook (auto-fetch totals on cart change)

```javascript
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTotalsRequest, clearTotals } from '../redux/totals/totalsActions';

export function useTotalsSync() {
  const dispatch  = useDispatch();
  const cartLines = useSelector((s) => s.cart.cartLines);
  const orderType = useSelector((s) => s.cart.orderType);

  useEffect(() => {
    if (cartLines.length === 0) {
      dispatch(clearTotals());
      return;
    }
    dispatch(fetchTotalsRequest());
  }, [cartLines, orderType, dispatch]);
}
```

---

## Complete Redux Module Reference

Every file in `src/redux/` — 9 modules + store + root files (49 total JS files):

### Store Setup (`store.js`, `rootReducer.js`, `rootSaga.js`)

```javascript
// store.js — Redux + Saga + Persist
const sagaMiddleware = createSagaMiddleware();
export const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
export const persistor = persistStore(store);
sagaMiddleware.run(rootSaga);
```

**rootReducer.js** combines 10 slices with 3 persisted:
```javascript
combineReducers({
  slug,                                                    // NOT persisted
  menu,                                                    // NOT persisted
  auth,                                                    // uses own localStorage (AUTH_KEY)
  activeOrders: persistReducer({ key: 'activeOrders', whitelist: ['orders'] }, activeOrdersReducer),
  favourites:   persistReducer({ key: 'favourites',   whitelist: ['ids', 'items'] }, favouritesReducer),
  reservation,                                             // NOT persisted
  order,                                                   // NOT persisted
  cart:         persistReducer({ key: 'cart',          whitelist: ['cartLines', 'orderType'] }, cartReducer),
  totals,                                                  // NOT persisted
  address,                                                 // NOT persisted
});
```

**rootSaga.js** forks all 9 sagas:
```javascript
yield all([slugSaga(), menuSaga(), authSaga(), reservationSaga(), orderSaga(),
           favouritesSaga(), totalsSaga(), cartSaga(), addressSaga()]);
```

---

### 1. `redux/slug/` — Location Configuration (5 files)

| File | Purpose |
|------|---------|
| `slugConstants.js` | `GET_SLUG_REQUEST`, `GET_SLUG_SUCCESS`, `GET_SLUG_FAILURE` |
| `slugActions.js` | `getSlugRequest()`, `getSlugSuccess(data)`, `getSlugFailure(error)` |
| `slugAPI.js` | `fetchSlug()` → `POST /api/customers/locations/slug` `[No Token]` `[**]` |
| `slugReducer.js` | State: `{ loading, data, error }` |
| `slugSaga.js` | Fetches + decrypts slug on `GET_SLUG_REQUEST` |

**Persisted:** No. **First API call on app mount.**

---

### 2. `redux/auth/` — OTP Authentication (5 files)

| File | Purpose |
|------|---------|
| `authConstants.js` | REQUEST_OTP_*, VERIFY_OTP_*, REGISTER_USER_*, LOGOUT, RESET_AUTH_MODAL, `AUTH_KEY = 'amudham_auth'` |
| `authActions.js` | `requestOtp(phone)`, `verifyOtp(phone, otp)`, `registerUser(data)`, `logout()`, `resetAuthModal()` |
| `authAPI.js` | `requestOtpApi` `[*]`, `verifyOtpApi` `[**]`, `registerUserApi` `[**][Token]` |
| `authReducer.js` | State: `{ loading, error, step, mobilePhone, customerId, isNewUser, isLoggedIn, user }` — loads from `localStorage(AUTH_KEY)` on init |
| `authSaga.js` | 3 flows: requestOtp, verifyOtp (detects new/existing user), registerUser. Logout clears activeOrders + cart |

**Persisted:** Own `localStorage` mechanism (not redux-persist). Key: `amudham_auth`.

**Step flow:** `'idle'` → `'otp_sent'` → `'needs_registration'` (new user) or `'done'` (existing) → `'done'`

---

### 3. `redux/menu/` — Menu Data (5 files)

| File | Purpose |
|------|---------|
| `menuConstants.js` | `GET_MENU_REQUEST`, `GET_MENU_SUCCESS`, `GET_MENU_FAILURE` |
| `menuActions.js` | `getMenuRequest(orderType)`, `getMenuSuccess(data)`, `getMenuFailure(error)` |
| `menuAPI.js` | `getOrderMenuApi({ locationId, orderType, customerId, token })` → `POST /api/customers/menu` `[Token]` `[**]` |
| `menuReducer.js` | State: `{ data, loading, error, orderType }` — caches raw response + orderType |
| `menuSaga.js` | Fetches + decrypts. Reads `locationId` from `state.slug.data.id`, token from `state.auth.user.access_token` |

**Persisted:** No. Re-fetches on mount if orderType changed or data is null.

**Key detail in menuSaga:** Pickup sends `customerId: null`, Delivery sends `customerId` + `from: 's'`.

---

### 4. `redux/cart/` — Shopping Cart (5 files)

| File | Purpose |
|------|---------|
| `cartConstants.js` | `VALIDATE_CART_ITEMS_REQUEST`, `_SUCCESS`, `_FAILURE` |
| `cartActions.js` | `validateCartItemsRequest({ source: 'ordering' \| 'cart' })` |
| `cartAPI.js` | `validateCartItemsApi(payload, token)` → `POST /api/customers/order/cartItems` `[Token]` `[*]` |
| `cartReducer.js` | State: `{ cartLines[], orderType }`. **Also exports action types + creators:** `ADD_TO_CART`, `ADD_TO_CART_WITH_MODS`, `UPDATE_QTY`, `UPDATE_LINE_MODIFIERS`, `REMOVE_LINE`, `CLEAR_CART`, `SET_ORDER_TYPE` |
| `cartSaga.js` | Validates items → marks unavailable. If `source === 'cart'`, auto-dispatches `fetchTotalsRequest()` |

**Persisted:** Yes — `whitelist: ['cartLines', 'orderType']`

**Important:** cartReducer.js exports BOTH the reducer AND action types/creators (not just from cartActions.js). The validate actions are in cartActions/cartConstants, but ADD_TO_CART etc. are directly in cartReducer.js.

---

### 5. `redux/totals/` — Order Totals (5 files)

| File | Purpose |
|------|---------|
| `totalsConstants.js` | `FETCH_TOTALS_REQUEST`, `_SUCCESS`, `_FAILURE`, `CLEAR_TOTALS` |
| `totalsActions.js` | `fetchTotalsRequest(options?)`, `clearTotals()` |
| `totalsAPI.js` | `getOrderTotalsApi(payload, token)` → `POST /api/customers/order/totals` `[Token]` `[**]` |
| `totalsReducer.js` | State: `{ loading, totals[], grandTotal, error }` |
| `totalsSaga.js` | **400ms debounce** via `delay(400)` + `takeLatest`. Builds payload via `buildTotalsPayload()`. Reads `deliveryFee` from action payload. Resolves token with localStorage fallback. |

**Persisted:** No. Cleared on checkout leave.

---

### 6. `redux/order/` — Order Placement + Tracking (5 files)

| File | Purpose |
|------|---------|
| `orderConstants.js` | PLACE_ORDER_*, FETCH_CUSTOMER_ORDERS_*, FETCH_ORDER_TRACKING_*, CLEAR_ORDER_TRACKING |
| `orderActions.js` | `placeOrderRequest(payload)`, `placeOrderReset()`, `fetchCustomerOrdersRequest()`, `fetchOrderTrackingRequest(orderId, locationId)`, `clearOrderTracking()` |
| `orderAPI.js` | 6 API functions: `createOrderApi` `[**]`, `initiateOfflinePaymentApi` `[**]`, `startTransactionApi` `[**]`, `fetchOrderDetailsApi` `[**]`, `fetchCustomerOrdersApi` `[*]`, `fetchRestaurantDetailsApi` `[**]` |
| `orderReducer.js` | State: `{ loading, error, currentOrder, ordersLoading, ordersError, ordersLoaded, customerOrders[], trackingLoading, trackingError, trackingOrder, restaurantDetails }` |
| `orderSaga.js` | 3 watchers: `handlePlaceOrder` (create → payment → activeOrders → success), `handleFetchCustomerOrders`, `handleFetchOrderTracking` (parallel fetch order + restaurant details) |

**Persisted:** No. Reset on checkout leave via `placeOrderReset()`.

---

### 7. `redux/activeOrders/` — Active Orders Bar (1 file)

| File | Purpose |
|------|---------|
| `activeOrdersReducer.js` | Actions + reducer in single file. Actions: `ADD`, `REMOVE`, `UPDATE_ALL`, `UPDATE_SINGLE`, `CLEAR`. State: `{ orders[] }` |

**Persisted:** Yes — `whitelist: ['orders']`. Survives page reload.

**Shape per order:**
```javascript
{ orderId, orderNo, orderType, orderStatus, etaDate, etaTime, grandTotal, addedAt, _raw }
```

---

### 8. `redux/address/` — Delivery Addresses + Quote (5 files)

| File | Purpose |
|------|---------|
| `addressConstants.js` | FETCH_ADDRESS_*, SAVE_ADDRESS_*, UPDATE_ADDRESS_*, DELETE_ADDRESS_*, DELIVERY_QUOTE_*, CLEAR_*, SET_SELECTED_ADDRESS_ID |
| `addressActions.js` | Full CRUD: `fetchAddressRequest(customerId)`, `saveAddressRequest(payload)`, `updateAddressRequest(payload)`, `deleteAddressRequest(addressId)`, `deliveryQuoteRequest(payload)`, `clearDeliveryQuote()`, `setSelectedAddressId(id)` |
| `addressAPI.js` | `fetchAddressApi` `[*]`, `saveAddressApi` `[*]`, `updateAddressApi` `[*]`, `deleteAddressApi` `[*]`, `deliveryQuoteApi` `[**]` (dual encryption) |
| `addressReducer.js` | State: `{ addresses[], loading, mutating, error, mutateError, quote, quoteLoading, quoteError, selectedAddressId }` |
| `addressSaga.js` | CRUD sagas (auto-refetch after save/update/delete). **Delivery quote saga** builds full pickup/drop payload from slug branch match, calls quote API, then auto-dispatches `fetchTotalsRequest()` |

**Persisted:** No.

---

### 9. `redux/reservation/` — Table Reservation (5 files)

| File | Purpose |
|------|---------|
| `reservationConstants.js` | FETCH_SLOTS_*, CREATE_RESERVATION_*, CANCEL_RESERVATION_*, RESET_RESERVATION, CLEAR_SLOTS |
| `reservationActions.js` | `fetchSlotsRequest(payload)`, `createReservationRequest(payload)`, `cancelReservationRequest(payload)`, `resetReservation()`, `clearSlots()` |
| `reservationAPI.js` | `fetchReservationSlotsApi` `[*]`, `createReservationApi` `[**]` (query param), `fetchReservationByIdApi` `[**]`, `cancelReservationApi` `[**]` (with `?user=customer`) |
| `reservationReducer.js` | State: `{ slots, slotsLoading, slotsError, bookingResult, reservationDetail, bookingLoading, bookingError, bookingSuccess, cancelLoading, cancelError, cancelSuccess }` |
| `reservationSaga.js` | Slots fetch, 2-step create (create → fetchById), cancel with success-on-error fallback |

**Persisted:** No. All state resets on page reload.

---

### 10. `redux/favourites/` — Favourites (5 files)

| File | Purpose |
|------|---------|
| `favouritesConstants.js` | TOGGLE_FAVOURITE, LOAD_FAVOURITES, CLEAR_FAVOURITES, ADD_FAVOURITE_REQUEST, REMOVE_FAVOURITE_REQUEST, FETCH_FAVOURITES_REQUEST |
| `favouritesActions.js` | Optimistic: `toggleFavouriteAction(itemId, item)`, `loadFavouritesAction(itemList)`, `clearFavouritesAction()`. API-backed: `addFavouriteRequest(itemId, item)`, `removeFavouriteRequest(itemId)`, `fetchFavouritesRequest()` |
| `favouritesAPI.js` | `fetchFavouritesApi` `[*]`, `addFavouriteApi` `[*]`, `removeFavouriteApi` `[*]` — all `[Token]` |
| `favouritesReducer.js` | State: `{ ids[], items{} }`. Clears on LOGOUT. |
| `favouritesSaga.js` | Guest: local only. Logged-in: optimistic + API + rollback. **On login:** syncs guest favs to server (pushes IDs not already on server) |

**Persisted:** Yes — `whitelist: ['ids', 'items']`

---

## Utility / Helper / Hook / Data File Reference

Every file in `src/utils/`, `src/constants/`, `src/hooks/`, `src/helpers/`, and `src/data/`:

### `src/helpers/encryption.js`

AES encryption/decryption using `crypto-js`. ECB mode, PKCS7 padding. Key from `VITE_E_KEY`.

```javascript
export const encryptJson = (json) => handleEncrypt(JSON.stringify(json));
export const decryptJson = (encrypted) => JSON.parse(handleDecrypt(encrypted));
```

Covered in detail in the **Encryption / Decryption** section above.

---

### `src/utils/menuTransformer.js`

Transforms raw menu API response into UI-ready data. This is the **core data pipeline** for all menu/ordering pages.

**Exports:**
- `transformMenuResponse(rawResponse)` — main transformer
- `getItemUnavailability(item)` — derives unavailability flags per item
- `get12HoursTime(isoString, nextAvailableDay)` — formats ISO date-time to "11:30 AM"

**`transformMenuResponse()` pipeline:**

```
Step 1: Filter  → shouldRemoveItem() removes:
  - categoryOff === true
  - both categoryId & subCategoryId are null
  - categoryId or category is null but subCategoryId is non-null

Step 2: Group   → groupItems() organizes into:
  grouped[categoryId] = {
    direct: [...items without subCategory],
    subCategories: {
      [subCategoryId]: { name, items: [...] }
    }
  }

Step 3: Categories → normalize from categoryList[] (old) or availableCategory[] (new)

Step 4: Exclusive  → getExclusiveItems() filters:
  item.isExclusiveCategoryItem && item.enable && item.display
  && not out of stock && not categoryOff

Step 5: Specials   → groupSpecialItems() groups items where isSpecial === true
  by specialName → [{ title, displayType, desc, content: [{ image, dishName, menuData }] }]

Step 6: Return → { categories, items, grouped, exclusiveItems, specialGroups }
```

**Return shape:**
```typescript
{
  categories: Array<{ id, name, categoryOff }>,          // → category filter pills
  items: Array<MenuItem>,                                  // → flat filtered list
  grouped: Record<categoryId, {                           // → grouped by category
    direct: MenuItem[],
    subCategories: Record<subCatId, { name, items[] }>
  }>,
  exclusiveItems: MenuItem[],                              // → "Today's Exclusive" slider
  specialGroups: Array<{                                   // → Home page "Special Menu" section
    title: string,          // specialName
    displayType: string,    // from digiMenuMedia tag
    desc: string,           // categoryDescription
    content: Array<{ image, dishName, menuData }>
  }>
}
```

**Item unavailability logic (`getItemUnavailability`):**
```javascript
const { stockQuantity, itemUnAvailableUntil, nextAvailableDay } = item;

// Year > 3000 → indefinitely unavailable (no resume time shown)
isTemporarilyUnavailable = new Date(itemUnAvailableUntil).getFullYear() > 3000;

// stockQuantity exists and < 1
isOutOfStock = stockQuantity !== null && Number(stockQuantity) < 1;

// Year < 3000 → available at specific time (show formatted time)
isUnAvailableUntil = year < 3000 ? get12HoursTime(itemUnAvailableUntil, nextAvailableDay) : false;
```

---

### `src/utils/buildTotalsPayload.js`

Builds the encrypted payload for the order totals API. Handles modifier normalization and option mapping.

**Exports:**
- `buildTotalsPayload(cartLines, orderType, slugData, customerId, addressId, deliveryFee)` — main builder
- `getOrderTypeIdFromSlug(slugData, typeName)` — resolves order type UUID from slug data

Covered in detail in the **Code Templates** section above.

---

### `src/utils/orderType.js`

Resolves the human-readable order type name from various API response shapes.

**Export:** `resolveOrderTypeName(order, slugData)` — multi-strategy resolution:
1. Check direct fields: `orderTypeGroup`, `orderTypeName`, `typeName`, `fulfillmentType`
2. Match `orderTypeId` against `slugData.orderTypes[]`
3. Status-code heuristics: 14/15/50 → Delivery, 16 → Pickup
4. Delivery hints: address fields, `isDelivery`, delivery fee > 0
5. Fallback: `'Pickup'`

---

### `src/utils/addressStorage.js`

Normalizes address objects and formats them for the createOrder payload.

**Exports:**
- `getSavedAddress(user)` — extracts first address from user object (multiple fallback paths)
- `getAddressLinesForPayload(address)` — formats as `{ addressLine1: "street, city, state, zip, country", addressLine2, addressLine3 }`

---

### `src/utils/branchConfig.js`

Determines feature flags per restaurant branch.

**Exports:**
- `getMatchedBranchByMerchantSlug(slugData, merchantSlug)` — finds branch where `locationSlug === VITE_MERCHANT_SLUG`
- `isReservationEnabledByBranch(slugData, merchantSlug)` — checks `branch.serviceDisable.isReservation`

---

### `src/utils/slugify.js`

URL-safe slug generation for category and item names.

**Export:**
```javascript
export function toSlug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

Used for: `/indian-restaurant-menu/{toSlug(categoryName)}`, item detail URLs, ordering URLs.

---

### `src/constants/orderStatus.js`

Complete order status code mapping and timeline resolution.

**Exports:**
- `ORDER_STATUS_CODES` — all status code constants (6–60)
- `resolveActiveStep(status, order)` — returns 0–3 step index (or -1 for cancelled)
- `resolveStatusLabel(status, order)` — human-readable label ("In Queue", "Being Prepared", "Order Ready" for KOT_READY/43, etc.)
- `isOrderCompleted(order)` — terminal states (delivered, picked up, cancelled)
- `isOrderActive(order)` — still in progress
- `ETA_UNAVAILABLE_STATUSES` — Set of statuses where ETA shows "Will be updated soon"
- `PAYMENT_PROCESSING_STATUS` — `'18'`

Covered in detail in the **Conditional Logic → Order Status Codes** section above.

---

### `src/constants/paymentConstants.js`

Payment tender types and currency resolution.

**Exports:**
- `paymentTenderTypes` — `{ CNP: 'CNP', POS: 'POS', PaymentLinks: 'PAYMENT_LINKS', BharatQR: 'BHARAT_QR' }`
- `paymentCurrencies` — `{ US: 'USD', INR: 'INR' }`
- `resolvePaymentCurrencyFromSlug(slugData)` — maps `slugData.country` to currency code

---

### `src/hooks/useMenuData.js`

All-in-one hook for menu/ordering pages. Handles data fetching, transform, IntersectionObserver, scroll, and filter.

**Signature:** `useMenuData(orderType, { availableNow, searchQuery })`

**Returns:**
```javascript
{
  loading, error,
  sectionCats,       // categories with non-empty groups
  grouped,           // filtered + grouped items
  exclusiveItems,    // filtered exclusive items
  hasExclusive,
  getCategoryCount,  // (catId) => number of items
  activeId,          // currently highlighted category
  filterRef,         // ref for filter bar (height calculation)
  pillsRef,          // ref for pill container (auto-scroll)
  sectionRefs,       // ref map for category sections (observer)
  scrollToSection,   // (catId) => programmatic scroll
}
```

**Key behaviors:**
- Fetches menu on mount (skips if cached for same orderType)
- Transforms via `menuTransformer.transformMenuResponse()`
- Client-side filtering: `availableNow` + `searchQuery`
- IntersectionObserver with `rootMargin: '-10% 0px -55% 0px'`
- Programmatic scroll guard (800ms `programmaticRef`)
- Auto-centers active pill in scroll container

Covered in detail in the **order-design/SKILL.md → IntersectionObserver** section.

---

### `src/hooks/useTotalsSync.js`

Auto-fetches totals whenever cart changes. Used on ordering/menu pages.

```javascript
export function useTotalsSync() {
  // Watches cartLines + orderType
  // Empty cart → clearTotals()
  // Non-empty → fetchTotalsRequest() (saga handles debounce)
}
```

**Do NOT use on ItemDetailPage** — there, dispatch `fetchTotalsRequest()` manually only on "Add to Cart" confirm.

---

### `src/data/menuLandingPages.js`

Static SEO content for category landing pages.

**Exports:**
- `homeFaqItems` — FAQ items for home page (with `answerSegments` containing internal `Link` elements for SEO)
- `menuLandingPages` — array of SEO landing page configs per category
- `menuLandingPagesBySlug` — `Object.fromEntries` lookup by slug

**Each `menuLandingPages` entry:**
```typescript
{
  slug: string,             // URL slug e.g. 'biryani', 'tandoori', 'curries'
  heroImage: string,        // imported image asset
  title: string,            // "Best Biryani in Sachse, TX"
  shortTitle: string,       // "Biryani"
  heroDescription: string,
  overview: string,
  chips: string[],          // keyword chips displayed on page
  featurePoints: string[],  // bullet points
  faqIntro: string,
  faqs: Array<{ question, answer }>,
  seoTitle: string,         // <title> tag
  seoDescription: string,   // <meta name="description">
}
```

**Categories with landing pages:** biryani, tandoori, curries, indian-breads, starters, desserts, dosa

**Used by:** `MenuCategoryRouter` at `/indian-restaurant-menu/:categorySlug` — renders the SEO landing page for matching slugs, or falls back to the filtered menu view.

**`homeFaqItems`** uses `answerSegments` pattern for rich FAQ answers with internal links:
```javascript
answerSegments: [
  { type: 'text', text: 'We serve ' },
  { type: 'link', text: 'naan', to: '/indian-restaurant-menu/indian-breads' },
  { type: 'text', text: ', freshly baked...' },
]
```

---

### `src/context/` (empty — no context files)

This project does NOT use React Context. All state management is via Redux + Redux-Saga.

---

## SEO Requirements

### Route Structure

| Route | Page | SEO Notes |
|-------|------|-----------|
| `/order-online/sachse-tx/pickup` | Ordering page | Location-based URL with city + state slug |
| `/menu` | Menu browse page | Static, indexable |
| `/menu/:categorySlug` | Category page | Dynamic category slug for deep linking |
| `/menu/:categorySlug/:itemSlug` | Item detail page | Item-level SEO with slugified item name |
| `/cart` | Cart page | `noindex` — transactional |
| `/checkout` | Checkout page | `noindex` — transactional |
| `/order-tracking` | Order tracking | `noindex` — authenticated |
| `/orders` | Past orders list | `noindex` — authenticated |

### Slug Generation

```javascript
// src/utils/slugify.js
export function toSlug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

### Menu Landing Pages

- The project includes `src/data/menuLandingPages.js` for SEO landing pages per category
- Category URLs use slugified category names: `/menu/biryanis`, `/menu/appetizers`
- Item URLs use: `/menu/{categorySlug}/{itemSlug}` where itemSlug = `toSlug(itemName)`

---

## Gotchas & Edge Cases

1. **Response shape inconsistency:** The API sometimes returns `{ body: { ... } }`, sometimes `{ data: { ... } }`, sometimes flat. Always check `data?.body || data` pattern.

2. **Encrypted response field:** Could be `responseData.encryptedText` OR `responseData.data` (string). The `decryptEncryptedResponse` helper tries both.

3. **Cart lineId === itemId:** Each unique item has one cart line. Adding the same item again increments qty rather than creating a new line. Modifiers replace, not append.

4. **Totals debounce:** The saga uses `delay(400)` + `takeLatest`. Rapid qty changes fire multiple requests, but only the last one completes.

5. **Offline payment fork:** `initiateOfflinePaymentApi` runs in a forked saga. Its failure is silently caught. This is intentional — staff collects payment manually.

6. **CNP payment is blocking:** Unlike offline, card payment failure STOPS the order flow. The order exists server-side but is marked as payment-failed.

7. **ETA calculation:** Checkout hardcodes `Date.now() + 30 minutes` as ETA. The server may override this.

8. **Address normalization:** API returns `postalCd` (not `postalCode`) and `countryCd` (not `country`). The checkout normalizes these before building the payload.

9. **Payment currency:** Resolved from `slugData.country || slugData.countryCd` → maps `'US' → 'USD'`, `'INR' → 'INR'`.

10. **reCAPTCHA scaling:** The widget is 304px wide. A responsive scale function shrinks it to fit the container.

11. **Active orders persistence:** Active orders survive page reloads (redux-persist). Terminal statuses (delivered, picked-up, cancelled) remove orders from the bar.

12. **Order type resolution for tracking:** Uses a multi-strategy approach: checks `orderTypeGroup`, `orderTypeName`, then slug orderTypes by ID, then status-code heuristics, then delivery address hints.

---

## Checklist

- [ ] Slug API called on app mount (`POST /api/customers/locations/slug`) — `[No Token]` `[**]` encrypted
- [ ] Slug response decrypted and stored in `state.slug.data`
- [ ] Auth flow: Request OTP (`[No Token]` `[*]`) → Verify OTP (`[No Token]` `[**]`) → Register if new user (`[Token Required]` `[**]`)
- [ ] New user detection: `!customerId` in verify-otp response → show registration form
- [ ] Auth persisted to localStorage under key `amudham_auth`
- [ ] Logout clears: localStorage auth, active orders, cart
- [ ] Menu API: `POST /api/customers/menu` — `[Token Required]` `[**]` — Pickup omits `from`, Delivery adds `"from": "s"` and `customerId`
- [ ] Address CRUD: fetch/save/update/delete — all `[Token Required]` `[*]` plain JSON
- [ ] Delivery Quote: `POST /api/customers/delivery/quote` — `[Token Required]` `[**]` dual encryption (body + query param)
- [ ] Delivery quote provides `estimatedPrice` which flows into totals API for delivery fee calculation
- [ ] `deliveryProviderId` obtained from `slugData.locationDeliveryProviders.deliveryProviderId`
- [ ] Favourites: fetch/add/remove — all `[Token Required]` `[*]`; guest users store locally only
- [ ] Favourites synced to server on login (guest IDs pushed if not already on server)
- [ ] `VITE_BASE_URL` environment variable is set to the correct API base URL
- [ ] `VITE_E_KEY` environment variable is set (must match backend encryption key)
- [ ] `VITE_RECAPTCHA_SITE_KEY` is set for card payment flow
- [ ] `VITE_PAYMENT_PROVIDER_ID` is set for CNP transactions
- [ ] `API_MENU` axios instance created with `x-app-version: 'v2'` header
- [ ] `encryptJson` / `decryptJson` functions use AES-ECB with PKCS7 padding
- [ ] Cart reducer handles: ADD_TO_CART, ADD_TO_CART_WITH_MODS, UPDATE_QTY, UPDATE_LINE_MODIFIERS, REMOVE_LINE, CLEAR_CART, SET_ORDER_TYPE
- [ ] Cart is persisted via redux-persist (whitelist: cartLines, orderType)
- [ ] Cart validation API called on Cart page mount with `source: 'cart'`
- [ ] Totals saga has 400ms debounce via `delay()` + `takeLatest`
- [ ] Totals payload builder handles modifiers correctly (maps to `options` array)
- [ ] Checkout builds order payload with items, totals, address, ETA
- [ ] Order saga: createOrder → (CNP: startTransaction blocking) OR (POS: initiateOfflinePayment forked)
- [ ] On CNP failure: order flow fails, error displayed
- [ ] On POS failure: silently caught, order succeeds
- [ ] Active orders bar updated via `addActiveOrderAction` after successful order
- [ ] On order success: cart cleared, navigate to /order-tracking with state
- [ ] Order tracking fetches order details + restaurant details in parallel
- [ ] Timeline steps resolve correctly for all status codes (6→19, 11→12, 13, 14, 15→17)
- [ ] Cancelled orders (status 8, 9) show cancellation UI
- [ ] ETA unavailable statuses (6, 19, 25) show "Will be updated soon"
- [ ] Payment processing status (18) shows "Transaction being Processed"
- [ ] SEO routes use location-based slugs (`/order-online/sachse-tx/pickup`)
