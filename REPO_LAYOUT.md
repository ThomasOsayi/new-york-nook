# New York Nook — Repo Layout & Implementation Summary

## File Structure (Tree)

```
new-york-nook/
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── REPO_LAYOUT.md          ← this file
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── api/
    │   │   └── consultation/
    │   │       └── route.ts
    │   ├── catering/
    │   │   └── page.tsx
    │   ├── login/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── dashboard/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── orders/
    │   │   │   └── page.tsx
    │   │   ├── catering/
    │   │   │   └── page.tsx
    │   │   └── inventory/
    │   │       └── page.tsx
    │   └── order/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── checkout/
    │       │   └── page.tsx
    │       └── confirmation/
    │           └── page.tsx
    │
    ├── components/
    │   ├── CateringSection.tsx
    │   ├── ContactSection.tsx
    │   ├── Footer.tsx
    │   ├── GallerySection.tsx
    │   ├── Hero.tsx
    │   ├── MenuSection.tsx
    │   ├── Navbar.tsx
    │   ├── OrderSection.tsx
    │   ├── ReservationSection.tsx
    │   ├── SigDishes.tsx
    │   └── order/
    │       ├── Cartcontext.tsx
    │       ├── CartSidebar.tsx
    │       ├── Menubrowser.tsx
    │       ├── OrderHeader.tsx
    │       └── OrderHero.tsx
    │
    ├── data/
    │   ├── gallery.ts
    │   ├── menu.ts
    │   └── signatures.ts
    │
    ├── lib/
    │   ├── auth.ts
    │   ├── consultation.ts
    │   ├── firebase.ts
    │   └── order.ts
    │
    └── hooks/
        ├── useInView.ts
        └── useScrollY.ts
```

---

## Implementation Summary

### Stack & Tooling

| Tech | Version |
|------|---------|
| **Next.js** | 16.1.6 (App Router) |
| **React** | 19.2.3 |
| **TypeScript** | 5.9.3 |
| **Tailwind CSS** | ^4 |
| **Framer Motion** | ^12.33.0 |
| **Firebase** | Firestore + Auth (Firebase JS SDK) |
| **Resend** | Email API (catering inquiry notifications) |
| **clsx** | ^2.1.1 |
| **ESLint** | ^9 (eslint-config-next 16.1.6) |

---

### Routes

| Route | Description |
|-------|-------------|
| **`/`** | Home: single-page site with all sections (Hero, Signature Dishes, Menu, Gallery, Order, Catering, Reservations, Contact, Footer). |
| **`/order`** | Takeout order flow: menu browser + cart sidebar; add items, set pickup time, special instructions, promo; “Proceed to Checkout” links to `/order/checkout`. |
| **`/order/checkout`** | Checkout form: customer info (first name, last name, phone, email), order summary, tip (15/18/20/25% or custom), subtotal/tax/packaging/tip/total. Submits order to Firestore via `createOrder`, clears cart, redirects to confirmation. No payment processor (Stripe, etc.) — order is stored only. |
| **`/order/confirmation`** | Order confirmation: expects query `id` (Firestore doc ID) and `order` (order number). Fetches order via `getOrder(orderId)`; shows order number, status, items, totals, pickup time; “Back to Home” / “Order Again”. Loading and error states. |
| **`/login`** | Staff login: email + password form; `signIn()` from `auth.ts` (Firebase Auth, whitelist `ALLOWED_EMAILS`). On success redirect to `/dashboard`. Error handling for invalid credentials, unauthorized, too-many-requests. |
| **`/dashboard`** | Redirects to `/dashboard/orders`. |
| **`/dashboard/orders`** | Kitchen orders dashboard: real-time Firestore `onSnapshot`; order list with filter tabs (Active, Pending, Preparing, Ready, Completed); stats; order detail panel with status progression and Cancel; `updateDoc` for status changes. No auth middleware. |
| **`/dashboard/catering`** | Catering inquiries dashboard: real-time Firestore `onSnapshot` on `consultations`; filter tabs (All, New, Contacted, Tasting, Confirmed, Completed); stats (new, pipeline value estimate); inquiry detail panel with status progression (New → Contacted → Tasting → Confirmed → Completed); Cancel; `updateDoc` for status changes. |
| **`/dashboard/inventory`** | Menu item status dashboard: real-time Firestore `onSnapshot` on `inventory`; items from `menu.ts` with status (Available, Running Low, Out); category filter, search; single-item status change via `setDoc`; “Reset All” via `writeBatch`; activity log (session); toast notifications. |
| **`/catering`** | Full catering page: hero, services (Private Dining, Corporate, Wedding, Custom Menus), experience highlights, pricing packages (Zakuski $85, Tsar $165, Grand Feast $250), sample menu, gallery, FAQ, consultation form modal. Form POSTs to `/api/consultation`; saves to Firestore; sends email via Resend; success state with reference number. Navbar with links to home sections and `/catering`. |

