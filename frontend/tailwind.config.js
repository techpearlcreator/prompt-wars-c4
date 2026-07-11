/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stadium: {
          navy: {
            deep: '#070a13',     // Dark background
            card: '#0f1423',     // Dark navy card background
            bubble: '#161c32',   // Chat bubble navy
            light: '#232b48',    // Lighter border navy
            accent: '#313d66'    // Hover state navy
          },
          gold: {
            DEFAULT: '#d4af37',  // Primary gold accent
            light: '#ffd700',    // Bright gold
            soft: '#f3e5ab',     // Light cream gold
            dark: '#aa7c11'      // Deep bronze gold
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
