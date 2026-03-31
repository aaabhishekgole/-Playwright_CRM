import React from 'react';
import ReactDOM from 'react-dom/client';
import PlaywrightPulseDashboard from '../../playwright_pulse_dashboard.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlaywrightPulseDashboard />
  </React.StrictMode>,
);
