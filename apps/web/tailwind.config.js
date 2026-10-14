/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#1e1e24',
          dot: '#33333d',
        },
        panel: {
          bg: '#18181b',
          border: '#27272a',
          header: '#232328',
          hover: '#2e2e35',
        },
      },
    },
  },
  plugins: [],
};
