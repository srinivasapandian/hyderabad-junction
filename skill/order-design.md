# Order Design Skill

## Purpose

This skill teaches how to build the **complete UI/UX design system** for a restaurant food ordering flow — every screen, component, form, layout rule, interaction pattern, loading state, and animation from menu browsing through checkout to order tracking. Use this skill whenever you need to replicate the visual design and component architecture of this ordering experience in any React project.

## Prerequisites

- **Language:** Current reference is **JavaScript (`.jsx`)** — for new projects use **TypeScript (`.tsx`)**. All component props should be typed with interfaces. See `order-flow/SKILL.md` for the full type definitions (`CartLine`, `MenuItem`, `SlugData`, `RootState`, etc.)
- React 19+ with TSX
- Framer Motion for animations (`framer-motion ^12.38.0`)
- Lucide React for icons (`lucide-react ^0.563.0`)
- Font Awesome (loaded via CDN — `fa-solid`, `fa-regular`, `fa-brands` icon classes)
- CSS files per component (this project uses component-scoped `.css` imports)
- Redux + React-Redux with typed hooks (`useAppSelector`, `useAppDispatch`)
- React Router DOM v7 for navigation

---

## Screen-by-Screen Breakdown

### Screen 1: Menu Page (`/menu`)

**Components on screen:**
- `Header` — fixed top nav with logo, nav links, cart icon with badge
- `OrderingBar` — order type toggle (Pickup/Delivery) + location display
- `CategoryFilter` — horizontal scrollable pill bar for category filtering
- `TodaysExclusive` section — featured items carousel (Swiper)
- `MenuGrid` — grid of `MenuItemCard` components grouped by category
- `Footer` — site-wide footer

**State driving display:**
- `state.menu.data` → transformed by `menuTransformer` → categories, grouped items, exclusive items
- `state.menu.loading` → shows shimmer placeholders (`CategoryFilterShimmer`, `MenuItemCardShimmer`)
- `useMenuData` hook `activeId` → which category pill is highlighted
- `searchQuery` (local) → filters items client-side

### Screen 2: Ordering Page (`/ordering` or `/order-online/:location/:type`)

**Identical to Menu** but with a different route context and active ordering mode. Uses the same `useMenuData` hook. The `FloatingCart` component appears at bottom when cart has items.

**Components on screen:**
- Same as Menu + `FloatingCart` bar at bottom

### Screen 3: Item Detail Page (`/menu/:categorySlug/:itemSlug`)

**Components on screen:**
- `ItemDetail` — full item view with image, name, price, description
- Modifier groups (customization) — rendered as selectable option groups
- Quantity selector (- / qty / +)
- "Add to Cart" button with total price

**State driving display:**
- `item` object from menu data (found by slug match)
- `cartLine` from `state.cart.cartLines` (if item already in cart → shows current qty + modifiers)
- Local state: `selectedModifiers[]`, `qty`

### Screen 4: Cart Page (`/cart`)

**Components on screen:**
- Back button → navigates to menu/ordering
- Order Type toggle (Pickup / Delivery / Dine In) with radio-style buttons
- Cart item list — each item shows: image, name, modifiers summary, qty controls (- / qty / +), line total, remove button
- Unavailable item indicator (items marked `unavailable: true` after validation)
- Totals section — Item Total, Tax, Delivery Charges, Grand Total
- "Proceed to Checkout" CTA button
- `Footer`

**State driving display:**
- `state.cart.cartLines` → item list
- `state.cart.orderType` → which type tab is active
- `state.totals.totals` → totals breakdown
- `state.totals.loading` → totals loading spinner
- Cart validation → `line.unavailable` flag

### Screen 5: Checkout Page (`/checkout`)

**Components on screen:**
- Back button → `/cart`
- Title: "Confirm Order"
- Two-column layout (right column + left column on desktop, stacked on mobile)

**Right column:**
- Pickup Address card (static for Pickup) OR Delivery Address section with:
  - Saved address radio list
  - "Add New" button → opens `AddressModal`
  - Loading state for addresses
  - Empty state ("No saved addresses yet")
  - Validation error inline
  - Quote loading indicator on pending address
- Payment section:
  - Pay at Store / Pay on Delivery checkbox
  - Card checkbox
  - "Add New Card" button
  - Card form (conditionally shown):
    - Card Number (16 digits)
    - Expiry Month dropdown
    - Expiry Year dropdown
    - CVV (3-4 digits)
    - Street Number (up to 6 digits)
    - Zip Code (5 digits)
    - reCAPTCHA widget (responsive scaled)

**Left column:**
- Order Summary card with order type badge
- Totals breakdown (sorted by `sortOrder`)
- Items list (qty x name + price per line)
- Error display (saga error or local validation)
- "Place Order — $XX.XX" CTA button
- Terms notice

**State driving display:**
- `loc.state` (passed from Cart) — cartLines, totals, grandTotal, orderType
- `state.order.loading` → "Placing Order..." spinner on CTA
- `state.order.error` → error banner
- `state.order.currentOrder` → triggers navigation on success
- `state.address.addresses` → saved address list
- `state.address.quoteLoading` → address validation spinner
- `state.address.quote` → delivery quote result
- `state.totals` → live totals from Redux (updated after quote)
- Local state: `paymentMethod`, `showCardForm`, `cardForm`, `selectedAddress`, `pendingAddress`

### Screen 6: Order Tracking Page (`/order-tracking`)

**Components on screen:**
- Hero section — eyebrow text + large ETA time or status message
- Order number display
- Two-column grid:
  - **Left: Timeline** — vertical step list with icons, connecting lines, status states
  - **Right: Summary card** — order type badge, item count, items list (max 4 + "more"), totals breakdown
- Location card — pickup location or delivery address with phone (always rendered from slugData, no API dependency)
- Action buttons — "Order Again" + "View My Orders"
- `Footer`

**State driving display:**
- `state.order.trackingOrder` — live order data
- `state.order.restaurantDetails` — location info
- `state.order.trackingLoading` — loading spinner (initial) or shimmer (background refresh)
- `routerState` (from navigation) — initial display before API response
- `resolveStepState(status, orderType)` → timeline step highlighting
- `resolveStatusLabel(status)` → badge text

**Two loading modes:**
1. **Initial load** (`trackingLoading && !orderData`): Full-page spinner "Loading order details…"
2. **Background refresh** (`trackingLoading && !!orderData`): Page already has data, shimmer placeholders replace:
   - Hero eyebrow text → `<span className="trk-shimmer trk-shimmer--eyebrow" />`
   - Hero ETA/time → `<span className="trk-shimmer trk-shimmer--time" />`
   - Status badge → `<span className="trk-shimmer trk-shimmer--badge" />`
   - Rest of the page (timeline, items, totals, location) stays visible with previous data

