import { useRouter } from 'next/router';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import {
  getEmailForSignIn,
  clearEmailForSignIn,
  setEmailForSignIn,
} from '@/services/firebaseAuthService';
import { auth } from '@/config/firebase';

export default function VerifyPage() {
  const router = useRouter();
  const { email, role } = router.query;
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
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Flex
        flex="1"
        align="center"
        justify="center"
        px={{ base: 4, md: 12 }}
        py={{ base: 16, md: 0 }}
        bg="white"
        minH={{ base: '60vh', md: '100vh' }}
      >
        <Box w="full" maxW="520px">
          <Heading
            as="h1"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            color="#1d3448"
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            lineHeight="50px"
            mb={2}
          >
            First Connection Peer
            <br />
            Support Program
          </Heading>
          <Heading
            as="h2"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            color="#1d3448"
            fontSize={{ base: 'xl', md: '2xl' }}
            mb={6}
            mt={8}
          >
            Welcome to our application portal!
          </Heading>
          <Text
            mb={8}
            color="#1d3448"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            We sent a confirmation link to <b>{displayEmail}</b>
          </Text>

          {message.text && (
            <Text
              mb={4}
              color={message.type === 'success' ? 'green.600' : 'red.600'}
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              fontSize="md"
            >
              {message.text}
            </Text>
          )}

          <Text
            mb={6}
            color="#1d3448"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
          >
            Didn&apos;t get a link?{' '}
            <Button
              variant="ghost"
              color="#056067"
              textDecoration="underline"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              onClick={handleResendEmail}
              loading={isLoading}
              _hover={{ textDecoration: 'none' }}
              p={0}
              h="auto"
              minH="auto"
            >
              Resend link.
            </Button>
          </Text>
          <Button
            variant="outline"
            color="#1d3448"
            borderColor="#1d3448"
            onClick={handleBackToLogin}
            fontFamily="'Open Sans', sans-serif"
            _hover={{ bg: '#1d3448', color: 'white' }}
          >
            Back to Login
          </Button>
        </Box>
      </Flex>
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <img
          src="/login.png"
          alt="First Connection Peer Support"
          style={{ objectFit: 'cover', objectPosition: '90% 50%', width: '100%', height: '100%' }}
        />
      </Box>
    </Flex>
  );
}
