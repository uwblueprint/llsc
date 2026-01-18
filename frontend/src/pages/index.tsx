import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Heading, Text, Button, Input, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/ui/form-label';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import { login } from '@/APIClients/authAPIClient';
import { AuthPageLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
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
      } else if (result.errorCode === 'auth/email-not-verified') {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || t('loginFailed'));
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

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
            {isFromEmailVerification ? t('thankYouConfirming') : t('welcomeBack')}
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            {isFromEmailVerification ? t('emailVerified') : t('signInMessage')}
          </Text>
        </Box>

        <VStack as="form" spacing={6} align="stretch" onSubmit={handleSubmit}>
          <Field label={<FormLabel>{t('email')}</FormLabel>}>
            <InputGroup w="100%">
              <Input
                type="email"
                placeholder="john.doe@gmail.com"
                required
                autoComplete="email"
                w="100%"
                fontWeight={400}
                fontSize="sm"
                color="brand.fieldText"
                bg="white"
                borderColor="brand.border"
                _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </InputGroup>
          </Field>

          <Field label={<FormLabel>{t('password')}</FormLabel>}>
            <InputGroup w="100%">
              <Input
                type="password"
                placeholder=""
                required
                autoComplete="current-password"
                w="100%"
                fontWeight={400}
                fontSize="sm"
                color="brand.fieldText"
                bg="white"
                borderColor="brand.border"
                _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </InputGroup>
          </Field>

          <Box textAlign="right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reset-password')}
              color="brand.navyMuted"
              fontWeight={600}
              fontSize="sm"
              p={0}
              h="auto"
              _hover={{ color: 'brand.navy' }}
            >
              {t('forgotPassword')}
            </Button>
          </Box>

          {error && (
            <Text color="red.500" fontWeight={600}>
              {error}
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
            boxShadow="0 1px 2px 0 #0A0D12, 0 0 0 0 transparent"
            _hover={{ bg: 'brand.primaryEmphasis' }}
            px={8}
            py={3}
            isLoading={isLoading}
          >
            {t('signIn')}
          </Button>
        </VStack>

        <Text color="brand.navy" fontSize="md" fontWeight={600}>
          {t('noAccount')}{' '}
          <Link
            href="/participant-form"
            style={{
              color: 'var(--chakra-colors-brand-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {t('completeForm')}
          </Link>
        </Text>
      </VStack>
    </AuthPageLayout>
  );
}