**Location card behavior:**
- Always renders from `slugData` (restaurant name, address, phone) — no dependency on tracking API
- For delivery: shows delivery address from order data
- Fallback when no location data available: "Location details unavailable" warning

### Screen 7: Orders Page (`/orders`)

**Components on screen:**
- Order list — each order card shows: order number, date, order type icon, items summary, total, status badge
- Empty state (no past orders)
- Loading state

**State driving display:**
- `state.order.customerOrders` → order list
- `state.order.ordersLoading` → loading spinner

### Shared Overlay: Auth Modal (`AuthModal.jsx`)

**3-Step OTP Authentication Flow:**

**Step 1 — Phone Input:**
- Phone number input field
- "Send OTP" button
- Error display for failed OTP request
- Loading spinner while sending

**Step 2 — OTP Verification:**
- 6-digit OTP input
- "Verify" button
- Resend OTP option
- Error display for invalid OTP
- Loading spinner while verifying

**Step 3 — Registration (NEW users only):**
- Shown ONLY when verify-otp response has NO `customerId`
- Phone number auto-populated (read-only)
- First Name input (required)
- Last Name input
- Email input (required)
- "Register" button
- Loading spinner while registering

**State driving display:**
- `state.auth.step`:
  - `'idle'` → show phone input (Step 1)
  - `'otp_sent'` → show OTP input (Step 2)
  - `'needs_registration'` → show registration form (Step 3) — triggered when `isNewUser === true`
  - `'done'` → close modal
- `state.auth.loading` → spinner on active button
- `state.auth.error` → error message display
- `state.auth.mobilePhone` → auto-fills phone in registration
- `state.auth.isLoggedIn` → triggers modal close

**Key behavior:**
- New user detection: `!customerId` in verify-otp response → `isNewUser: true` → show registration
- Registration calls `PUT /api/customers/user/update` with token from verify-otp
- Auth persisted to `localStorage` under key `amudham_auth`
- Logout clears localStorage, cart, and active orders

### Shared Overlay: Address Modal (`AddressModal.jsx`)

**Components:**
- Google Places Autocomplete input (uses `use-places-autocomplete` package)
- Manual address fields: Address Line 1, Line 2, City, State, Zip, Country
- Tag selector (Home, Work, Other)
- Save button → dispatches `saveAddressRequest(payload)` to addressSaga
- After save: saga auto-re-fetches address list

**State driving display:**
- `state.address.mutating` → save button loading spinner
- `state.address.mutateError` → error message
- `isOpen` / `onClose` props from parent (Checkout page)

**Address saved via:** `POST /api/customers/order/save-address` `[Token Required]` `[*]` Plain JSON

### Shared Component: Active Orders Bar

**Component:** `ActiveOrdersBar`
- Fixed bar (below header) showing active order pills
- Each pill: order number + status label + order type icon
- Click → navigates to `/order-tracking` with order state
- Persisted via redux-persist — survives page reloads
- Removed when order reaches terminal status

### Shared Component: Floating Cart

**Component:** `FloatingCart`
- Fixed bottom bar on ordering pages
- Shows: item count, total price, "View Cart" button
- Animates in/out based on `cartLines.length > 0`

### Shared Component: Toast

**Component:** `Toast`
- Floating notification at bottom of screen
- Props: `message`, `visible`, `onHide`
- Auto-hides after timeout

---

## Component Architecture

### Component Hierarchy

```
App
├── Header (always visible)
│   ├── Logo
│   ├── Nav Links
│   └── Cart Icon + Badge (cartLines.length)
├── ActiveOrdersBar (shows when activeOrders.length > 0)
├── Routes
│   ├── HomePage
│   ├── MenuPage
│   │   ├── OrderingBar
│   │   ├── CategoryFilter (with shimmer)
│   │   ├── TodaysExclusive → ExclusiveItemCard[]
│   │   └── MenuGrid → MenuItemCard[]
│   ├── OrderingPage (same structure as Menu + FloatingCart)
│   ├── ItemDetailPage → ItemDetail
│   ├── CartPage
│   ├── CheckoutPage
│   │   ├── AddressModal (overlay)
│   │   └── Toast (overlay)
│   ├── OrderTrackingPage
│   ├── OrdersPage
│   └── ReservationPage
├── BottomNav (mobile only)
├── AuthModal (overlay — triggered from any page)
└── Footer (always at bottom)
```

### Key Component Props

| Component | Props | Source |
|-----------|-------|--------|
| `MenuItemCard` | `item`, `categorySlug` | Parent MenuGrid maps over items |
| `ItemDetail` | `item` | Route param → find in menu data |
| `FloatingCart` | (none — reads Redux directly) | `state.cart.cartLines`, `state.totals` |
| `ActiveOrdersBar` | (none — reads Redux directly) | `state.activeOrders.orders` |
| `OrderingBar` | (none — reads Redux directly) | `state.cart.orderType`, `state.slug.data` |
| `CategoryFilter` | `categories`, `activeId`, `onSelect`, `pillsRef` | Parent passes from `useMenuData` |
| `Toast` | `message`, `visible`, `onHide` | Parent local state |
| `AddressModal` | `isOpen`, `onClose` | Parent local state |
| `AuthModal` | (managed by parent via ref/callback) | Triggered by `onSignInClick` |
| `CheckoutCardDropdown` | `label`, `placeholder`, `value`, `options`, `onChange` | Checkout parent |

### Shared Components Between Order and Reservation

| Component | Used In Order Flow | Used In Reservation Flow |
|-----------|--------------------|--------------------------|
| `Header` | Yes | Yes |
| `Footer` | Yes | Yes |
| `BottomNav` | Yes | Yes |
| `AuthModal` | Yes (for sign-in before checkout) | No (reservation collects contact inline) |
| `Toast` | Yes (checkout delivery errors) | No |
| `AddressModal` | Yes (checkout delivery) | No |
| `ActiveOrdersBar` | Yes | Yes (visible globally) |

---

## UX Patterns

### Loading States

| Context | Pattern |
|---------|---------|
| Menu loading | `CategoryFilterShimmer` + `MenuItemCardShimmer` placeholder components |
| Totals loading | Inline spinner next to totals section |
| Cart validation | No visible indicator (happens in background) |
| Checkout placing | CTA button shows `<span className="checkout-spinner" /> Placing Order...` — button disabled |
| Address loading | `<span className="checkout-spinner" /> Loading addresses...` |
| Address quote validation | Card gets `is-validating` class (subtle pulse) |
| Order tracking — initial load | Full-page spinner: `<span className="tracking-spinner" /> Loading order details...` (when `trackingLoading && !orderData`) |
| Order tracking — background refresh | Shimmer placeholders replace hero eyebrow, ETA time, and status badge while data already exists (when `trackingLoading && !!orderData`). Uses `trk-shimmer` CSS class with variants `--eyebrow`, `--time`, `--badge` |
| reCAPTCHA loading | Container empty until widget renders |

