import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#032514",
          primary: "#084826",
          deep: "#063920",
          accent: "#d4a34b",
          amber: "#d97706",
          glow: "#eab308",
          emerald: "#10b981",
          sage: "#b8d5c4",
          light: "#e8f5ec",
          mint: "#f4f9f5",
          bg: "#f7faf8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        marathi: ["var(--font-marathi)", "var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
