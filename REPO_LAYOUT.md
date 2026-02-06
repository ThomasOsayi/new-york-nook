# New York Nook — Repo Layout & Implementation Summary

## File Structure (Tree)

```
new-york-nook/
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
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
| **TypeScript** | ^5 |
| **Tailwind CSS** | ^4 |
| **Framer Motion** | ^12.33.0 |
| **clsx** | ^2.1.1 |

---

### App Shell

- **`layout.tsx`** — Root layout with metadata (title, description, OpenGraph). Brand: *New York Nook \| Fine Russian Cuisine in Hollywood*.
- **`page.tsx`** — Single-page layout with section refs and smooth scroll navigation between sections.
- **`globals.css`** — Brand palette (gold, dark backgrounds), typography (Playfair Display, DM Sans, Lora), animations (`fadeSlideIn`, `fadeUp`, `scrollBounce`, `heroFloat`), scrollbar styling, shared button classes, and responsive breakpoints (≈900px).

---

### Sections & Components

| Section | File | What It Does |
|---------|------|--------------|
| **Navbar** | `Navbar.tsx` | Fixed nav; scroll-based background/blur; logo; desktop links + mobile hamburger; smooth scroll to sections. |
| **Hero** | `Hero.tsx` | Full-height hero with parallax background, animated tagline/title/subtitle, CTAs (Reserve, Order, Menu), floating accent images (desktop), scroll indicator. |
| **Signature Dishes** | `SigDishes.tsx` | Two-column section with auto-rotating carousel of signature dishes; prev/next buttons and indicator dots; `useInView` reveal. |
| **Menu** | `MenuSection.tsx` | Category tabs with images (Cold Appetizers, Salads, Soups, etc.); sticky image + scrolling menu items; prices. |
| **Gallery** | `GallerySection.tsx` | Masonry-style grid with variable row spans; hover overlays; lightbox with prev/next and close; `useInView` reveal. |
| **Order** | `OrderSection.tsx` | Three-step explainer (Browse → Customize → Pickup); CTA for takeout. |
| **Catering** | `CateringSection.tsx` | Image grid + copy; services list (Private Dining, Corporate, Wedding, Custom Menus); “Inquire Now” CTA. |
| **Reservations** | `ReservationSection.tsx` | Form (name, phone, date, time, party size); success state; copy about hours and dress code. |
| **Contact** | `ContactSection.tsx` | Location, phone, hours blocks; map placeholder with “Open in Maps” link. |
| **Footer** | `Footer.tsx` | Brand, navigation links (Navigate, Connect, Info), copyright, address. |

---

### Data Layer

| File | Contents |
|------|----------|
| **`menu.ts`** | Menu categories + items (Cold Appetizers, Salads, Soups, Hot Appetizers, Mains, Desserts, Drinks). 50+ items with names, descriptions, prices. |
| **`signatures.ts`** | 6 signature dishes with name, description, image URL. |
| **`gallery.ts`** | 12 gallery images with labels and row-span values for masonry layout. |

---

### Hooks

| Hook | Purpose |
|------|---------|
| **`useInView`** | IntersectionObserver-based; returns `[ref, visible]` for scroll-triggered reveals. |
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

1. **Sections**: Home → SigDishes → Menu → Gallery → Order → Catering → Reserve → Contact.
2. **Nav links**: Smooth scroll to each section via refs.
3. **Hero CTAs**: “Reserve a Table” → Reserve, “Order Takeout” → Order, “View Menu” → Menu.

---

### Image Sources

- **Current**: Unsplash (restaurant/food) for hero, gallery, menu, catering, etc.
- **Config**: `next.config.ts` allows `images.unsplash.com`; TODOs for real CDN.

---

*Generated from repo structure and source code.*
