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
| **Firebase** | Firestore (Firebase JS SDK) |
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

---

### App Shell

- **`layout.tsx`** — Root layout with metadata (title, description, OpenGraph). Brand: *New York Nook \| Fine Russian Cuisine in Hollywood*.
- **`page.tsx`** — Home page: single-page layout with section refs and smooth scroll navigation between sections (Hero → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer).
- **`order/layout.tsx`** — Order layout: wraps all `/order/*` routes in `CartProvider` so cart state is shared across order, checkout, and confirmation.
- **`order/page.tsx`** — Order page at `/order`: two-column layout (Menubrowser + CartSidebar); responsive grid (sidebar becomes bottom sheet on ≤900px).
- **`order/checkout/page.tsx`** — Checkout at `/order/checkout`: full checkout form and order summary; calls `createOrder()` with cart + customer + tip; redirects to `/order/confirmation?id=...&order=...`.
- **`order/confirmation/page.tsx`** — Confirmation at `/order/confirmation`: reads `id` and `order` from query; fetches order with `getOrder(id)`; displays order details or error.
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
| **Catering** | `CateringSection.tsx` | Image grid + copy; services list (Private Dining, Corporate, Wedding, Custom Menus); “Inquire Now” CTA. |
| **Reservations** | `ReservationSection.tsx` | Form: name, phone, date picker, time slots (5:00–9:30 PM), party size (1–8+); success state with confirmation message; copy (Tue–Sun 5–11 PM, parties 8+ call, smart casual); `useInView` reveal. |
| **Contact** | `ContactSection.tsx` | Three blocks: Location (7065 Sunset Blvd), Reservations (tel link), Hours (Tue–Sun 5–11 PM); map placeholder with “Open in Maps” link to Google Maps; `useInView` reveal. |
| **Footer** | `Footer.tsx` | Brand block with logo and tagline; three link columns (Navigate: Menu, Gallery, Reservations, Order Online, Catering; Connect: Instagram, Facebook, Yelp, Google; Info: Private Events, Gift Cards, Press, Careers); copyright; address (7065 Sunset Blvd). |

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
| **`firebase.ts`** | Firebase app init (singleton via `getApps()`); Firestore `db` export. Config from env: `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`. Use `.env.local` (gitignored). |
| **`order.ts`** | Order persistence: `OrderItem`, `OrderData` interfaces; `createOrder(data)` → writes to Firestore `orders` collection, returns `{ id, orderNumber }` (order number format `NYN-MMDD-XXXX`); `getOrder(orderId)` → fetches by doc ID, returns order or null. |

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
5. **CateringSection.tsx** — Connect “Inquire Now” to form or email.
6. **ReservationSection.tsx** — Replace mock submit with real backend (OpenTable, Resy, or custom API).
7. **ContactSection.tsx** — Replace map placeholder with Google Maps or Mapbox embed.
8. **signatures.ts** — Replace Unsplash placeholders with real food photos.
9. **gallery.ts** — Replace with real restaurant photography.
10. **next.config.ts** — Add production image CDN hostname.

---

### Navigation Flow

1. **Home page** (`/`): Hero (Home) → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer.
2. **Order flow**: `/order` (browse + cart) → CartSidebar “Proceed to Checkout” → `/order/checkout` (form + place order) → `createOrder()` → redirect to `/order/confirmation?id=<docId>&order=<orderNumber>` → confirmation page fetches order with `getOrder(id)`.
3. **Order layout**: All `/order/*` routes share `CartProvider` (order layout).
4. **Nav links (home)**: “Order” in Navbar uses `router.push("/order")`. Other nav items smooth-scroll on home.
5. **Hero CTAs**: “Reserve a Table” → scroll to Reserve, “Order Takeout” → scroll to Order section, “View Menu” → scroll to Menu.
6. **OrderSection**: “Start Your Order →” links to `/order`.
7. **Footer links**: Placeholder `href="#"`; not wired to smooth scroll or routes.

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
| `.env.local` | Firebase env vars (gitignored): `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`. |

---

*Generated from repo structure and source code.*
