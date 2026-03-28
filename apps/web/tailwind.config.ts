import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        canvas: "var(--canvas)",
        accent: "var(--accent)",
        ember: "var(--ember)",
        mint: "var(--mint)",
      },
      boxShadow: {
        float: "0 20px 45px rgba(6, 36, 44, 0.25)",
      },
      animation: {
        "fade-in-up": "fadeInUp 320ms ease-out both",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
