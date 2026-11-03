import type { Config } from "tailwindcss";

// Colours are CSS variables defined once in src/app/globals.css (light and dark).
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        border: token("border"),
        ring: token("ring"),
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground"), soft: token("primary-soft") },
        booked: { DEFAULT: token("booked"), foreground: token("booked-foreground"), strong: token("booked-strong") },
        free: { DEFAULT: token("free"), foreground: token("free-foreground"), strong: token("free-strong") },
        past: { DEFAULT: token("past"), foreground: token("past-foreground"), strong: token("past-strong") },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto",
          "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "sans-serif",
        ],
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.375rem" },
    },
  },
};

export default config;
