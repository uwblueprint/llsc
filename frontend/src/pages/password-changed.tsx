import React from 'react';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const teal = '#056067';

export default function PasswordChangedPage() {
  const router = useRouter();
  return (
    <Flex minH="100vh" align="center" justify="center" bg="white">
      <Box textAlign="center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 32px auto' }}>
          <circle cx="40" cy="40" r="38" stroke={teal} strokeWidth="4" fill="none" />
          <path d="M25 43L37 55L56 32" stroke={teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Heading as="h2" size="lg" color="#1d3448" fontWeight={700} mb={4} fontFamily="'Open Sans', sans-serif">
          Password changed!
        </Heading>
        <Text color="#1d3448" fontSize="lg" mb={8} fontFamily="'Open Sans', sans-serif">
          You can now sign in with your new password.
        </Text>
        <Button
          bg={teal}
          color="white"
          fontWeight={600}
          fontFamily="'Open Sans', sans-serif"
          fontSize="lg"
          borderRadius="8px"
          border="1px solid #056067"
          px={8}
          py={3}
          minW="320px"
          onClick={() => router.push('/')}
          _hover={{ bg: '#044953' }}
        >
          Return to Log In &nbsp; &rarr;
        </Button>
      </Box>
    </Flex>
  );
} 