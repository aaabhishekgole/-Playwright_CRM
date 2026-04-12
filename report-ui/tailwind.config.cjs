const path = require('node:path');

module.exports = {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,jsx}'),
    path.join(__dirname, '../playwright_pulse_dashboard.jsx'),
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          green:  '#00ff88',
          cyan:   '#00d4ff',
          blue:   '#3b82f6',
          purple: '#a855f7',
          red:    '#ff4444',
          yellow: '#fbbf24',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        tech: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'neon-green':  '0 0 8px #00ff8866, 0 0 20px #00ff8833',
        'neon-cyan':   '0 0 8px #00d4ff66, 0 0 20px #00d4ff33',
        'neon-red':    '0 0 8px #ff444466, 0 0 20px #ff444433',
      },
    },
  },
  plugins: [],
};