---

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| **`/api/consultation`** | POST | Catering inquiry: validates firstName, lastName, email, phone, eventType; saves to Firestore `consultations` via `createConsultation()`; sends HTML email to `CONSULTATION_NOTIFY_EMAIL` via Resend; returns `{ id, referenceNumber }`. Reference format `NYN-C-MMDD-XXXX`. |

---

### App Shell

- **`layout.tsx`** — Root layout with metadata (title, description, OpenGraph). Brand: *New York Nook \| Fine Russian Cuisine in Hollywood*.
- **`page.tsx`** — Home page: single-page layout with section refs and smooth scroll navigation between sections (Hero → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer).
- **`order/layout.tsx`** — Order layout: wraps all `/order/*` routes in `CartProvider` so cart state is shared across order, checkout, and confirmation.
- **`order/page.tsx`** — Order page at `/order`: two-column layout (Menubrowser + CartSidebar); responsive grid (sidebar becomes bottom sheet on ≤900px).
- **`order/checkout/page.tsx`** — Checkout at `/order/checkout`: full checkout form and order summary; calls `createOrder()` with cart + customer + tip; redirects to `/order/confirmation?id=...&order=...`.
- **`order/confirmation/page.tsx`** — Confirmation at `/order/confirmation`: reads `id` and `order` from query; fetches order with `getOrder(id)`; displays order details or error.
- **`catering/page.tsx`** — Full catering page at `/catering`: hero, services, packages, menu samples, gallery, FAQ; consultation form in modal; submits to `/api/consultation`; success shows reference number.
- **`login/layout.tsx`** — Passthrough layout (no wrapper).
- **`login/page.tsx`** — Login form; `signIn()`; redirect to `/dashboard` on success.
- **`dashboard/page.tsx`** — Server redirect to `/dashboard/orders`.
- **`dashboard/layout.tsx`** — Sidebar nav (Orders, Inventory, Staff, Analytics, Settings); collapsible; logo links to `/`; Sign Out → `signOut()` + redirect to `/login`. Only Orders has a page; others 404.
- **`dashboard/orders/page.tsx`** — Orders management: real-time list, filters, stats, order detail, status updates via Firestore `updateDoc`.
- **`globals.css`** — CSS custom properties for brand palette (gold, gold-light, gold-dark, bg-primary, bg-secondary, bg-tertiary, bg-elevated); typography (Playfair Display, DM Sans, Lora); form resets; shared button classes (`.btn-gold-outline`, `.btn-gold-filled`); keyframe animations (`fadeSlideIn`, `fadeUp`, `scrollBounce`, `heroFloat`); scrollbar styling; responsive breakpoints (≈900px).

---

### Sections & Components

| Section | File | What It Does |
|---------|------|--------------|
| **Navbar** | `Navbar.tsx` | Fixed nav; scroll-based background/blur/border; logo (N diamond + “NEW YORK NOOK”); desktop links + mobile hamburger with full-screen overlay; smooth scroll to sections; `useScrollY` for scroll state. |
| **Hero** | `Hero.tsx` | Full-height hero with parallax background, animated tagline/title/subtitle, CTAs (Reserve, Order, Menu), floating accent images (desktop), scroll indicator. |
| **Signature Dishes** | `SigDishes.tsx` | Two-column section with auto-rotating carousel of signature dishes; prev/next buttons and indicator dots; `useInView` reveal. |
| **Menu** | `MenuSection.tsx` | Category tabs with images (Cold Appetizers, Salads, Soups, etc.); sticky image + scrolling menu items; prices (or “MP” for market price); `fadeSlideIn` on items. |
| **Gallery** | `GallerySection.tsx` | Masonry-style grid with variable row spans; hover overlays; lightbox with prev/next and close; `useInView` reveal. |
| **Order** | `OrderSection.tsx` | Three-step explainer (Browse & Select → Customize & Pay → Pickup & Enjoy); full-width background image; `useInView` reveal; “Start Your Order” CTA links to `/order`. |
| **Catering** | `CateringSection.tsx` | Image grid + copy; services list (Private Dining, Corporate, Wedding, Custom Menus); “View Packages” links to `/catering`; “Inquire Now” button (placeholder). |
| **Reservations** | `ReservationSection.tsx` | Form: name, phone, date picker, time slots (5:00–9:30 PM), party size (1–8+); success state with confirmation message; copy (Tue–Sun 5–11 PM, parties 8+ call, smart casual); `useInView` reveal. |
| **Contact** | `ContactSection.tsx` | Three blocks: Location (7065 Sunset Blvd), Reservations (tel link), Hours (Tue–Sun 5–11 PM); embedded Google Maps iframe (7065 Sunset Blvd); overlay with “Get Directions” link; `useInView` reveal. |
| **Footer** | `Footer.tsx` | Brand block with logo and tagline; three link columns (Navigate: Menu, Gallery, Reservations, Order Online, Catering; Connect: Instagram, Facebook, Yelp, Google; Info: Private Events, Gift Cards, Press, **Login**); Login links to `/login`; others placeholder `#`; copyright; address (7065 Sunset Blvd). |

