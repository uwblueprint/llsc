import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Heading, Text, Button, Input, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/ui/form-label';
import { InputGroup } from '@/components/ui/input-group';
import { CustomRadioGroup } from '@/components/ui/custom-radio-group';
import { register } from '@/APIClients/authAPIClient';
import { useRouter } from 'next/router';
import { UserRole, SignUpMethod } from '@/types/authTypes';
import { AuthPageLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

export function ParticipantFormPage() {
  const t = useTranslations('auth');
  const [signupType, setSignupType] = useState('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordValidationErrors, setPasswordValidationErrors] = useState<string[]>([]);
  const router = useRouter();

  // Frontend password validation function that mirrors backend logic
  const validatePasswordFrontend = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('uppercase');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('lowercase');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('special');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordValidationErrors.length > 0) {
      setError(t('pleaseFixPasswordRequirements'));
      return;
    }

    const userData = {
      first_name: '',
      last_name: '',
      email,
      password,
      role: signupType === 'volunteer' ? UserRole.VOLUNTEER : UserRole.PARTICIPANT,
      signupMethod: SignUpMethod.PASSWORD,
    };

    const result = await register(userData);
    console.log('Registration result:', result);

    if (result.success) {
      console.log('Registration success:', result);
      setPasswordValidationErrors([]); // Clear validation errors on success
      setError(''); // Clear any error messages
      router.push(`/verify?email=${encodeURIComponent(email)}&role=${signupType}`);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const passwordRequirements = [
    { text: t('passwordRequirements.atLeast8'), key: 'long' },
    { text: t('passwordRequirements.uppercase'), key: 'uppercase' },
    { text: t('passwordRequirements.lowercase'), key: 'lowercase' },
    { text: t('passwordRequirements.specialChar'), key: 'special' },
  ];

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
            {t('welcomePortal')}
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            {t('letsStart')}
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
                autoComplete="new-password"
                w="100%"
                fontWeight={400}
                fontSize="sm"
                color="brand.fieldText"
                bg="white"
                borderColor="brand.border"
                _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value;
                  setPassword(newPassword);
                  const errors = validatePasswordFrontend(newPassword);
                  setPasswordValidationErrors(errors);
                }}
              />
            </InputGroup>
          </Field>

          <Field label={<FormLabel>{t('confirmPassword')}</FormLabel>}>
            <InputGroup w="100%">
              <Input
                type="password"
                placeholder=""
                required
                autoComplete="new-password"
                w="100%"
                fontWeight={400}
                fontSize="sm"
                color="brand.fieldText"
                bg="white"
                borderColor="brand.border"
                _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </InputGroup>
          </Field>

          {password.length > 0 && (
            <Box mb={4}>
              <Box display="flex" flexDirection="column" gap="6px">
                {passwordRequirements.map((requirement, index) => {
                  const hasError = passwordValidationErrors.includes(requirement.key);

                  return (
                    <Box key={index} display="flex" alignItems="center" gap="8px">
                      <Box
                        width="18px"
                        height="18px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {hasError ? (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path
                              d="M1 1L8 8M8 1L1 8"
                              stroke="#C75B5C"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg width="12" height="8.25" viewBox="0 0 12 8.25" fill="none">
                            <path
                              d="M1 4.125L4.5 7.625L11 1.125"
                              stroke="var(--chakra-colors-brand-primary)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </Box>
                      <Text fontWeight={600} fontSize="sm" color="brand.fieldText">
                        {requirement.text}
                      </Text>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          <Box>
            <Text mb={4} color="brand.fieldText" fontWeight={600} fontSize="sm">
              {t('iAmSigningUp')}
            </Text>
            <CustomRadioGroup
              value={signupType}
              onChange={setSignupType}
              options={[
                { value: 'volunteer', label: t('asVolunteer') },
                { value: 'request', label: t('toRequestSupport') },
              ]}
            />
          </Box>

          {error && (
            <Text color="red.500" fontWeight={600}>
              {typeof error === 'string' ? error : JSON.stringify(error)}
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
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {t('continue')} <span style={{ fontSize: 22, marginLeft: 8 }}>&rarr;</span>
          </Button>
        </VStack>

        <Text color="brand.navy" fontSize="md" fontWeight={600}>
          {t('alreadyHaveAccount')}{' '}
          <Link
            href="/"
            style={{
              color: 'var(--chakra-colors-brand-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {t('signInLink')}
          </Link>
        </Text>
      </VStack>
    </AuthPageLayout>
  );
}

export default ParticipantFormPage;
