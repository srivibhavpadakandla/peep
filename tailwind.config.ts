import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0a",
          900: "#111110",
          850: "#171716",
          800: "#202020",
          750: "#262625",
          700: "#2a2a2a",
          600: "#3a3a39",
          500: "#525250",
          400: "#737370",
          300: "#9a9a96",
          200: "#c6c6c1",
          100: "#e8e8e3",
        },
        em: {
          DEFAULT: "#10b981",
          soft: "#10b98122",
          line: "#10b98155",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        pulseDot: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.55)" },
          "50%": { boxShadow: "0 0 0 6px rgba(16,185,129,0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(16,185,129,0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(2200%)" },
        },
      },
      animation: {
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        "slide-in": "slideIn .35s ease-out",
        flash: "flash 1.2s ease-out",
        scanline: "scanline 4.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
