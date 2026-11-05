import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  // SỬA TẠI ĐÂY: Thay ["class"] thành 'class'
  darkMode: 'class', 
  
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      colors: {
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        card: "rgb(var(--bg-card) / <alpha-value>)",
        main: "rgb(var(--text-main) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        primary: "rgb(var(--accent) / <alpha-value>)",
        border: "rgb(var(--border-main) / <alpha-value>)",
        error: "#ff4d4d",
      },
      borderRadius: {
        card: "20px",
        dialog: "28px", 
      },
      // ... các cấu hình khác giữ nguyên
    },
  },
  plugins: [tailwindAnimate],
};

export default config;