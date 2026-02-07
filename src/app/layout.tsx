import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New York Nook | Fine Russian Cuisine in Hollywood",
  description:
    "Experience authentic Russian fine dining in the heart of Hollywood. Reservations, takeout, catering & private events at 7065 Sunset Blvd.",
  openGraph: {
    title: "New York Nook | Fine Russian Cuisine in Hollywood",
    description: "Taste the Heart of New York — fine Russian cuisine on Sunset Blvd.",
    type: "website",
    locale: "en_US",
    // TODO: Add real OG image URL
    // images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  // TODO: Add real domain
  // metadataBase: new URL("https://www.newyorknook.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080603",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}