import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#25D366',
          600: '#128C7E',
          700: '#075E54',
        },
      },
    },
  },
  plugins: [],
};

export default config;
