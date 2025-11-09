/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        'accent-pink': 'var(--color-accent-pink)',
        'accent-blue': 'var(--color-accent-blue)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        danger: 'var(--color-danger)',
        text: 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)'
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out'
      }
    }
  }
}
