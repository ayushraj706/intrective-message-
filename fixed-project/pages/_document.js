import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest - Yeh public folder se load hoga */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS Support (iPhone ke liye) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BaseKey" />
        <link rel="apple-touch-icon" href="/logo192.png" />

        {/* Theme Color (Status bar ka rang) */}
        <meta name="theme-color" content="#4F46E5" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

