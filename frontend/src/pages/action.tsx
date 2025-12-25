import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { VStack, Heading, Text, Button, Spinner } from '@chakra-ui/react';
import { verifyEmailWithCode } from '@/APIClients/authAPIClient';
import { AuthPageLayout } from '@/components/layout';

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

  const LoadingState = (
    <VStack spacing={4} textAlign="center" align="center">
      <Heading size="lg">Processing...</Heading>
      <Text>Please wait while we process your request.</Text>
      {isProcessing && <Spinner thickness="4px" speed="0.65s" color="brand.primary" size="xl" />}
    </VStack>
  );

  if (error) {
    return (
      <AuthPageLayout>
        <VStack spacing={4} textAlign="center" align="center">
          <Heading size="lg" color="red.500">
            Verification Failed
          </Heading>
          <Text color="gray.600">{error}</Text>
          <Button
            bg="brand.primary"
            color="white"
            _hover={{ bg: 'brand.primaryEmphasis' }}
            onClick={() => router.push('/')}
          >
            Return to Login
          </Button>
        </VStack>
      </AuthPageLayout>
    );
  }

  return <AuthPageLayout>{LoadingState}</AuthPageLayout>;
}
