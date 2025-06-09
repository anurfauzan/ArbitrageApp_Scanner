import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Ini akan mengimpor Tailwind CSS dan gaya global scanner
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
