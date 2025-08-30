import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import firebaseApp from '@/config/firebase';

const veniceBlue = '#1d3448';
const teal = '#056067';

export default function SetNewPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState(''); // For password mismatch only
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Add refs for the input fields
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Get API key from config
  const apiKey =
    (firebaseApp.options.apiKey as string) || process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY;

  // Only require oobCode
  useEffect(() => {
    const { oobCode } = router.query;
    if (!oobCode) {
      setError('Invalid or expired password reset link. Please request a new one.');
    } else {
      setError('');
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unfocus both input fields
    passwordRef.current?.blur();
    confirmPasswordRef.current?.blur();

    setError('');
    setPasswordError(''); // Clear previous password errors
    setIsLoading(true);

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please try again.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const { oobCode } = router.query;
      if (!oobCode) {
        setError('Invalid password reset link. Please request a new one.');
        setIsLoading(false);
        return;
      }
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oobCode: oobCode,
            newPassword: password,
          }),
        },
      );
      const data = await response.json();
      if (response.ok && !data.error) {
        setError('');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const errorMessage = data.error?.message || 'Failed to reset password. Please try again.';
        setError(errorMessage);
      }
    } catch {
      setError('An error occurred while resetting your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const { oobCode } = router.query;
  const showForm = Boolean(oobCode) && !error;

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Set New Password Form */}
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
            First Connection Peer
            <br />
            Support Program
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
            Reset Your Password
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            Set a new password to restore access to your account.
          </Text>
          {error && (
            <Text color="red.500" mb={4} fontWeight={600} fontFamily="'Open Sans', sans-serif">
              {error}
            </Text>
          )}
          {showForm && (
            <form onSubmit={handleSubmit}>
              <Field
                label={
                  <span
                    style={{
                      color: veniceBlue,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    New Password
                  </span>
                }
                mb={4}
              >
                <InputGroup w="100%">
                  <Input
                    ref={passwordRef}
                    type="password"
                    placeholder="Enter your new password"
                    required
                    autoComplete="new-password"
                    w="100%"
                    maxW="518px"
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                    fontSize={14}
                    color={veniceBlue}
                    bg="white"
                    borderColor="#D5D7DA"
                    _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <span
                    style={{
                      color: veniceBlue,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    Confirm New Password
                  </span>
                }
                mb={4}
              >
                <InputGroup w="100%">
                  <Input
                    ref={confirmPasswordRef}
                    type="password"
                    placeholder="Confirm your new password"
                    required
                    autoComplete="new-password"
                    w="100%"
                    maxW="518px"
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                    fontSize={14}
                    color={veniceBlue}
                    bg="white"
                    borderColor={passwordError ? '#E53E3E' : '#D5D7DA'}
                    borderWidth={passwordError ? 2 : 1}
                    boxShadow={passwordError ? '0 0 0 2px #E53E3E' : 'none'}
                    _focus={
                      passwordError
                        ? { borderColor: '#E53E3E', boxShadow: '0 0 0 2px #E53E3E' }
                        : { borderColor: teal, boxShadow: '0 0 0 1px #319795' }
                    }
                    _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field>
              {/* Show password mismatch error only after submit attempt */}
              {passwordError && (
                <Text
                  color="red.500"
                  mb={4}
                  fontWeight={400}
                  fontFamily="'Open Sans', sans-serif"
                  fontSize="sm"
                >
                  {passwordError}
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
                boxShadow="none"
                _hover={{ bg: '#044953' }}
                px={8}
                py={3}
                loading={isLoading}
                disabled={isLoading}
              >
                Reset Password
              </Button>
            </form>
          )}
          <Text
            mt={8}
            color={veniceBlue}
            fontSize="md"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
          >
            Return to{' '}
            <Link href="/" style={{ color: teal, textDecoration: 'underline', fontWeight: 600 }}>
              login
            </Link>
            .
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