### Error Display Patterns

| Context | Pattern |
|---------|---------|
| Checkout — saga error | Red banner with `fa-exclamation-circle` icon: `<Motion.div className="checkout-error">` — animates in with `opacity: 0 → 1, y: -4 → 0` |
| Checkout — local validation | Same red banner (localError takes precedence if no saga error) |
| Address validation | Inline `<Motion.p className="checkout-addr-error">` under address list |
| Delivery quote failure | `Toast` component at bottom: "Unable to deliver to this location!" |
| Order tracking error | Inline `<p className="tracking-location__error">` with warning icon |
| Cart — unavailable items | Items marked with `unavailable` flag (visual disabled state) |

### Success / Confirmation Patterns

| Context | Pattern |
|---------|---------|
| Order placed | Navigate to `/order-tracking` — hero shows ETA or "Will be updated soon" |
| Order completed | All timeline steps green, hero says "Order Complete — Thank You!" |
| Add to cart | Quantity badge updates immediately (optimistic) |
| Cart clear | After order success, `clearCartAction()` resets to empty |

### Empty States

| Context | Pattern |
|---------|---------|
| Cart empty | Centered icon (`fa-bag-shopping`) + "Your cart is empty." + "Start Ordering" CTA link |
| No saved addresses | Icon (`fa-location-dot`) + "No saved addresses yet" + "Add a delivery address to continue" |
| No past orders | Similar centered empty state |
| Menu search — no results | Items section shows nothing (filtered out) |

---

## Form Design

### Checkout Card Payment Form

| Field | Label | Type | Validation | Error Message |
|-------|-------|------|-----------|---------------|
| `accountNumber` | Card Number * | text (inputMode: numeric) | Exactly 16 digits | "Card Number must be 16 digits." |
| `expiryMonth` | Month * | custom dropdown | Must be selected | "Please select Expiry Month." |
| `expiryYear` | Year * | custom dropdown | Must be selected | "Please select Expiry Year." |
| `cvv` | CVV * | text (inputMode: numeric) | 3 or 4 digits | "CVV must be 3 or 4 digits." |
| `streetCode` | Street Number * | text (inputMode: numeric) | 1-6 digits, required | "Street Number is required." / "Street Number must be at most 6 digits." |
| `postalCode` | Zip Code * | text (inputMode: numeric) | Exactly 5 digits | "Zip Code must be 5 digits." |
| `recaptchaToken` | (reCAPTCHA widget) | widget | Must be completed | "Please complete reCAPTCHA." |

**Field ordering:** Card Number → Month + Year + CVV (3-column row) → Street Number + Zip Code (2-column row) → reCAPTCHA

**Input filtering:** All numeric fields use `digitsOnly(value, maxLen)` — strips non-digits and truncates:
```javascript
function digitsOnly(value, maxLen) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLen);
}
```

**Custom dropdown component** (`CheckoutCardDropdown`):
- Click trigger → opens dropdown list below
- Click outside → closes
- Selected option shows in trigger
- Uses `aria-haspopup="listbox"` and `aria-expanded` for accessibility

### Checkout Payment Selection

- Two checkbox-style options (not mutually exclusive in markup but logic enforces single selection)
- Toggle behavior: checking one unchecks the other via `handlePaymentToggle(option, checked)`
- Card option: requires clicking "Add New Card" button to reveal form

### Cart Quantity Controls

- Each item has `- qty +` controls
- `-` dispatches `updateQtyAction(lineId, -1)`
- `+` dispatches `updateQtyAction(lineId, +1)`
- When qty reaches 0, item removed from cart
- Remove button (trash icon) dispatches `removeLineAction(lineId)`

---

## Layout & Spacing Rules

### Grid / Flex Patterns

**Menu Grid:**
- CSS Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Gap: consistent spacing between cards

**Checkout Two-Column:**
- Flex row on desktop: right column (payment/address) + left column (summary/items)
- Stacks vertically on mobile
- Class: `.checkout-body` with flex layout

**Order Tracking Grid:**
- Class: `.tracking-grid` — two-column layout
- Left: timeline steps (vertical)
- Right: summary card + location card

### Responsive Breakpoints

The project uses CSS with mobile-first approach:
- **Mobile** (< 768px): Single column layouts, stacked sections
- **Tablet** (768px - 1024px): Two-column where applicable
- **Desktop** (> 1024px): Full two-column checkout, wider menu grid

### Design Tokens

**Media CDN:** `https://storage.googleapis.com/mhd-media/img`

**Image URL pattern:**
```javascript
const MEDIA_CDN = 'https://storage.googleapis.com/mhd-media/img';
const getExtension = (mimeType = '') => mimeType.split('/')[1] || 'jpg';
const getImageUrl = (itemImage, itemType) => {
  if (itemImage) return `${MEDIA_CDN}/${itemImage}.${getExtension(itemType)}`;
  return null; // falls back to placeholderImg
};
```

**Placeholder image:** `src/assets/placeHolderMedia.jpg` — used when `itemImage` is null or image fails to load.

**Common CSS class patterns:**
- `.checkout-card` — rounded card container with padding and subtle border
- `.checkout-card__title` — card header with icon
- `.checkout-cta` — primary action button (full width)
- `.checkout-spinner` — inline loading spinner
- `.tracking-hero` — large centered hero text area
- `.tracking-step` — timeline step with `.is-done` (green), `.is-active` (pulsing)
- `.tracking-card` — summary card, `.tracking-card--soft` for muted variant

---

## Interaction Patterns

### User Actions → Effects

| Action | Component | Effect |
|--------|-----------|--------|
| Click "+" on menu item | `MenuItemCard` | `addToCartAction(item)` → cart updates, totals refetch |
| Click item card | `MenuItemCard` | Navigate to `/menu/:catSlug/:itemSlug` |
| Click category pill | `CategoryFilter` | Smooth scroll to section, pill highlights |
| Scroll past sections | Menu page | IntersectionObserver updates active pill |
| Click "View Cart" | `FloatingCart` | Navigate to `/cart` |
| Change order type | Cart / OrderingBar | `setOrderTypeAction(type)` → totals refetch |
| Click "Proceed to Checkout" | Cart page | Navigate to `/checkout` with state |
| Select delivery address | Checkout | `deliveryQuoteRequest` → validates, then `fetchTotalsRequest` with fee |
| Toggle payment method | Checkout | Updates `paymentMethod` state, shows/hides card form |
| Click "Place Order" | Checkout | Validation → `placeOrderRequest()` → saga handles API |
| Order success | Checkout (auto) | Clear cart → navigate to `/order-tracking` |
| Click active order pill | `ActiveOrdersBar` | Navigate to `/order-tracking` with order state |
| Click "Order Again" | Order Tracking | Navigate to `/order-online/sachse-tx/pickup` |

