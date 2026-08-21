import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neu-dark': '#121212',
        'neu-darker': '#0a0a0a',
        'neu-lighter': '#1e1e1e',
        'brand-orange': '#FF6A00',
      },
      boxShadow: {
        'neu-out': '8px 8px 16px #0a0a0a, -8px -8px 16px #1e1e1e',
        'neu-in': 'inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1e1e1e',
        'neu-sm': '4px 4px 8px #0a0a0a, -4px -4px 8px #1e1e1e',
        'neu-sm-in': 'inset 4px 4px 8px #0a0a0a, inset -4px -4px 8px #1e1e1e',
      },
      animation: {
        'bounce-smooth': 'bounce-smooth 1.4s infinite ease-in-out both',
      },
      keyframes: {
        'bounce-smooth': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
