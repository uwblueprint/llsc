import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Heading, Text, Button, Input, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/ui/form-label';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import firebaseApp from '@/config/firebase';
import { AuthPageLayout } from '@/components/layout';

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
            Reset Your Password
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            Set a new password to restore access to your account.
          </Text>
        </Box>

        {error && (
          <Text color="red.500" fontWeight={600}>
            {error}
          </Text>
        )}

        {showForm && (
          <VStack as="form" spacing={4} onSubmit={handleSubmit}>
            <Field label={<FormLabel>New Password</FormLabel>}>
              <InputGroup w="100%">
                <Input
                  ref={passwordRef}
                  type="password"
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                  w="100%"
                  fontWeight={400}
                  fontSize="sm"
                  color="brand.fieldText"
                  bg="white"
                  borderColor="brand.border"
                  _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </InputGroup>
            </Field>

            <Field label={<FormLabel>Confirm New Password</FormLabel>}>
              <InputGroup w="100%">
                <Input
                  ref={confirmPasswordRef}
                  type="password"
                  placeholder="Confirm your new password"
                  required
                  autoComplete="new-password"
                  w="100%"
                  fontWeight={400}
                  fontSize="sm"
                  color="brand.fieldText"
                  bg="white"
                  borderColor={passwordError ? 'red.500' : 'brand.border'}
                  borderWidth={passwordError ? 2 : 1}
                  boxShadow={passwordError ? '0 0 0 2px var(--chakra-colors-red-500)' : 'none'}
                  _focus={
                    passwordError
                      ? {
                          borderColor: 'red.500',
                          boxShadow: '0 0 0 2px var(--chakra-colors-red-500)',
                        }
                      : {
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)',
                        }
                  }
                  _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </InputGroup>
            </Field>

            {passwordError && (
              <Text color="red.500" fontSize="sm">
                {passwordError}
              </Text>
            )}

            <Button
              type="submit"
              w="full"
              size="lg"
              fontWeight={600}
              fontSize="lg"
              bg="brand.primary"
              color="white"
              borderRadius="8px"
              border="1px solid"
              borderColor="brand.primary"
              boxShadow="none"
              _hover={{ bg: 'brand.primaryEmphasis' }}
              px={8}
              py={3}
              isLoading={isLoading}
              isDisabled={isLoading}
            >
              Reset Password
            </Button>
          </VStack>
        )}

        <Text color="brand.navy" fontSize="md" fontWeight={600}>
          Return to{' '}
          <Link
            href="/"
            style={{
              color: 'var(--chakra-colors-brand-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            login
          </Link>
          .
        </Text>
      </VStack>
    </AuthPageLayout>
  );
}
