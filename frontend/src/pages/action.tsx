import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ActionPage() {
  const router = useRouter();
  const { mode, oobCode } = router.query;

  useEffect(() => {

    if (mode === 'verifyEmail') {
      console.log('Redirecting to confirmed page with verification parameters');
      router.replace(`/confirmed?mode=verifyEmail&oobCode=${oobCode}`);
    } else if (mode === 'resetPassword') {
      router.replace(`/set-new-password?oobCode=${oobCode}`);
    } else {
      console.error('Invalid action mode:', mode);
      router.replace('/');
    }
  }, [mode, oobCode, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Processing...</h2>
        <p>Please wait while we process your request.</p>
      </div>
    </div>
  );
} 