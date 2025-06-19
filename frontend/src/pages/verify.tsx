import { useRouter } from 'next/router';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

export default function VerifyPage() {
  const router = useRouter();
  const { email } = router.query;
  const displayEmail = email || 'john.doe@gmail.com';

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
          <Text color="#1d3448" fontFamily="'Open Sans', sans-serif" fontWeight={400} fontSize="md">
            Didn&apos;t get a link?{' '}
            <span
              style={{ color: '#056067', textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif', cursor: 'pointer' }}
              onClick={() => router.push('/confirmed')}
            >
              Resend link.
            </span>
          </Text>
        </Box>
      </Flex>
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <img src="/login.png" alt="First Connection Peer Support" style={{ objectFit: 'cover', objectPosition: '90% 50%', width: '100%', height: '100%' }} />
      </Box>
    </Flex>
  );
} 