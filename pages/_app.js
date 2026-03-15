import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 1. Theme Engine: LocalStorage se theme uthao
    const savedTheme = localStorage.getItem('theme') || 'system';
    const html = document.documentElement;

    const applyTheme = (themeName) => {
      if (themeName === 'dark' || (themeName === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    applyTheme(savedTheme);

    // 2. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => console.log('BaseKey App: Service Worker Registered!', reg))
          .catch((err) => console.log('BaseKey App: Service Worker Error', err));
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