### Animations

| Context | Animation | Config |
|---------|-----------|--------|
| Tracking hero | Fade in + slide up | `initial={{ opacity: 0, y: 20 }}, animate={{ opacity: 1, y: 0 }}, duration: 0.4` |
| Timeline steps | Staggered fade in + slide right | `initial={{ opacity: 0, x: -15 }}, delay: index * 0.1, duration: 0.3` |
| Error banners | Fade in + slight slide up | `initial={{ opacity: 0, y: -4 }}, animate={{ opacity: 1, y: 0 }}` |
| Cancelled illustration | Scale in | `initial={{ opacity: 0, scale: 0.92 }}, animate={{ opacity: 1, scale: 1 }}, duration: 0.35` |
| Page transitions | Slide left/right | Via `AnimatePresence` with framer-motion |

### Timeline Step States

Each `.tracking-step` can be in one of three visual states:
- **Done** (`.is-done`): Green icon, green connector line, checkmark-style
- **Active** (`.is-active`): Pulsing/blinking icon, colored connector
- **Default**: Grey icon, grey connector line

### Optimistic UI Updates

- **Add to cart**: Cart badge count updates immediately (Redux dispatch is synchronous)
- **Quantity change**: UI updates immediately, totals refetch in background (400ms debounced)
- **Remove item**: Item disappears immediately from cart list

---

## SEO Design Considerations

### Menu Item Cards

- Each card links to `/menu/:categorySlug/:itemSlug` — crawlable by search engines
- Item names and descriptions are in the DOM (not lazy-loaded behind interactions)
- Images use descriptive alt text derived from `itemName`

### Category Navigation

- Category pills generate section anchors in the DOM
- Category pages at `/menu/:categorySlug` are directly linkable
- `MenuCategoryRouter` component handles category-specific routing

### Structured Data Opportunities

- Menu items have: name, price, description, image URL — suitable for `MenuItem` schema
- Restaurant location data from slug: name, address, phone — suitable for `Restaurant` schema
- Order tracking page should be `noindex` (authenticated, transactional)

---

---

## Framework-Level Route & UI Structure

### Complete Route Map

```
App (BrowserRouter)
├── Layout (Header + Outlet + BottomNav)
│   ├── /                                              → Home
│   ├── /indian-restaurant-menu                        → Menu (browse-only, Pickup-only)
│   ├── /indian-restaurant-menu/:categorySlug          → MenuCategoryRouter (category landing)
│   ├── /indian-restaurant-menu/:catSlug/:itemSlug     → ItemDetailPage (full item + modifiers)
│   ├── /order-online/sachse-tx                        → Redirect → /order-online/sachse-tx/pickup
│   ├── /order-online/sachse-tx/:orderType             → Ordering (Pickup/Delivery active ordering)
│   ├── /order-online/sachse-tx/:orderType/:catSlug    → Ordering (same page, URL updated on filter click)
│   ├── /cart                                          → Cart
│   ├── /checkout                                      → Checkout
│   ├── /orders                                        → Order History
│   ├── /order-tracking                                → OrderTracking
│   ├── /favourites                                    → Favourites
│   ├── /saved-address                                 → SavedAddress
│   ├── /account                                       → Account
│   ├── /reservation                                   → ReservationPage (guarded by isReservationEnabled)
│   ├── /about-us                                      → About
│   └── /contact                                       → Contact
├── FloatingCart (overlay — outside Layout, visible globally when cart has items)
├── ActiveOrdersBar (overlay — outside Layout, visible when active orders exist)
└── AuthModal (overlay — outside Layout, triggered by onSignInClick)
```

### Menu Page vs Ordering Page — Key Structural Difference

| Feature | `/indian-restaurant-menu` (Menu) | `/order-online/sachse-tx/:orderType` (Ordering) |
|---------|----------------------------------|--------------------------------------------------|
| **Hero section** | Yes — `PageHero` with background image, title "Our Menu" | No hero — starts directly with OrderingBar |
| **OrderingBar** | NOT present | Present — shows Pickup/Delivery toggle, search, "Available Now" filter |
| **CategoryFilter** | Present — sticky pill bar | Present — sticky pill bar (same component) |
| **MenuGrid** | Present — grouped by category | Present — same structure |
| **Order type** | Fixed to Pickup (hardcoded) | User-toggleable Pickup/Delivery from URL param |
| **URL on filter click** | `/indian-restaurant-menu/{categorySlug}` via `navigate()` | `/order-online/sachse-tx/{orderType}/{categorySlug}` via `window.history.replaceState()` |
| **Remount on filter** | Yes — `navigate()` causes remount for SEO | No — `replaceState()` avoids remount, preserves scroll |
| **FloatingCart** | Visible if cart has items | Visible if cart has items |
| **Search** | Not available | Available via OrderingBar |

### OrderingBar Structure

```
┌────────────────────────────────────────────────────────────────┐
│ .ob-wrap                                                       │
│ ┌───────────────────────────┐  ┌────────────────────────────┐ │
│ │  [Pickup] [Delivery]      │  │  🔍 Search...  [✓ Now]    │ │
│ │  toggle buttons            │  │  search + available filter │ │
│ └───────────────────────────┘  └────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- Pickup/Delivery toggle → dispatches `setOrderTypeAction()` + `validateCartItemsRequest()` + updates URL
- "Available Now" checkbox → filters items client-side (`isAvailableNow()` in `useMenuData`)
- Search input → filters items client-side by name/description/category

### Automatic Category Filter Highlight (IntersectionObserver)

The `useMenuData` hook uses `IntersectionObserver` to auto-highlight the active category pill as user scrolls:

```javascript
// Observer config
const observer = new IntersectionObserver(callback, {
  rootMargin: '-10% 0px -55% 0px',  // top 10% trigger, bottom 55% dead zone
  threshold: 0,
});

// Logic: always pick the TOPMOST currently-intersecting section
const pickActive = () => {
  const first = orderedIds.find(id => intersectingRef.current.has(id));
  if (first) setActiveId(first);
};

// Fallback: if scrolled past all (short last section), pick last
```

**Pill auto-scroll:** When `activeId` changes, the pill scrolls into center view:
```javascript
useEffect(() => {
  const pill = pillsRef.current.querySelector(`[data-id="${activeId}"]`);
  if (pill) pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}, [activeId]);
