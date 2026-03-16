import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import App from '@/app/App.jsx';
import { createRoot } from 'react-dom/client';

const testVar = 'I should not be here';

import './index.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
