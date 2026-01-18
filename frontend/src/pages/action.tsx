import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { VStack, Heading, Text, Button, Spinner } from '@chakra-ui/react';
import { verifyEmailWithCode } from '@/APIClients/authAPIClient';
import { AuthPageLayout } from '@/components/layout';
import { getAuth, applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import { useTranslations } from 'next-intl';

const auth = getAuth();

export default function ActionPage() {
  const router = useRouter();
  const t = useTranslations('auth');
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
        setError(t('invalidVerificationLink'));
        setIsProcessing(false);
        return;
      }

      if (normalizedMode === 'verifyEmail') {
        try {
          await applyActionCode(auth, normalizedCode);
          router.replace('/?verified=true&mode=verifyEmail');
        } catch (err: any) {
          setError(err.message || t('verificationFailed'));
          setIsProcessing(false);
        }
      } else if (normalizedMode === 'resetPassword') {
        try {
          await verifyPasswordResetCode(auth, normalizedCode);
          router.replace(`/set-new-password?oobCode=${normalizedCode}`);
        } catch (err) {
          setError(t('invalidOrExpiredCode'));
          setIsProcessing(false);
        }
      } else {
        setError(t('invalidActionMode'));
        setIsProcessing(false);
      }
    };

    handleAction();
  }, [router.isReady, router.query.mode, router.query.oobCode, router.asPath, router, t]);

  const LoadingState = (
    <VStack spacing={4} textAlign="center" align="center">
      <Heading size="lg">{t('processing')}</Heading>
      <Text>{t('pleaseWait')}</Text>
      {isProcessing && <Spinner thickness="4px" speed="0.65s" color="brand.primary" size="xl" />}
    </VStack>
  );

  if (error) {
    return (
      <AuthPageLayout>
        <VStack spacing={4} textAlign="center" align="center">
          <Heading size="lg" color="red.500">
            {t('verificationFailed')}
          </Heading>
          <Text color="gray.600">{error}</Text>
          <Button
            bg="brand.primary"
            color="white"
            _hover={{ bg: 'brand.primaryEmphasis' }}
            onClick={() => router.push('/')}
          >
            {t('returnToLogIn')}
          </Button>
        </VStack>
      </AuthPageLayout>
    );
  }

  return <AuthPageLayout>{LoadingState}</AuthPageLayout>;
}
