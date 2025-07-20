import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import { login } from '@/APIClients/authAPIClient';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFromEmailVerification, setIsFromEmailVerification] = useState(false);

  // Check if user is coming from email verification
  useEffect(() => {
    const { verified, mode } = router.query;
    if (verified === 'true' && mode === 'verifyEmail') {
      setIsFromEmailVerification(true);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/welcome');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Login Form */}
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
            First Connection Peer<br />Support Program
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
            {isFromEmailVerification ? 'Thank you for confirming!' : 'Welcome Back!'}
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            {isFromEmailVerification 
              ? 'Your email has been successfully verified. Please sign in again to continue.'
              : 'Sign in with your email and password.'
            }
          </Text>
          
          <form onSubmit={handleSubmit}>
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Email</span>}
              mb={4}
            >
              <InputGroup w="100%">
                <Input
                  type="email"
                  placeholder="john.doe@gmail.com"
                  required
                  autoComplete="email"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Password</span>}
              mb={2}
            >
              <InputGroup w="100%">
                <Input
                  type="password"
                  placeholder=""
                  required
                  autoComplete="current-password"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Box mt={1} mb={6} textAlign="right">
              <span
                style={{
                  color: '#535862',
                  fontWeight: 600,
                  fontFamily: 'Open Sans, sans-serif',
                  fontSize: 15,
                  display: 'inline-block',
                  marginTop: 6,
                  cursor: 'pointer'
                }}
                onClick={() => router.push('/reset-password')}
              >
                Forgot Password?
              </span>
            </Box>
            {error && (
              <Text color="red.500" mb={4} fontWeight={600} fontFamily="'Open Sans', sans-serif">
                {error}
              </Text>
            )}
            <Button
              type="submit"
              w="100%"
              maxW="518px"
              mt={2}
              size="lg"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              fontSize="lg"
              bg={teal}
              color="white"
              borderRadius="8px"
              border="1px solid #056067"
              boxShadow="0 1px 2px 0 #0A0D12, 0 0 0 0 transparent"
              _hover={{ bg: '#044953' }}
              px={8}
              py={3}
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Don&apos;t have an account?{' '}
            <Link
              href="/participant-form"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
            >
              Complete our First Connection Participant Form.
            </Link>
          </Text>
        </Box>
      </Flex>
      {/* Right: Image */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <Image
          src="/login.png"
          alt="First Connection Peer Support"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
          priority
        />
      </Box>
    </Flex>
  );
}
