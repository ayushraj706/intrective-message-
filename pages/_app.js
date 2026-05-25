import '../styles/globals.css';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const html = document.documentElement;

    const applyTheme = (themeName) => {
      if (
        themeName === 'dark' || 
        (themeName === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    applyTheme(savedTheme);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => console.log('BaseKey App: Service Worker Registered!', reg))
          .catch((err) => console.log('BaseKey App: Service Worker Error', err));
      });
    }
  }, []);

  return (
    <>
      {/* Global Toaster: Ye notifications ko handle karega */}
      <Toaster position="bottom-right" richColors theme="dark" expand={true} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
