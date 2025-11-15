module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa',
          DEFAULT: '#2563eb',
          dark: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
