import { useRouter } from 'next/router';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import {
  getEmailForSignIn,
  clearEmailForSignIn,
  setEmailForSignIn,
} from '@/services/firebaseAuthService';
import { AuthPageLayout } from '@/components/layout';

export default function VerifyPage() {
  const router = useRouter();
  const { email } = router.query;
  const [displayEmail, setDisplayEmail] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  const { sendVerificationEmail, isLoading, error, success } = useEmailVerification();
  const [autoSent, setAutoSent] = useState<boolean>(false);

  useEffect(() => {
    // Get email from query params or localStorage
    const emailFromQuery = email as string;
    const emailFromStorage = getEmailForSignIn();
    const finalEmail = emailFromQuery || emailFromStorage || 'john.doe@gmail.com';
    setDisplayEmail(finalEmail);

    // Store the email from query params if available
    if (emailFromQuery) {
      setEmailForSignIn(emailFromQuery);
    }
  }, [email]);

  // Auto-send verification email once when we have a displayEmail
  useEffect(() => {
    const maybeSend = async () => {
      if (!autoSent && displayEmail && displayEmail.includes('@')) {
        setMessage({ type: null, text: '' });
        // For regular users, send verification email
        await sendVerificationEmail(displayEmail);
        setAutoSent(true);
      }
    };
    // Only trigger after displayEmail is populated
    if (displayEmail) {
      void maybeSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayEmail]);

  useEffect(() => {
    if (success) {
      setMessage({ type: 'success', text: 'Email sent successfully! Please check your inbox.' });
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', text: error });
    }
  }, [error]);

  const handleResendEmail = async () => {
    setMessage({ type: null, text: '' });
    await sendVerificationEmail(displayEmail);
  };

  const handleBackToLogin = () => {
    clearEmailForSignIn();
    router.push('/');
  };

  return (
    <AuthPageLayout
      illustration={{ src: '/login.png', alt: 'First Connection Peer Support', priority: true }}
    >
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        <Box>
          <Heading
            fontWeight={600}
            color="brand.navy"
            fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
            lineHeight="1.25"
          >
            First Connection Peer Support Program
          </Heading>
          <Heading fontWeight={600} color="brand.navy" fontSize={{ base: 'xl', md: '2xl' }} mt={4}>
            Welcome to our application portal!
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            We sent a confirmation link to <b>{displayEmail}</b>
          </Text>
        </Box>

        {message.text && (
          <Text
            color={message.type === 'success' ? 'green.600' : 'red.600'}
            fontWeight={400}
            fontSize="md"
          >
            {message.text}
          </Text>
        )}

        <VStack spacing={3}>
          <Text color="brand.navy" fontSize="md">
            Didn&apos;t get a link? Request a new message below.
          </Text>
          <Button
            variant="outline"
            alignSelf="flex-start"
            color="brand.primary"
            borderColor="brand.primary"
            fontWeight={600}
            onClick={handleResendEmail}
            isLoading={isLoading}
            _hover={{ bg: 'rgba(5, 96, 103, 0.1)' }}
          >
            Resend link
          </Button>
        </VStack>

        <Button
          variant="solid"
          bg="brand.navy"
          color="white"
          _hover={{ bg: 'brand.navyMuted' }}
          onClick={handleBackToLogin}
        >
          Back to Login
        </Button>
      </VStack>
    </AuthPageLayout>
  );
}
