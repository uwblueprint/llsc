import { useRouter } from 'next/router';
import { Box, Flex, Heading, Text, Link } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import {
  getEmailForSignIn,
  clearEmailForSignIn,
  setEmailForSignIn,
} from '@/services/firebaseAuthService';
import { auth } from '@/config/firebase';
import Image from 'next/image';

const veniceBlue = '#1d3448';

export default function AdminVerifyPage() {
  const router = useRouter();
  const { email, role } = router.query;
  const [displayEmail, setDisplayEmail] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  const { sendVerificationEmail, isLoading, error, success } =
    useEmailVerification();
  const [autoSent, setAutoSent] = useState<boolean>(false);

  useEffect(() => {
    // Get email from query params or localStorage
    const emailFromQuery = email as string;
    const emailFromStorage = getEmailForSignIn();
    const finalEmail = emailFromQuery || emailFromStorage || 'admin@example.com';
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

    // For admin users, send verification email instead of sign-in link
    await sendVerificationEmail(displayEmail);
  };

  const handleBackToLogin = () => {
    clearEmailForSignIn();
    router.push('/admin-login');
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Admin Verification Content */}
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
            color={veniceBlue}
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            lineHeight="50px"
            mb={2}
          >
            Admin Portal - First Connection Peer Support Program
          </Heading>
          <Heading
            as="h2"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize={{ base: 'xl', md: '2xl' }}
            mb={6}
            mt={8}
          >
            Verify Your Admin Account
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            We sent a confirmation link to <b>{displayEmail}</b>
          </Text>

          {message.type === 'success' && (
            <Text
              mb={4}
              color="green.600"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="md"
            >
              {message.text}
            </Text>
          )}

          {message.type === 'error' && (
            <Text
              mb={4}
              color="red.600"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="md"
            >
              {message.text}
            </Text>
          )}

          <Text
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
            mb={4}
          >
            Didn&apos;t get a link?{' '}
            <Link
              onClick={handleResendEmail}
              style={{
                color: '#056067',
                textDecoration: 'underline',
                fontWeight: 600,
                fontFamily: 'Open Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              Click here to resend.
            </Link>
          </Text>

          <Text
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
          >
            Remember your password?{' '}
            <Link
              href="/admin-login"
              style={{
                color: '#056067',
                textDecoration: 'underline',
                fontWeight: 600,
                fontFamily: 'Open Sans, sans-serif',
              }}
            >
              Back to login
            </Link>
          </Text>
        </Box>
      </Flex>
      {/* Right: Image - Using admin.png from admin-login.tsx */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <Image
          src="/admin.png"
          alt="Admin Portal Visual"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
          priority
        />
      </Box>
    </Flex>
  );
}
