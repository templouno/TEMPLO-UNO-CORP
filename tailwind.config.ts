import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'templo-uno': '#EAB308',
        'templo': '#8B5CF6',
        'lata': '#22C55E',
        'lea': '#F97316',
      },
    },
  },
  plugins: [],
};

export default config;
