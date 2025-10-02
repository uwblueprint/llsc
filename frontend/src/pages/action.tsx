import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { verifyEmailWithCode } from '@/APIClients/authAPIClient';

export default function ActionPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const handleAction = async () => {
      const queryMode = router.query.mode;
      const queryCode = router.query.oobCode;

      const normalizedMode = Array.isArray(queryMode) ? queryMode[0] : queryMode;
      const normalizedCode = Array.isArray(queryCode) ? queryCode[0] : queryCode;

      if (!normalizedMode || !normalizedCode) {
        setError('Invalid verification link');
        setIsProcessing(false);
        return;
      }

      if (normalizedMode === 'verifyEmail') {
        try {
          const result = await verifyEmailWithCode(normalizedCode);

          if (result.success) {
            router.replace(`/?verified=true&mode=verifyEmail`);
          } else {
            setError(result.error || 'Verification failed');
            setIsProcessing(false);
          }
        } catch {
          setError('An error occurred during verification');
          setIsProcessing(false);
        }
      } else if (normalizedMode === 'resetPassword') {
        const targetUrl = `/set-new-password?oobCode=${normalizedCode}`;
        if (router.asPath !== targetUrl) {
          router.replace(targetUrl);
        }
      } else {
        setError('Invalid action mode');
        setIsProcessing(false);
      }
    };

    handleAction();
  }, [router.isReady, router.query.mode, router.query.oobCode, router.asPath, router]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '16px' }}>Verification Failed</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#056067',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: 600,
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2>Processing...</h2>
        <p>Please wait while we process your request.</p>
        {isProcessing && (
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #056067',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            ></div>
          </div>
        )}
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
