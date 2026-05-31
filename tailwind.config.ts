import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          border: "hsl(var(--surface-border))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        ring: "hsl(var(--ring))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        lawn: {
          from: "#22C55E",
          to: "#16A34A",
        },
        clearview: {
          from: "#3B82F6",
          to: "#2563EB",
        },
        snowland: {
          from: "#38BDF8",
          to: "#0EA5E9",
        },
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
        "gradient-lawn": "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        "gradient-clearview":
          "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
        "gradient-snowland":
          "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
        "hero-radial":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.18), transparent 60%)",
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 32px -8px rgba(59,130,246,0.35)",
        "glow-lawn":
          "0 0 0 1px rgba(34,197,94,0.4), 0 8px 32px -8px rgba(34,197,94,0.35)",
        "glow-snow":
          "0 0 0 1px rgba(56,189,248,0.4), 0 8px 32px -8px rgba(56,189,248,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
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
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
