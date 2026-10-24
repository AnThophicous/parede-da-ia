import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { journey } from './lib/journey';
import './index.css';

// ?debug exposes the journey so QA can jump straight to any scene.
if (new URLSearchParams(location.search).has('debug')) Object.assign(window, { __journey: journey });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
