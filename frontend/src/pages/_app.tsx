import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider } from '@/components/ui/provider';
import { AuthProvider } from '@/contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Provider>
  );
}