---

### Order Page (`/order`)

| Component | File | What It Does |
|-----------|------|--------------|
| **Cart context** | `Cartcontext.tsx` | React context: `CartItem` (name, price, img, categoryKey, desc?, qty); `addItem`, `updateQty`, `removeItem`, `clearCart`; `useCart()` hook. Add/update by name + categoryKey. |
| **Order header** | `OrderHeader.tsx` | Sticky header with scroll-based background/blur; logo + “Back to Menu” link to `/`; pickup badge “25–35 min”; “View Order” cart button with item count. Uses `useScrollY`, `useCart`. |
| **Order hero** | `OrderHero.tsx` | Hero strip with background image, gradient overlay; label “Takeout & Pickup”, title “Build Your Order”, short copy; star rating + “4.9 · 320+ reviews · Open until 11 PM”; `useInView` reveal. |
| **Menu browser** | `Menubrowser.tsx` | Category tabs from `menu.ts` (Cold Appetizers, Salads, Soups, Hot Appetizers, Main Course, Desserts, Drinks); scrollable menu grid; item cards with image, name, description, price, tags (popular, new, spicy, gf, v); add-to-cart / inline qty stepper; toast on add. Uses `useCart`, `categories`, `menuData`. |
| **Cart sidebar** | `CartSidebar.tsx` | Sticky sidebar (desktop) / bottom sheet (mobile ≤900px). “Your Order” header + item count; pickup time options (ASAP 25–35 min, Today 6:30 PM, 7:00 PM); scrollable cart list with qty +/- and remove; promo code input + Apply; “Add special instructions” expandable textarea; subtotal, tax 9.5%, packaging $2, total; “Proceed to Checkout” links to `/order/checkout`. Empty state “Add items to get started”. |

---

### Lib / Backend

| File | Purpose |
|------|---------|
| **`auth.ts`** | Firebase Auth: `signIn(email, password)` — whitelist `ALLOWED_EMAILS` (e.g. `nook@gmail.com`); rejects non-whitelisted before/after auth; `signOut()`. Used by login page and dashboard layout. |
| **`consultation.ts`** | `ConsultationData` interface; `createConsultation(data)` → writes to Firestore `consultations` collection with `status: "new"`; returns `{ id, referenceNumber }` (format `NYN-C-MMDD-XXXX`). Used by `/api/consultation`. Dashboard catering reads and updates status via `updateDoc`. |
| **`firebase.ts`** | Firebase app init (singleton via `getApps()`); Firestore `db` export. Config from env: `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`. Use `.env.local` (gitignored). |
| **`order.ts`** | Order persistence: `OrderItem`, `OrderData` interfaces; `createOrder(data)` → writes to Firestore `orders` collection, returns `{ id, orderNumber }` (order number format `NYN-MMDD-XXXX`); `getOrder(orderId)` → fetches by doc ID, returns order or null. Dashboard uses Firestore `updateDoc` directly for status changes. |

---

### Data Layer

| File | Contents |
|------|----------|
| **`menu.ts`** | 7 categories: Cold Appetizers (12), Salads (5), Soups (4), Hot Appetizers (10), Mains (7), Desserts (5), Drinks (7). 50 items with name, desc, price, img, optional tags (`popular`, `new`, `spicy`, `gf`, `v`). `MenuItem` & `MenuCategory` interfaces. Used by `MenuSection` and order `Menubrowser`. |
| **`signatures.ts`** | 6 signature dishes (Beef Stroganoff, Lobster Bisque, Ribeye Steak, Crepes with Caviar, Rack of Lamb, Grilled Octopus) with name, description, image URL. SignatureDish interface. |
| **`gallery.ts`** | 12 gallery images with labels; `gallerySpans` array for masonry row-span (2,1,1,2,1,2,1,1,2,1,1,2). GalleryImage interface. |

