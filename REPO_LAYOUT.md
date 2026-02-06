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
    │       └── page.tsx
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
| **clsx** | ^2.1.1 |
| **ESLint** | ^9 (eslint-config-next 16.1.6) |

---

### Routes

| Route | Description |
|-------|-------------|
| **`/`** | Home: single-page site with all sections (Hero, Signature Dishes, Menu, Gallery, Order, Catering, Reservations, Contact, Footer). |
| **`/order`** | Takeout order flow: menu browser + cart sidebar; add items, set pickup time, special instructions, promo; checkout button (payment not wired). |

---

### App Shell

- **`layout.tsx`** — Root layout with metadata (title, description, OpenGraph). Brand: *New York Nook \| Fine Russian Cuisine in Hollywood*.
- **`page.tsx`** — Home page: single-page layout with section refs and smooth scroll navigation between sections (Hero → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer).
- **`order/page.tsx`** — Order page at `/order`: wrapped in `CartProvider`; two-column layout (Menubrowser + CartSidebar); responsive grid (sidebar becomes bottom sheet on ≤900px).
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
| **Cart sidebar** | `CartSidebar.tsx` | Sticky sidebar (desktop) / bottom sheet (mobile ≤900px). “Your Order” header + item count; pickup time options (ASAP 25–35 min, Today 6:30 PM, 7:00 PM); scrollable cart list with qty +/- and remove; promo code input + Apply; “Add special instructions” expandable textarea; subtotal, tax 9.5%, packaging $2, total; “Proceed to Checkout” (not wired to payment). Empty state “Add items to get started”. |

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
3. **CartSidebar.tsx** — Wire “Proceed to Checkout” to payment/ordering platform (Toast, Square, ChowNow, etc.).
4. **CateringSection.tsx** — Connect “Inquire Now” to form or email.
5. **ReservationSection.tsx** — Replace mock submit with real backend (OpenTable, Resy, or custom API).
6. **ContactSection.tsx** — Replace map placeholder with Google Maps or Mapbox embed.
7. **signatures.ts** — Replace Unsplash placeholders with real food photos.
8. **gallery.ts** — Replace with real restaurant photography.
9. **next.config.ts** — Add production image CDN hostname.

---

### Navigation Flow

1. **Home page** (`/`): Hero (Home) → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer.
2. **Order page** (`/order`): Dedicated takeout flow; header “Back to Menu” and logo link to `/`.
3. **Nav links (home)**: `SECTIONS = [Home, Menu, Gallery, Reserve, Order, Catering, Contact]`. “Order” in Navbar uses `router.push("/order")` (goes to order page). Other nav items smooth-scroll on home via `scrollIntoView({ behavior: "smooth" })`.
4. **Hero CTAs**: “Reserve a Table” → scroll to Reserve, “Order Takeout” → scroll to Order section, “View Menu” → scroll to Menu.
5. **OrderSection**: “Start Your Order →” is a `<Link href="/order">` to the order page.
6. **Footer links**: Placeholder `href="#"` (Navigate, Connect, Info columns); not wired to smooth scroll or routes.

---

### Image Sources

- **Current**: Unsplash (restaurant/food) for hero, gallery, menu, catering, order, reservations.
- **Config**: `next.config.ts` (CommonJS) allows `images.unsplash.com`; TODOs for real CDN.

---

### Config Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Image remote patterns (Unsplash). |
| `tailwind.config.ts` | Content paths, theme extend (colors, fonts). |
| `tsconfig.json` | TypeScript paths (`@/` → `src/`). |
| `eslint.config.mjs` | ESLint flat config. |
| `postcss.config.mjs` | PostCSS + Tailwind. |

---

*Generated from repo structure and source code.*
