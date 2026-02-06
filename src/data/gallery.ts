export interface GalleryImage {
  url: string;
  label: string;
}

/**
 * TODO: Replace with actual restaurant photography.
 * Use consistent aspect ratios where possible.
 * The `spans` array controls the masonry row-span for each image.
 */
export const galleryImages: GalleryImage[] = [
  { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", label: "The Main Dining Room" },
  { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", label: "Fine Plating" },
  { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", label: "Fresh Seafood" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", label: "Bar & Lounge" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", label: "Chef's Creation" },
  { url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80", label: "Dessert Course" },
  { url: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80", label: "Wine Collection" },
  { url: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80", label: "Morning Prep" },
  { url: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80", label: "Artisan Bread" },
  { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80", label: "Seasonal Specials" },
  { url: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80", label: "Sweet Finish" },
  { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", label: "Brunch Favorites" },
];

/** Row-span pattern for the masonry grid (index maps to galleryImages) */
export const gallerySpans = [2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2];
