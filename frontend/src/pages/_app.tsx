import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider } from '@/components/ui/provider';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Open Sans', sans-serif; }`}</style>
      </Head>
      <Provider>
        <Component {...pageProps} />
      </Provider>
    </>
  );
}
