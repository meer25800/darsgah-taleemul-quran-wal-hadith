import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emeraldInk: "#0f3d2e",
        palm: "#147a52",
        skySeal: "#0ea5e9",
        gold: "#d4af37",
        ivory: "#fbfaf3"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 61, 46, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
