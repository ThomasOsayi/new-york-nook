import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A050",
          light: "#E8D5A3",
          dark: "#B8903E",
        },
        brand: {
          bg: "#080603",
          "bg-secondary": "#0C0A07",
          "bg-tertiary": "#0A0806",
          elevated: "#1a1510",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["DM Sans", "sans-serif"],
        accent: ["Lora", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
