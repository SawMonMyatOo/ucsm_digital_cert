// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF8F0', parchment: '#F5EFDF',
        gold: { light: '#D9BC6A', DEFAULT: '#B8912F', dark: '#8F6E1F' },
        navy: { DEFAULT: '#0F2038', deep: '#0A1626' }, ink: '#161310'
      },
      fontFamily: {
        script: ['var(--font-script)'],
        serif: ['var(--font-serif)'],
        display: ['var(--font-display)'],
        'display-sc': ['var(--font-display-sc)'],
        //heading: ['Montserrat', 'sans-serif']
      },
      boxShadow: { cert: '0 24px 70px rgba(22,19,16,0.22)', card: '0 2px 14px rgba(22,19,16,0.08)' }
    }
  },
  plugins: []
};