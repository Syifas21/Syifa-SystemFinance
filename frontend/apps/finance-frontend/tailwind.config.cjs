/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Sophisticated Palette
        primary: {
          dark: '#06103A',    // Primary Dark - Kekuatan & Otoritas
          light: '#4E88BE',   // Primary Light - Inovasi & Ketenangan
          DEFAULT: '#06103A',
        },
        // Neutral & Background
        surface: {
          bg: '#F4F4F4',      // Background - Light Warm Gray
          card: '#FFFFFF',    // Surface/Card - Putih Murni
        },
        // Text Colors
        text: {
          primary: '#333333',   // Body Text - Dark Charcoal
          secondary: '#6B6E70', // Secondary Text - Medium Gray
        },
        // Accent - Sophisticated Gold
        accent: {
          gold: '#C8A870',    // Emas Pucat/Modern Gold
          'gold-alt': '#D4AF37', // Alternative Gold
          DEFAULT: '#C8A870',
        },
        // Functional State Colors (Muted)
        success: '#5CB85C',   // Hijau Muted
        warning: '#F0AD4E',   // Kuning/Oranye Muted
        danger: '#D9534F',    // Merah Muted
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