---

### Hooks

| Hook | Purpose |
|------|---------|
| **`useInView`** | IntersectionObserver-based; returns `[ref, visible]` for scroll-triggered reveals. Optional threshold (default 0.12). One-shot: once visible, stays true. |
| **`useScrollY`** | Tracks `window.scrollY` for parallax and nav state. |

---

### Styling & Theming

- **Colors** — Gold `#C9A050`, dark backgrounds (`#080603`, `#0C0A07`, `#0A0806`).
- **Fonts** — Playfair Display (display), DM Sans (body), Lora (accent).
- **Tailwind** — `tailwind.config.ts` extends theme with `gold`, `brand`, and font families.
- **Responsive** — Mobile-first; nav switches to hamburger, grids collapse, hero floats hidden on small screens.

---

### TODOs in Codebase

1. **layout.tsx** — Add OG image URL; add `metadataBase` for real domain.
2. **OrderSection.tsx** — “Start Your Order” is wired to `/order`. No further change needed for navigation.
3. **CartSidebar.tsx** — “Proceed to Checkout” is wired to `/order/checkout`. Done.
4. **Checkout** — Orders are stored in Firestore only; no payment processor (Stripe, Square, etc.) integrated. Add payment if required.
5. **Dashboard auth** — `/dashboard` has no middleware or layout guard; anyone can visit. Add `onAuthStateChanged` redirect to `/login` or Next.js middleware if protection needed.
6. **Dashboard nav** — Inventory, Staff, Analytics, Settings links 404; only Orders page exists.
7. **CateringSection.tsx** — “View Packages” links to `/catering`. “Inquire Now” is placeholder; full form is on `/catering` page.
8. **ReservationSection.tsx** — Replace mock submit with real backend (OpenTable, Resy, or custom API).
9. **ContactSection.tsx** — Google Maps embed implemented; placeholder removed.
10. **signatures.ts** — Replace Unsplash placeholders with real food photos.
11. **gallery.ts** — Replace with real restaurant photography.
12. **next.config.ts** — Add production image CDN hostname.

---

### Navigation Flow

1. **Home page** (`/`): Hero (Home) → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer.
2. **Order flow**: `/order` (browse + cart) → CartSidebar “Proceed to Checkout” → `/order/checkout` (form + place order) → `createOrder()` → redirect to `/order/confirmation?id=<docId>&order=<orderNumber>` → confirmation page fetches order with `getOrder(id)`.
3. **Order layout**: All `/order/*` routes share `CartProvider` (order layout).
4. **Nav links (home)**: “Order” → `router.push("/order")`, “Catering” → `router.push("/catering")`. Other nav items smooth-scroll on home.
5. **Hero CTAs**: “Reserve a Table” → scroll to Reserve, “Order Takeout” → scroll to Order section, “View Menu” → scroll to Menu.
6. **OrderSection**: “Start Your Order →” links to `/order`.
7. **Footer links**: Login links to `/login`; others placeholder `#`.
8. **Login flow**: Footer “Login” or direct `/login` → sign in (whitelisted email) → redirect to `/dashboard` (→ `/dashboard/orders`). Dashboard “Sign Out” → `signOut()` → redirect to `/login`. Dashboard sidebar: Orders → `/dashboard/orders`, Catering → `/dashboard/catering`, Inventory → `/dashboard/inventory`; Staff, Analytics, Settings 404.
9. **Catering flow**: CateringSection “View Packages” → `/catering`; Navbar “Catering” → `/catering`; catering page “Request Consultation” opens modal; form POSTs to `/api/consultation` → Firestore + Resend email → success with reference number.

---

### Image Sources

- **Current**: Unsplash (restaurant/food) for hero, gallery, menu, catering, order, reservations.
- **Config**: `next.config.ts` (CommonJS) allows `images.unsplash.com`; TODOs for real CDN.

---

### Config Files & Environment

| File | Purpose |
|------|---------|
| `next.config.ts` | Image remote patterns (Unsplash). |
| `tailwind.config.ts` | Content paths, theme extend (colors, fonts). |
| `tsconfig.json` | TypeScript paths (`@/` → `src/`). |
| `eslint.config.mjs` | ESLint flat config. |
| `postcss.config.mjs` | PostCSS + Tailwind. |
| `.env.local` | Firebase env vars (gitignored): `NEXT_PUBLIC_FIREBASE_*`; Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`; catering: `CONSULTATION_NOTIFY_EMAIL` (recipient for inquiry emails). |

---

*Generated from repo structure and source code.*