```

**On pill click → scroll to section:**
```javascript
const scrollToSection = (catId) => {
  setActiveId(catId);
  const el = sectionRefs.current[catId];
  const filterH = filterRef.offsetHeight + headerHeight + obBarHeight + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - filterH;
  programmaticRef.current = true; // suppress observer during scroll
  window.scrollTo({ top, behavior: 'smooth' });
  setTimeout(() => { programmaticRef.current = false; }, 800);
};
```

### URL Update on Category Filter Click

**Menu page:** Uses `navigate()` (React Router) — triggers component remount for SEO:
```javascript
navigate(`/indian-restaurant-menu/${slug}`, { replace: true });
```

**Ordering page:** Uses `window.history.replaceState()` — NO remount, preserves scroll:
```javascript
window.history.replaceState(null, '', `/order-online/sachse-tx/${orderType.toLowerCase()}/${slug}`);
```

### Item Addition — Modifier Control Logic

**In `MenuItemCard`:**

```javascript
const hasModifiers = Array.isArray(item.customization) && item.customization.length > 0;

const handleAddClick = (e) => {
  e.stopPropagation();
  if (hasModifiers) {
    // Items WITH modifiers → navigate to detail page (no direct cart add)
    navigate(`/indian-restaurant-menu/${categorySlug}/${itemSlug}`, { state: { item } });
  } else {
    // Items WITHOUT modifiers → add directly to cart
    dispatch(addToCartAction(item));
  }
};
```

**Visual indicators on card:**
- Items with modifiers show a **modifier badge** (settings icon) on bottom-left of image
- Items with modifiers always show "ADD" button (never qty spinner on card) — clicking ADD navigates to detail page
- Items WITHOUT modifiers show "ADD" initially, then qty spinner (- qty +) after first add

**In `ItemDetailPage` (for items with modifiers):**
- Split layout: LEFT = details + modifier selector, RIGHT = image
- `ModifierSelector` component renders modifier groups as pill buttons
- Each group has: name, Required/Optional badge, min/max limits
- Pill shows: option name | price ("+$1.50" or "Free")
- Radio behavior when `maxRequired === 1`, multi-select otherwise
- Validation: required groups must meet `minRequired` count before "Add to Cart" enables
- `addToCartWithModsAction(item, selectedModifiers, qty)` — stores modifiers with cart line
- If item already in cart: shows "Update Cart" instead of "Add to Cart"
- If qty set to 0 (when already in cart): shows "Remove from Cart"

**Mobile vs Desktop on ItemDetailPage:**
- Desktop: qty controls + Add to Cart in left column
- Mobile: sticky bottom bar with qty spinner + Add to Cart button
- Mobile: back button overlaid on image (top-left)
- Both: favourite heart button

### Home Page — Special Menu Rendering Logic

```javascript
// Home fetches Pickup menu data (same API as menu/ordering pages)
useEffect(() => {
  if (menuOrderType !== 'Pickup' || !rawMenuData) {
    dispatch(getMenuRequest('Pickup'));
  }
}, []);

// Extract specialGroups from menu transformer
const specialGroups = useMemo(() => {
  if (!rawMenuData) return [];
  return transformMenuResponse(rawMenuData).specialGroups || [];
}, [rawMenuData]);
```

**`specialGroups`** come from `menuTransformer.transformMenuResponse()` — items marked as special/exclusive in the menu API data. These render as `ExclusiveItemCard` components in a horizontal scrollable row.

**Home page sections (top to bottom):**
1. Hero banner (full-width background image, "A Modern Taste of India", "Order Now" CTA)
2. Special Menu section (ExclusiveItemCard grid — live from API)
3. About Us section (image + text + badges)
4. Why Choose Us (feature cards + stats)
5. Gallery (CSS grid of food images, click → modal lightbox)
6. FAQ section
7. Footer

### Menu Item Card Grid Structure

```css
/* MenuGrid renders items in CSS grid */
.mn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
```

**Card anatomy (`MenuItemCard`):**
```
┌─────────────────────────┐
│  [IMAGE]                │
│  ♥ (favourite heart)    │ ← top-right of image
│  ⚙ (modifier badge)    │ ← bottom-left of image (if hasModifiers)
│  [ADD] or [- qty +]    │ ← bottom-right of image
│  ── unavail overlay ──  │ ← shown when item unavailable
├─────────────────────────┤
│  Item Name      $12.99  │ ← name + price inline row
│  Description text...    │ ← truncated description
└─────────────────────────┘
```

**Unavailability overlay variants:**
- `isUnAvailableUntil`: clock icon + "Will be available at {time}"
- `isOutOfStock`: ban icon + "Out of Stock"
- `isTemporarilyUnavailable`: X icon + "Temporarily Unavailable"

### Active Orders Bar Alignment

```
┌────────────────────────────────────────────────────────────────┐
│ Header (fixed top)                                             │
├────────────────────────────────────────────────────────────────┤
│ ActiveOrdersBar (below header, only when orders exist)         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │ #ORD-123 │ │ #ORD-456 │ │ #ORD-789 │  ← scrollable pills  │
│ │ In Queue │ │ Preparing│ │ Ready    │                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
├────────────────────────────────────────────────────────────────┤
│ Page content...                                                │
```

- Persisted via redux-persist (survives reload)
- Each pill: order number + status label + order type icon
- Click → navigate to `/order-tracking` with order state
- Removed when order reaches terminal status (delivered, picked up, cancelled)
- Rendered OUTSIDE Layout in App.jsx (always visible across all routes)

### Floating Cart Bar

```
                                        ┌──────────────┐
                                        │  🛒  (3)     │
Page content...                         │              │
                                        └──────────────┘
