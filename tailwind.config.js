/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060B18',
          800: '#0B1528',
          700: '#112240',
          600: '#1D3256',
        },
        medical: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        teal: {
          50: '#F0FDFA',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        slate: {
          850: '#152033',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(14, 165, 233, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 16px 48px 0 rgba(14, 165, 233, 0.16), 0 4px 12px 0 rgba(0, 0, 0, 0.06)',
        'medical-glow': '0 0 25px -5px rgba(14, 165, 233, 0.35)',
        'teal-glow': '0 0 25px -5px rgba(20, 184, 166, 0.35)',
        'danger-glow': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
        'success-glow': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
