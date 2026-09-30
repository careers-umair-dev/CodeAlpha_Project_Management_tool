/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#161B22',
          800: '#1E2530',
          700: '#2B3543',
          600: '#3D4A5C',
          500: '#5B6B80',
          400: '#8695A7',
          300: '#B4C0CC',
          200: '#DCE3E9',
          100: '#EEF2F5',
          50: '#F6F8FA',
        },
        amber: {
          600: '#C4841D',
          500: '#E2A73E',
          400: '#EDBE68',
          100: '#FBF0DC',
        },
        moss: {
          700: '#2A5C46',
          600: '#357155',
          500: '#3F8C69',
          100: '#DEEEE4',
        },
        clay: {
          600: '#B5502E',
          500: '#CE6641',
          100: '#F7E2D8',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22,27,34,0.06), 0 1px 1px rgba(22,27,34,0.04)',
        raised: '0 8px 24px rgba(22,27,34,0.10)',
        modal: '0 20px 48px rgba(22,27,34,0.22)',
      },
      borderRadius: {
        xl2: '0.875rem',
      },
    },
  },
  plugins: [],
};
