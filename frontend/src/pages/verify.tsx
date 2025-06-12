import { useRouter } from 'next/router';
import { useState } from 'react';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';

export default function VerifyPage() {
  const router = useRouter();
  const { email } = router.query;
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Verification code entered:', code);
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
            We sent a verification code to <b>{email}</b>
          </Text>
          <form onSubmit={handleSubmit}>
            <Text mb={2} color="#414651" fontWeight={600} fontFamily="'Open Sans', sans-serif" fontSize={15}>
              Verification Code
            </Text>
            <Input
              type="text"
              placeholder="Enter code"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              mb={6}
              maxW="518px"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              fontSize={14}
              color="#414651"
              bg="white"
              borderColor="#D5D7DA"
              _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
            />
            <Button type="submit" w="100%" maxW="518px" mt={2} size="lg" fontWeight={600} fontFamily="'Open Sans', sans-serif" fontSize="lg" bg="#056067" color="white" borderRadius="8px" border="1px solid #056067" boxShadow="0 1px 2px 0 #0A0D12, 0 0 0 0 transparent" _hover={{ bg: '#044953' }} px={8} py={3} display="flex" alignItems="center" justifyContent="center">
              Continue <span style={{ fontSize: 22, marginLeft: 8 }}>&rarr;</span>
            </Button>
          </form>
          <Text mt={8} color="#1d3448" fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Didn't get a code?{' '}
            <a href="#" style={{ color: '#056067', textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}>
              Resend Code.
            </a>
          </Text>
        </Box>
      </Flex>
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <img src="/login.png" alt="First Connection Peer Support" style={{ objectFit: 'cover', objectPosition: '90% 50%', width: '100%', height: '100%' }} />
      </Box>
    </Flex>
  );
} 