/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#006c49',
          hover: '#005236',
          light: '#6ffbbe',
        },
        sage: {
          DEFAULT: '#3c4a42',
          light: '#bbcabf',
        },
        gold: {
          DEFAULT: '#855300',
          light: '#ffb95f',
        },
        offwhite: {
          DEFAULT: '#f9f9ff',
          warm: '#ffffff',
        },
        charcoal: '#111c2d',
        'on-background': '#111c2d',
        'on-surface': '#111c2d',
        'on-surface-variant': '#3c4a42',
        muted: '#3c4a42',
        beige: '#bbcabf',
        emerald: '#10b981',
        primary: {
          DEFAULT: '#006c49',
          container: '#10b981',
          on: '#ffffff',
        },
        secondary: {
          DEFAULT: '#006591',
          container: '#39b8fd',
          on: '#ffffff',
        },
        surface: {
          DEFAULT: '#f9f9ff',
          container: '#e7eeff',
          lowest: '#ffffff',
          variant: '#d8e3fb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '0.75rem',
        '3xl': '0.75rem',
        '4xl': '0.75rem',
        '5xl': '0.75rem',
      },
      boxShadow: {
        'luxury': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'luxury-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
