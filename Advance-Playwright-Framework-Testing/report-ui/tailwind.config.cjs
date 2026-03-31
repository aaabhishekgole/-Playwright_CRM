const path = require('node:path');

module.exports = {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,jsx}'),
    path.join(__dirname, '../playwright_pulse_dashboard.jsx'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