```

- Fixed bottom-right floating button with cart icon + count badge
- Returns `null` when `totalItemCount === 0` (completely hidden)
- Rendered OUTSIDE Layout in App.jsx (globally visible)
- **Desktop:** Always visible across ALL routes when cart has items
- **Mobile:** Hidden via CSS class `floating-cart--hidden-mobile` on pages where BottomNav is visible (Cart tab covers it). Visible on pages where BottomNav is hidden (`/`, `/about-us`, `/contact`, category pages)
- **Key pattern:** Uses CSS-only mobile hide (not conditional render), so desktop always sees it:
```javascript
const hiddenOnMobile = !isBottomNavHidden(pathname);
// Adds class, doesn't return null
<button className={`floating-cart${hiddenOnMobile ? ' floating-cart--hidden-mobile' : ''}`}>
```

### Mobile Bottom Navigation

**Component:** `BottomNav` — fixed bottom bar on mobile screens.

**Items:**
| Label | Icon | Route | Match Logic |
|-------|------|-------|-------------|
| Home | `fa-house` | `/` | `p === '/'` |
| Menu | `fa-compass` | `/order-online/sachse-tx/pickup` | `p.startsWith('/order-online') \|\| p.startsWith('/indian-restaurant-menu')` |
| Cart | `fa-cart-shopping` | `/cart` | `p === '/cart'` — shows badge with cart count |
| Reserve | `fa-calendar-check` | `/reservation` | `p === '/reservation'` — **only shown if reservation enabled** |
| Profile | `fa-user` | `/account` | `p === '/account'` |

**Hidden on routes:** `/`, `/about-us`, `/contact`, `/indian-restaurant-menu/:categorySlug` (single segment only)

**Reservation visibility:**
```javascript
const reservationEnabled = isReservationEnabledByBranch(slugData);
const NAV_ITEMS = BASE_NAV_ITEMS.filter(
  (item) => !item.reservationOnly || reservationEnabled
);
```

This reads `slugData.branch[matchedBySlug].serviceDisable.isReservation` — if truthy, Reserve tab appears.

### Reservation Availability (Branch Slug Guard)

```javascript
// src/utils/branchConfig.js
export function isReservationEnabledByBranch(slugData, merchantSlug = VITE_MERCHANT_SLUG) {
  const branch = getMatchedBranchByMerchantSlug(slugData, merchantSlug);
  return isTruthy(branch?.serviceDisable?.isReservation);
}

// In App.jsx:
<Route
  path="/reservation"
  element={isReservationEnabled ? <ReservationPage /> : <Navigate to="/" replace />}
