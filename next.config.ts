/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // TODO: Add your real image CDN domain here
      // { protocol: "https", hostname: "cdn.newyorknook.com" },
    ],
  },
};

module.exports = nextConfig;
