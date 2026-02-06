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
    │   └── page.tsx
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
    │   └── SigDishes.tsx
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

### App Shell

- **`layout.tsx`** — Root layout with metadata (title, description, OpenGraph). Brand: *New York Nook \| Fine Russian Cuisine in Hollywood*.
- **`page.tsx`** — Single-page layout with section refs and smooth scroll navigation between sections.
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
| **Order** | `OrderSection.tsx` | Three-step explainer (Browse & Select → Customize & Pay → Pickup & Enjoy); full-width background image; `useInView` reveal; CTA button. |
| **Catering** | `CateringSection.tsx` | Image grid + copy; services list (Private Dining, Corporate, Wedding, Custom Menus); “Inquire Now” CTA. |
| **Reservations** | `ReservationSection.tsx` | Form: name, phone, date picker, time slots (5:00–9:30 PM), party size (1–8+); success state with confirmation message; copy (Tue–Sun 5–11 PM, parties 8+ call, smart casual); `useInView` reveal. |
| **Contact** | `ContactSection.tsx` | Three blocks: Location (7065 Sunset Blvd), Reservations (tel link), Hours (Tue–Sun 5–11 PM); map placeholder with “Open in Maps” link to Google Maps; `useInView` reveal. |
| **Footer** | `Footer.tsx` | Brand block with logo and tagline; three link columns (Navigate: Menu, Gallery, Reservations, Order Online, Catering; Connect: Instagram, Facebook, Yelp, Google; Info: Private Events, Gift Cards, Press, Careers); copyright; address (7065 Sunset Blvd). |

---

### Data Layer

| File | Contents |
|------|----------|
| **`menu.ts`** | 7 categories: Cold Appetizers (12), Salads (5), Soups (4), Hot Appetizers (10), Mains (7), Desserts (5), Drinks (3). 46 items with name, description, price. MenuItem & MenuCategory interfaces. |
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
2. **OrderSection.tsx** — Wire “Start Your Order” to ordering platform (Toast, Square, ChowNow, etc.).
3. **CateringSection.tsx** — Connect “Inquire Now” to form or email.
4. **ReservationSection.tsx** — Replace mock submit with real backend (OpenTable, Resy, or custom API).
5. **ContactSection.tsx** — Replace map placeholder with Google Maps or Mapbox embed.
6. **signatures.ts** — Replace Unsplash placeholders with real food photos.
7. **gallery.ts** — Replace with real restaurant photography.
8. **next.config.ts** — Add production image CDN hostname.

---

### Navigation Flow

1. **Page order**: Hero (Home) → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact → Footer.
2. **Nav links**: `SECTIONS = [Home, Menu, Gallery, Reserve, Order, Catering, Contact]`. SigDishes has no nav link. Smooth scroll via `scrollIntoView({ behavior: "smooth" })`.
3. **Hero CTAs**: “Reserve a Table” → Reserve, “Order Takeout” → Order, “View Menu” → Menu.
4. **Footer links**: Placeholder `href="#"` (Navigate, Connect, Info columns); not wired to smooth scroll.

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
