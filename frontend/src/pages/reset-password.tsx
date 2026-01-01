import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Heading, Text, Button, Input, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/ui/form-label';
import { InputGroup } from '@/components/ui/input-group';
import { resetPassword } from '@/APIClients/authAPIClient';
import { AuthPageLayout } from '@/components/layout';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setMessage(
          'If the email exists, a password reset link has been sent to your email address.',
        );
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
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
            First Connection Peer Support Program
          </Heading>
          <Heading fontWeight={600} color="brand.navy" fontSize={{ base: 'xl', md: '2xl' }} mt={4}>
            Reset Your Password
          </Heading>
          <Text mt={3} color="brand.navy" fontWeight={400} fontSize={{ base: 'md', md: 'lg' }}>
            Enter the email associated with your account to receive password reset options.
          </Text>
        </Box>

        <VStack as="form" spacing={6} onSubmit={handleSubmit}>
          <Field label={<FormLabel>Email</FormLabel>}>
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
          >
            Send Reset Link
          </Button>
        </VStack>

        {message && (
          <Text color="green.600" fontSize="md">
            {message}
          </Text>
        )}
        {error && (
          <Text color="red.500" fontSize="md" fontWeight={600}>
            {error}
          </Text>
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
