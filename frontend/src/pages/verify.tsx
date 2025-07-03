import { useRouter } from 'next/router';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useState } from 'react';
import { sendEmailVerification } from '@/APIClients/authAPIClient';

export default function VerifyPage() {
  const router = useRouter();
  const { email } = router.query;
  const displayEmail = email || 'john.doe@gmail.com';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendVerification = async () => {
    if (!email || typeof email !== 'string') return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const success = await sendEmailVerification(email);
      if (success) {
        setResendMessage('Verification email sent successfully!');
      } else {
        setResendMessage('Failed to send verification email. Please try again.');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Flex flex="1" align="center" justify="center" px={{ base: 4, md: 12 }} py={{ base: 16, md: 0 }} bg="white" minH={{ base: '60vh', md: '100vh' }}>
        <Box w="full" maxW="520px">
          <Heading as="h1" fontFamily="'Open Sans', sans-serif" fontWeight={600} color="#1d3448" fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }} lineHeight="50px" mb={2}>
            First Connection Peer<br />Support Program
          </Heading>
          <Heading as="h2" fontFamily="'Open Sans', sans-serif" fontWeight={600} color="#1d3448" fontSize={{ base: 'xl', md: '2xl' }} mb={6} mt={8}>
            Welcome to our application portal!
          </Heading>
          <Text mb={8} color="#1d3448" fontFamily="'Open Sans', sans-serif" fontWeight={400} fontSize="lg">
            We sent a confirmation link to <b>{displayEmail}</b>
          </Text>
          
          {resendMessage && (
            <Text mb={4} color={resendMessage.includes('successfully') ? 'green.500' : 'red.500'} fontFamily="'Open Sans', sans-serif" fontWeight={400}>
              {resendMessage}
            </Text>
          )}
          
          <Text color="#1d3448" fontFamily="'Open Sans', sans-serif" fontWeight={400} fontSize="md">
            Didn&apos;t get a link?{' '}
            <Button
              variant="link"
              color="#056067"
              textDecoration="underline"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              onClick={handleResendVerification}
              isLoading={isResending}
              loadingText="Sending..."
              _hover={{ color: '#044953' }}
            >
              Resend link.
            </Button>
          </Text>
        </Box>
      </Flex>
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <img src="/login.png" alt="First Connection Peer Support" style={{ objectFit: 'cover', objectPosition: '90% 50%', width: '100%', height: '100%' }} />
      </Box>
    </Flex>
  );
} 