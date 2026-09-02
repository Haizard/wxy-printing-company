/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#F2F4F8",
          gradient1: "#EAF1FB",
          gradient2: "#F7EFFB",
        },
        glass: {
          fill: "rgba(255,255,255,0.55)",
          strong: "rgba(255,255,255,0.72)",
          subtle: "rgba(255,255,255,0.35)",
          border: "rgba(255,255,255,0.6)",
        },
        accent: {
          primary: "#FF5A3C",
          secondary: "#FFB020",
          tertiary: "#2E7DFF",
          success: "#34C759",
          warning: "#FF9F0A",
          danger: "#FF3B30",
        },
        text: {
          primary: "#1C1C1E",
          secondary: "#6E6E73",
          tertiary: "#A0A0A5",
          "on-accent": "#FFFFFF",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FF5A3C",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "rgba(255,255,255,0.55)",
          foreground: "#1C1C1E",
        },
        muted: {
          DEFAULT: "rgba(255,255,255,0.35)",
          foreground: "#6E6E73",
        },
        accent: {
          DEFAULT: "#FF5A3C",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "rgba(255,255,255,0.55)",
          foreground: "#1C1C1E",
        },
        popover: {
          DEFAULT: "rgba(255,255,255,0.72)",
          foreground: "#1C1C1E",
        },
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "22px",
        xl: "28px",
        pill: "999px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "large-title": ["34px", { lineHeight: "1.3", fontWeight: "700", letterSpacing: "-0.02em" }],
        "title-1": ["28px", { lineHeight: "1.3", fontWeight: "700" }],
        "title-2": ["22px", { lineHeight: "1.35", fontWeight: "600" }],
        "title-3": ["20px", { lineHeight: "1.35", fontWeight: "600" }],
        headline: ["17px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["17px", { lineHeight: "1.4", fontWeight: "400" }],
        callout: ["16px", { lineHeight: "1.4", fontWeight: "400" }],
        subhead: ["15px", { lineHeight: "1.4", fontWeight: "400" }],
        footnote: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "32px",
        "8": "40px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(31,38,135,0.10)",
        "glass-lg": "0 16px 48px rgba(31,38,135,0.12)",
      },
      backdropBlur: {
        glass: "18px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
