/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#007AFF", // macOS Blue
        secondary: "#8E8E93", // macOS Gray
        accent: "#5AC8FA", // macOS Light Blue
        background: "#F5F5F7", // macOS System Background
        surface: "rgba(255, 255, 255, 0.72)", // macOS translucent surface
        surfaceSolid: "#ffffff",
        separator: "rgba(60, 60, 67, 0.12)",
        textPrimary: "#1D1D1F",
        textSecondary: "rgba(60, 60, 67, 0.72)"
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        'mac-subtle': '0 1px 2px rgba(0,0,0,0.04)',
        'mac-card': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'mac-popover': '0 8px 30px rgba(0,0,0,0.12)',
        'mac-modal': '0 20px 60px rgba(0,0,0,0.18)'
      },
      borderRadius: {
        'mac-sm': '4px',
        'mac-input': '6px',
        'mac-btn': '8px',
        'mac-nav': '10px',
        'mac-card': '12px',
        'mac-surface': '14px',
        'mac-float': '18px'
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
