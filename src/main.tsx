import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silently swallow benign Vite HMR websocket connection errors in the sandbox environment
if (typeof window !== 'undefined') {
  const isViteOrWS = (reason: any) => {
    if (!reason) return true;
    
    // Check if serialization of the reason contains keywords
    try {
      const serialized = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
      if (
        /websocket/i.test(serialized) ||
        /vite/i.test(serialized) ||
        /ws:\/\/|wss:\/\//i.test(serialized) ||
        /closed without opened/i.test(serialized) ||
        /hmr/i.test(serialized)
      ) {
        return true;
      }
    } catch (e) {
      // JSON.stringify can occasionally fail on circular references, fallback below
    }

    // Direct property checks for robust error handling
    const msg = String(reason.message || reason.reason || reason.description || reason || '');
    const stack = String(reason.stack || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('vite') ||
      msg.includes('ws://') ||
      msg.includes('wss://') ||
      msg.includes('closed without opened') ||
      stack.includes('vite') ||
      stack.includes('hmr')
    ) {
      return true;
    }

    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteOrWS(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (isViteOrWS(event) || isViteOrWS(errorMsg) || isViteOrWS(event.error)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

