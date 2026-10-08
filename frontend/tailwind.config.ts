import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#00E676",
          dark: "#0A1410",
        },
        surface: "#F2F4F3",
        foreground: "#0A1410",
        muted: "#3A413E",
        "muted-2": "#4F5653",
      },
      fontFamily: {
        sans: [
          "var(--font-montserrat)",
          "Montserrat",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