/>
```

- If `isReservation` is NOT truthy for this branch → `/reservation` redirects to `/`
- BottomNav hides "Reserve" tab
- Header nav hides "Reservation" link

### Responsive Patterns Across All Routes

**Breakpoints (mobile-first):**
- **Mobile** (< 768px): single column, stacked layouts, bottom nav visible
- **Tablet** (768px–1024px): two columns where applicable
- **Desktop** (> 1024px): full multi-column layouts, bottom nav hidden

**Route-specific responsive behavior:**

| Route | Mobile | Desktop |
|-------|--------|---------|
| Menu / Ordering | Single column card grid, sticky filter at top | Multi-column grid (auto-fill 280px min) |
| Item Detail | Image on top, details below, sticky bottom bar for qty/add | Split layout: left=details, right=image |
| Cart | Stacked: items → totals → CTA | Same (single column always) |
| Checkout | Stacked: payment → address → summary → CTA | Two-column: right=payment/address, left=summary/items |
| Order Tracking | Stacked: hero → timeline → summary → location | Two-column grid: left=timeline, right=summary+location |
| Reservation | Stacked: left panel → right panel | Two-column: left=booking form, right=restaurant info (sticky) |
| Favourites | Single column card grid | Multi-column grid |
| Orders | Single column order cards | Same |
| Account | Stacked sections | Same |

---

## Complete Component Reference

Every file in `src/components/` — 18 components (each with `.jsx` + `.css`):

### 1. `Header` (`header/header.jsx`)

Fixed top navigation bar. Reads auth state + slug for conditional rendering.

- **Desktop:** Logo | Home, About, Menu, Contact (links) | "RESERVE A TABLE" button (if enabled) | "ORDER NOW" button | User icon
- **Mobile:** Logo | Hamburger → slide-out nav with overlay + mobile-only button group
- **Reservation button:** Only shown when `isReservationEnabledByBranch(slugData)` is true
- **User button:** Shows display name when logged in, "User" when guest
- **`header--bnav` class:** Added when BottomNav is visible (adjusts bottom padding)

### 2. `BottomNav` (`bottomNav/BottomNav.jsx`)

Mobile-only fixed bottom navigation. 5 items: Home, Menu, Cart (with badge), Reserve (conditional), Profile.

- **Hidden on:** `/`, `/about-us`, `/contact`, `/indian-restaurant-menu/:singleSegment`
- **Reserve tab:** Only when `isReservationEnabledByBranch(slugData)` returns true
- **Cart badge:** Shows `cartLines.reduce(sum + qty)`, max display "99+"
- **Active state:** Uses `match(pathname)` function per item

### 3. `ActiveOrdersBar` (`ActiveOrdersBar/ActiveOrdersBar.jsx`)

Scrollable pill bar below header showing in-progress orders.

- **Rendered outside Layout** in App.jsx (visible on all routes)
- Reads `state.activeOrders.orders` (persisted via redux-persist)
- Each pill: order number + `resolveStatusLabel()` + order type icon (DeliveryIcon or store icon)
- Click → navigate to `/order-tracking` with order state
- Hidden when no active orders

### 4. `FloatingCart` (`floatingCart/FloatingCart.jsx`)

Floating cart button (bottom-right on desktop).

- **Rendered outside Layout** in App.jsx
- Shows when `totalItemCount > 0` (never renders if cart is empty)
- Displays: cart icon + item count badge
- Click → navigate to `/cart`
- **Mobile visibility:** On pages where BottomNav is visible, the FloatingCart gets class `floating-cart--hidden-mobile` (CSS hides it on mobile only). On pages where BottomNav is hidden (`/`, `/about-us`, `/contact`, category pages), FloatingCart is visible on both mobile and desktop.
- **Key:** It no longer returns `null` when BottomNav is visible — instead it renders with a CSS-only hide so desktop always sees the floating cart button across all routes.

### 5. `OrderingBar` (`orderingBar/OrderingBar.jsx`)

Order type toggle + search + available-now filter. **Only on ordering page, NOT on menu page.**

- **Props:** `orderType, onOrderTypeChange, availableNow, onAvailableNowChange, searchQuery, onSearchChange`
- **Structure:** Pickup/Delivery toggle buttons | Search input | "Available Now" checkbox
- **CSS class:** `.ob-wrap` (used for height calculation in scroll offset)

### 6. `CategoryFilter` (`categoryFilter/CategoryFilter.jsx`)

Horizontally scrollable category pill bar. **On both menu and ordering pages.**

- **Props:** `loading, activeId, sectionCats, hasExclusive, getCategoryCount, onSelect, filterRef, pillsRef`
- **Loading state:** `CategoryFilterShimmer` placeholder
- **Each pill:** Category name + item count badge, `data-id` attribute for auto-scroll
- **"Today's Exclusive" pill:** Shown when `hasExclusive` is true (always first pill)
- **Sticky behavior:** Sticks below header + OrderingBar (if present) via CSS `position: sticky`

### 7. `MenuGrid` (`menuGrid/MenuGrid.jsx`)

Grid of menu items grouped by category with section headers.

- **Props:** `loading, error, sectionCats, grouped, hasExclusive, exclusiveItems, sectionRefs, emptyMessage`
- **Loading state:** `MenuItemCardShimmer` grid
- **Structure per category:** Section header (with `ref` for IntersectionObserver via `sectionRefs`) → SubCategory headers (if any) → `MenuItemCard` grid
- **"Today's Exclusive" section:** Rendered first when `hasExclusive`, uses `TodaysExclusive` component
- **Each section has `data-cat-id` attribute** for IntersectionObserver matching

### 8. `MenuItemCard` (`menuItemCard/MenuItemCard.jsx`)

Individual menu item card. Core card component used in MenuGrid.

- **Props:** `item, categorySlug`
- **Card anatomy:** Image (with favourite heart, modifier badge, ADD/qty control) → Name + Price → Description
- **Modifier logic:** `hasModifiers = item.customization.length > 0`
  - WITH modifiers: ADD always navigates to detail page, modifier badge shown
  - WITHOUT modifiers: ADD dispatches `addToCartAction`, then shows qty spinner
- **Favourite toggle:** Heart icon top-right, dispatches `addFavouriteRequest` / `removeFavouriteRequest`
- **Unavailability overlay:** 3 variants (timed, out of stock, temporarily unavailable)
- **Click card:** Navigates to `/indian-restaurant-menu/{categorySlug}/{itemSlug}` with `state: { item }`

### 9. `ExclusiveItemCard` (`exclusiveItemCard/ExclusiveItemCard.jsx`)

Card for exclusive/special items. Similar to MenuItemCard but with overlay design.

- **Props:** `item`
- Full-bleed image with name + price + description overlay at bottom
- Same modifier logic as MenuItemCard (ADD navigates to detail if hasModifiers)
- Click → navigates to `/indian-restaurant-menu/todays-exclusive/{itemSlug}` with `state: { item }`

### 10. `TodaysExclusive` (`todaysExclusive/TodaysExclusive.jsx`)

Horizontal slider of ExclusiveItemCard components.

- **Props:** `items`
- Returns null if no items
- Structure: "Today's Exclusive" header → horizontal scroll container → ExclusiveItemCard per item

### 11. `ItemDetail` (`ItemDetail/ItemDetail.jsx`)

Modal/overlay item detail panel (basic version — NOT the full page).

- **Props:** `item, onClose`
- Slide-up panel with overlay backdrop
- Shows: image, name, subtitle, description, price, "Add to Order" CTA
- Locks body scroll on mount (`document.body.style.overflow = 'hidden'`)
- **Note:** The full item detail page is `pages/itemDetail/ItemDetailPage.jsx` (separate from this component)

### 12. `PageHero` (`pageHero/PageHero.jsx`)

Full-width hero banner with gradient overlay. **Used on menu page, NOT ordering page.**

- **Props:** `backgroundImage, overline, title, description, children`
- Structure: Background image → gradient overlay → decorative rule → overline → h1 → description

### 13. `AddressModal` (`addressModal/AddressModal.jsx`)

Overlay modal for adding new delivery addresses.

- **Props:** `isOpen, onClose`
- **Uses:** `use-places-autocomplete` for Google Places address autocomplete
- **Fields:** Address autocomplete → Address Line 1, Line 2, City, State, Zip, Country → Tag selector (Home/Work/Other)
- **Save:** Dispatches `saveAddressRequest()` → saga calls API → auto-refetches address list
- **State from Redux:** `state.address.mutating` (loading), `state.address.mutateError`

### 14. `AuthModal` (`authModal/AuthModal.jsx`)

3-step OTP authentication modal.

- **Props:** `isOpen, onClose`
- **Step 1:** Phone input → "Send OTP" → dispatches `requestOtp(phone)`
- **Step 2:** 6-digit OTP → "Verify" → dispatches `verifyOtp(phone, otp)`
- **Step 3 (new users only):** Registration form (firstName, lastName, email) → dispatches `registerUser(data)`
- **Closes on:** `state.auth.step === 'done'` OR `state.auth.isLoggedIn`
- **Reset on close:** dispatches `resetAuthModal()`

### 15. `Toast` (`toast/Toast.jsx`)

Floating notification at bottom of screen.

- **Props:** `message, visible, onHide`
- Auto-hides after timeout
- Used in Checkout for delivery quote failure: "Unable to deliver to this location!"

### 16. `FaqSection` (`faqSection/FaqSection.jsx`)

Accordion FAQ component with structured data (JSON-LD `FAQPage` schema).

- **Props:** `kicker, title, intro, items[], className, backgroundImage, hasBackgroundOverlay, initialOpenIndex`
- **Each item:** question (button) + answer (collapsible div)
- **`answerSegments` pattern:** Supports mixed text + `<Link>` elements for SEO-rich FAQ answers
- **Structured data:** Auto-generates `<script type="application/ld+json">` with `FAQPage` schema

### 17. `DeliveryIcon` (`DeliveryIcon/DeliveryIcon.jsx`)

Simple wrapper for delivery truck icon.

```javascript
export default function DeliveryIcon({ size = 14 }) {
  return <i className="fa-solid fa-truck-fast" style={{ fontSize: size }} />;
}
```

Used in: OrderTracking timeline, ActiveOrdersBar pills, Checkout order type badge.

### 18. `ScrollToTop` (`scrollToTop/ScrollToTop.jsx`)

Scroll-to-top on route change.

```javascript
useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}, [pathname, search]);
```

Rendered once in App.jsx inside `<BrowserRouter>`.

---

---

### Pages Reference (`src/pages/`)

| Page | File | Route | Key Behavior |
|------|------|-------|-------------|
| `Home` | `home/home.jsx` | `/` | Hero banner, Special Menu (from API `specialGroups`), About, Why Us, Gallery (with lightbox modal), FAQ |
| `Menu` | `menu/menu.jsx` | `/indian-restaurant-menu` | PageHero + CategoryFilter + MenuGrid. Pickup-only. Filter click → `navigate()` for SEO |
| `MenuCategoryRouter` | `menuCategory/MenuCategoryRouter.jsx` | `/indian-restaurant-menu/:categorySlug` | Checks `menuLandingPagesBySlug[slug]` — if match, renders SEO landing page; else renders category-filtered menu |
| `menuCategory` | `menuCategory/menuCategory.jsx` | (rendered by MenuCategoryRouter) | SEO landing page: hero image, overview, chips, feature points, FAQ section, CTA, then filtered MenuGrid |
| `Ordering` | `ordering/ordering.jsx` | `/order-online/sachse-tx/:orderType(/:catSlug)` | OrderingBar + CategoryFilter + MenuGrid. Pickup/Delivery toggle. Filter click → `replaceState()` (no remount) |
| `ItemDetailPage` | `itemDetail/ItemDetailPage.jsx` | `/indian-restaurant-menu/:cat/:item` | Split layout: LEFT details+modifiers, RIGHT image. Mobile sticky bottom bar. Modifier validation |
| `Cart` | `cart/Cart.jsx` | `/cart` | Cart items list, order type toggle, qty controls, totals, validation, "Proceed to Checkout" CTA |
| `Checkout` | `checkout/Checkout.jsx` | `/checkout` | Two-column: address selection (delivery), payment, totals, place order CTA. Card form with reCAPTCHA |
| `OrderTracking` | `order-tracking/OrderTracking.jsx` | `/order-tracking` | Hero ETA, timeline steps, order summary card, location card |
| `Orders` | `orders/Orders.jsx` | `/orders` | Past orders list with order cards (number, date, type, items, total, status badge) |
| `Favourites` | `favourites/Favourites.jsx` | `/favourites` | Grid of MenuItemCard for favourited items. Fetches from API on mount. Empty state |
| `Account` | `account/Account.jsx` | `/account` | User profile (name, email, phone). Links to Orders, Favourites, Saved Address. Sign In/Out |
| `SavedAddress` | `savedAddress/SavedAddress.jsx` | `/saved-address` | List of saved addresses with edit/delete. Add new via AddressModal |
| `ReservationPage` | `reservation/Reservation.jsx` | `/reservation` | 3-step booking: Step1 (party+date+time), Step2 (details form), Step3 (confirmed/cancel). Two-column with RightPanel |
| `About` | `about/about.jsx` | `/about-us` | Static about page |
| `Contact` | `contact/contact.jsx` | `/contact` | Static contact page |

### Shimmer Components (`src/shimmer/`)

| Component | Used By | Purpose |
|-----------|---------|---------|
| `CategoryFilterShimmer` | CategoryFilter (loading state) | Placeholder shimmer for filter pills |
| `MenuItemCardShimmer` | MenuGrid (loading state) | Placeholder shimmer for menu cards |

---

## Gotchas & Edge Cases

1. **Checkout receives state via `useLocation().state`**: If user refreshes checkout page, `loc.state` is lost. The page falls back to Redux state for cartLines.

2. **Delivery fee patching**: Checkout manually patches delivery fee into the totals array (code '4') and recalculates grand total (code '5'). This happens both in `displayTotals` memo and in the order payload builder.

3. **reCAPTCHA widget scaling**: The native widget is 304x78px. `fitRecaptchaToContainer()` scales it down for mobile. Must re-run on resize.

4. **Card form state isolation**: `showCardForm` is separate from `paymentMethod`. User must first select "Card" checkbox, then click "Add New Card" to reveal the form.

5. **Address quote flow**: Selecting a delivery address is a multi-step async process: clear previous quote → request new quote → on success: confirm address + refetch totals with fee → on failure: reject address + show toast.

6. **Active orders bar height**: Timeline and hero calculations account for the active orders bar height when computing scroll offsets.

7. **Image error fallback**: All image components have `onError` handlers that swap to `placeHolderMedia.jpg`.

8. **Order type toggle**: Changing order type on Cart page triggers totals refetch but does NOT re-validate cart items (validation only happens on mount).

---

## Checklist

- [ ] `/indian-restaurant-menu` has PageHero + CategoryFilter + MenuGrid (NO OrderingBar)
- [ ] `/order-online/sachse-tx/:orderType` has OrderingBar + CategoryFilter + MenuGrid (NO hero)
- [ ] OrderingBar shows Pickup/Delivery toggle, search, "Available Now" filter
- [ ] Category filter auto-highlights via IntersectionObserver (`rootMargin: '-10% 0px -55% 0px'`)
- [ ] Filter pill click scrolls to section with programmatic scroll guard (800ms)
- [ ] Menu page filter click → `navigate()` (for SEO remount)
- [ ] Ordering page filter click → `window.history.replaceState()` (no remount)
- [ ] URL updates to `/:orderType/:categorySlug` on filter click
- [ ] Items with modifiers: ADD button always shown (never qty spinner on card), navigates to detail page
- [ ] Items without modifiers: ADD → qty spinner (- qty +) on card after first add
- [ ] Modifier badge (settings icon) shown on card for items with `customization.length > 0`
- [ ] ItemDetailPage: split layout (left=details, right=image on desktop)
- [ ] ItemDetailPage: ModifierSelector with pill buttons, Required/Optional badges, min/max validation
- [ ] ItemDetailPage: mobile sticky bottom bar for qty/add
- [ ] ItemDetailPage: "Update Cart" / "Remove from Cart" labels when item already in cart
- [ ] Home page: Special Menu section renders `specialGroups` from `transformMenuResponse().specialGroups`
- [ ] Home page fetches Pickup menu on mount for special items
- [ ] ActiveOrdersBar rendered outside Layout (visible across all routes)
- [ ] FloatingCart rendered outside Layout (visible when cart has items)
- [ ] BottomNav: 5 items (Home, Menu, Cart+badge, Reserve, Profile)
- [ ] BottomNav: Reserve tab only shown when `isReservationEnabledByBranch(slugData)` is true
- [ ] BottomNav: hidden on `/`, `/about-us`, `/contact`, single-segment category pages
- [ ] Reservation route guarded: redirects to `/` if reservation not enabled for branch
- [ ] Menu page shows shimmer loading states before data arrives
- [ ] Category filter pills scroll horizontally and highlight on intersection
- [ ] Menu items show price, image (with fallback), add-to-cart button
- [ ] Cart page shows qty controls, line totals, and unavailable item indicators
- [ ] Cart totals update in real-time with 400ms debounce
- [ ] Checkout has two-column layout (stacks on mobile)
- [ ] Delivery checkout shows address list with quote validation
- [ ] Address modal opens for adding new delivery addresses
- [ ] Payment section toggles between Pay at Store/Delivery and Card
- [ ] Card form validates all fields before allowing submission
- [ ] reCAPTCHA widget renders and scales responsively
- [ ] Place Order button shows loading spinner while placing
- [ ] Error messages animate in with framer-motion
- [ ] Order tracking shows correct timeline step for each status code
- [ ] Cancelled orders show cancellation illustration (SVG store with X overlay)
- [ ] ETA displays with timezone-aware formatting
- [ ] Active orders bar appears globally with order pills
- [ ] Floating cart bar appears on ordering pages with cart summary
- [ ] Toast notifications work for delivery errors
- [ ] All images fall back to placeholder on error
- [ ] Empty states show for: empty cart, no addresses, no orders
