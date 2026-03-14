import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Check karein ki browser Service Worker support karta hai ya nahi
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

