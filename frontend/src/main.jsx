import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add scroll listener to show scrollbar only when scrolling
if (typeof window !== 'undefined') {
  let scrollTimeout;
  window.addEventListener('scroll', (e) => {
    document.documentElement.classList.add('scrolling');
    
    const target = e.target;
    if (target && target instanceof Element) {
      target.classList.add('scrolling');
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.documentElement.classList.remove('scrolling');
      document.querySelectorAll('.scrolling').forEach((el) => {
        el.classList.remove('scrolling');
      });
    }, 1000);
  }, { capture: true, passive: true });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
