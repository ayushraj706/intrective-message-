import '../styles/globals.css'; // ये लाइन सबसे ऊपर होनी चाहिए

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

