/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SaaClay Dark Theme Colors
        'dark-primary': '#0A0E17',
        'dark-secondary': '#0D1117',
        'dark-tertiary': '#161B22',
        'dark-border': '#21262D',
        'dark-hover': '#1C2128',
        // Accent colors - CYAN focus
        cyan: {
          400: '#22D3EE',
          500: '#00B4D8',
          600: '#0891B2',
        },
        // Legacy brand colors (for compatibility)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#22D3EE', // Cyan
          500: '#00B4D8', // Primary Cyan
          600: '#0891B2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 180, 216, 0.3)',
        'glow-cyan-lg': '0 0 40px rgba(0, 180, 216, 0.2)',
        'card-glow': '0 0 30px rgba(0, 180, 216, 0.08)',
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(ellipse at bottom, rgba(0, 180, 216, 0.12) 0%, transparent 50%)',
        'glow-radial-top': 'radial-gradient(ellipse at top, rgba(0, 180, 216, 0.08) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
};
