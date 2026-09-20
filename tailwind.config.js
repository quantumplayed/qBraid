/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0e',     // Deep background
          dark: '#12121e',      // Panel background
          primary: '#00ff9d',   // Neon Green
          secondary: '#d600ff', // Neon Pink/Purple
          accent: '#00ccff',    // Neon Blue
          text: '#e0e0e0',      // Main text
          dim: '#6b7280',       // Dim text
        },
      },
      fontFamily: {
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'], // Circuit feel
      },
    },
  },
  plugins: [],
}
