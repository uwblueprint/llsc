import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Heading, Text, Button, Input, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/ui/form-label';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import firebaseApp from '@/config/firebase';
import { AuthPageLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function SetNewPasswordPage() {
  const t = useTranslations('auth');
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
      setError(t('invalidResetLink'));
    } else {
      setError('');
    }
  }, [router.query, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unfocus both input fields
    passwordRef.current?.blur();
    confirmPasswordRef.current?.blur();

    setError('');
    setPasswordError(''); // Clear previous password errors
    setIsLoading(true);

    if (password !== confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      setIsLoading(false);
      return;
    }

    try {
      const { oobCode } = router.query;
      if (!oobCode) {
        setError(t('invalidResetLink'));
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
          router.push('/password-changed');
        }, 500);
      } else {
        const errorMessage = data.error?.message || t('failedToResetPassword');
        setError(errorMessage);
      }
    } catch {
      setError(t('errorResettingPassword'));
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
            {t('programTitle')}
          </Heading>
          <Heading fontWeight={600} color="brand.navy" fontSize={{ base: 'xl', md: '2xl' }} mt={4}>
            {t('resetPassword')}
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            {t('setNewPassword')}
          </Text>
        </Box>

        {error && (
          <Text color="red.500" fontWeight={600}>
            {error}
          </Text>
        )}

        {showForm && (
          <VStack as="form" spacing={4} onSubmit={handleSubmit}>
            <Field label={<FormLabel>{t('newPassword')}</FormLabel>}>
              <InputGroup w="100%">
                <Input
                  ref={passwordRef}
                  type="password"
                  placeholder={t('enterNewPassword')}
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

            <Field label={<FormLabel>{t('confirmNewPassword')}</FormLabel>}>
              <InputGroup w="100%">
                <Input
                  ref={confirmPasswordRef}
                  type="password"
                  placeholder={t('confirmYourNewPassword')}
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
              {t('resetPasswordButton')}
            </Button>
          </VStack>
        )}

        <Text color="brand.navy" fontSize="md" fontWeight={600}>
          {t('returnTo')}{' '}
          <Link
            href="/"
            style={{
              color: 'var(--chakra-colors-brand-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {t('login')}
          </Link>
          .
        </Text>
      </VStack>
    </AuthPageLayout>
  );
}
