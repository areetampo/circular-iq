/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#34a83a',
          50: '#f0f8f5',
          100: '#ddf0eb',
          200: '#c1e6ca',
          300: '#a5ddb0',
          400: '#6bc86f',
          500: '#34a83a',
          600: '#2d9432',
          700: '#26802a',
          800: '#1f6c23',
          900: '#1a581d',
        },
        accent: {
          DEFAULT: '#ff9800',
          50: '#fff9f0',
          100: '#ffe0b2',
          200: '#ffc880',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#f57c00',
          700: '#e65100',
        },
        secondary: {
          DEFAULT: '#2196f3',
          500: '#2196f3',
          600: '#1976d2',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        bounce: 'bounce 1.4s infinite ease-in-out',
        pulse: 'pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: {
            transform: 'translateX(400px)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        slideUp: {
          from: {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        bounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 6px 20px rgba(0, 0, 0, 0.12)',
        xl: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
      transitionProperty: {
        DEFAULT:
          'color, background-color, border-color, fill, stroke, opacity, box-shadow, transform',
      },
    },
  },
  plugins: [],
};
