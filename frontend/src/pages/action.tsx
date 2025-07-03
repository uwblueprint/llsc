import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const veniceBlue = '#1d3448';
const teal = '#056067';

export default function ActionLinkHandler() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleActionLink = async () => {
      try {
        const { mode, oobCode, apiKey, continueUrl } = router.query;

        console.log('Action link parameters:', { mode, oobCode, apiKey, continueUrl });

        // Wait for router to be ready
        if (!router.isReady) return;

        // Handle different action modes
        switch (mode) {
          case 'resetPassword':
            if (oobCode && apiKey) {
              // Redirect to password reset page with parameters
              const resetUrl = `/set-new-password?oobCode=${oobCode}&apiKey=${apiKey}&mode=${mode}`;
              console.log('Redirecting to password reset:', resetUrl);
              router.replace(resetUrl);
            } else {
              setError('Invalid password reset link. Missing required parameters.');
              setIsProcessing(false);
            }
            break;

          case 'verifyEmail':
            if (oobCode && apiKey) {
              // Handle email verification
              try {
                const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:confirm?key=${apiKey}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    oobCode: oobCode,
                  }),
                });

                const data = await response.json();
                console.log('Email verification response:', data);

                if (response.ok) {
                  // Email verified successfully, redirect to login
                  router.replace('/?message=email-verified');
                } else {
                  console.error('Email verification error:', data);
                  setError('Email verification failed. The link may be expired or invalid.');
                  setIsProcessing(false);
                }
              } catch (err) {
                console.error('Email verification error:', err);
                setError('An error occurred during email verification. Please try again.');
                setIsProcessing(false);
              }
            } else {
              setError('Invalid email verification link. Missing required parameters.');
              setIsProcessing(false);
            }
            break;

          default:
            setError('Invalid action link. Unknown mode specified.');
            setIsProcessing(false);
            break;
        }
      } catch (err) {
        console.error('Action link handling error:', err);
        setError('An error occurred while processing the action link.');
        setIsProcessing(false);
      }
    };

    handleActionLink();
  }, [router.isReady, router.query]);

  if (isProcessing) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <Box textAlign="center">
          <Spinner size="xl" color={teal} mb={4} />
          <Heading as="h1" fontFamily="'Open Sans', sans-serif" fontWeight={600} color={veniceBlue} fontSize="2xl" mb={2}>
            Processing Action Link
          </Heading>
          <Text color={veniceBlue} fontFamily="'Open Sans', sans-serif" fontWeight={400}>
            Please wait while we process your request...
          </Text>
        </Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <Box textAlign="center" maxW="500px" px={4}>
          <Heading as="h1" fontFamily="'Open Sans', sans-serif" fontWeight={600} color={veniceBlue} fontSize="2xl" mb={4}>
            Action Link Error
          </Heading>
          <Text color="red.500" fontFamily="'Open Sans', sans-serif" fontWeight={400} mb={6}>
            {error}
          </Text>
          <Text color={veniceBlue} fontFamily="'Open Sans', sans-serif" fontWeight={400} mb={4}>
            Please try requesting a new link or contact support if the problem persists.
          </Text>
          <Text 
            color={teal} 
            fontFamily="'Open Sans', sans-serif" 
            fontWeight={600} 
            cursor="pointer"
            textDecoration="underline"
            onClick={() => router.push('/')}
          >
            Return to Login
          </Text>
        </Box>
      </Flex>
    );
  }

  return null;
} 