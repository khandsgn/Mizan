/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: {
          light: '#F8FAFC',
          dark: '#060B14',
        },
        sidebar: {
          light: '#FFFFFF',
          dark: '#050912',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};
