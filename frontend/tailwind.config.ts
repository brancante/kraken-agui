import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kraken: {
          bg: "#0B0E11",
          surface: "#141821",
          card: "#1A1F2E",
          border: "#2A2F3E",
          purple: "#7B61FF",
          green: "#00C076",
          red: "#FF4D4D",
          text: "#E1E4E8",
          muted: "#8B949E",
        },
      },
    },
  },
  plugins: [],
};

export default config;
