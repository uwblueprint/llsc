<<<<<<< HEAD
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import authAPIClient from '@/APIClients/authAPIClient';
import { UserRole } from '@/types/AuthTypes';
=======
import React from 'react';
import { Box, Flex, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { COLORS } from '@/constants/form';
>>>>>>> origin/richieb21/LLSC-66-intake-form

export default function HomePage() {
  const router = useRouter();

<<<<<<< HEAD
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await authAPIClient.login(email, password);
      if (result) {
        console.log('Login success:', result);
        
        // Check user role and redirect accordingly
        // roleId: 1 = participant, 2 = volunteer, 3 = admin
        if (result.roleId === 2) { // Volunteer
          router.push('/volunteer/dashboard');
        } else if (result.roleId === 1) { // Participant
          router.push('/welcome'); // or wherever participants should go
        } else if (result.roleId === 3) { // Admin
          router.push('/admin/dashboard');
        } else {
          // Default fallback
          router.push('/welcome');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

=======
>>>>>>> origin/richieb21/LLSC-66-intake-form
  return (
    <Flex minH="100vh" bg={COLORS.lightGray} justify="center" alignItems="center" py={12}>
      <Box
        w="full"
        maxW="600px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
        textAlign="center"
      >
        <VStack gap={8}>
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
          >
            First Connection
          </Heading>
          
          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
          >
            Choose your intake form type to get started
          </Text>
<<<<<<< HEAD
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
=======

          <VStack gap={4} w="full" maxW="400px">
>>>>>>> origin/richieb21/LLSC-66-intake-form
            <Button
              onClick={() => router.push('/participant/intake')}
              bg={COLORS.teal}
              color="white"
<<<<<<< HEAD
              borderRadius="8px"
              border="1px solid #056067"
              boxShadow="0 1px 2px 0 #0A0D12, 0 0 0 0 transparent"
              _hover={{ bg: '#044953' }}
              px={8}
              py={3}
              loading={isLoading}
              loadingText="Signing In..."
=======
              _hover={{ bg: COLORS.teal, opacity: 0.9 }}
              _active={{ bg: COLORS.teal }}
              w="full"
              h="50px"
              fontSize="16px"
              fontWeight={500}
>>>>>>> origin/richieb21/LLSC-66-intake-form
            >
              Participant Intake Form
            </Button>
<<<<<<< HEAD
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Don&apos;t have an account?{' '}
            <Link
              href="/participant-form"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
=======

            <Button
              onClick={() => router.push('/volunteer/intake')}
              bg={COLORS.veniceBlue}
              color="white"
              _hover={{ bg: COLORS.veniceBlue, opacity: 0.9 }}
              _active={{ bg: COLORS.veniceBlue }}
              w="full"
              h="50px"
              fontSize="16px"
              fontWeight={500}
>>>>>>> origin/richieb21/LLSC-66-intake-form
            >
              Volunteer Intake Form
            </Button>
          </VStack>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color={COLORS.fieldGray}
            mt={4}
          >
            The form will adapt based on your selections about blood cancer experience and caregiving status.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
