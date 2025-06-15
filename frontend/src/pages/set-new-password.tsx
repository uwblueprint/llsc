import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';

const veniceBlue = '#1d3448';
const teal = '#056067';

export default function SetNewPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    // Here you would trigger your password reset logic
    // On success:
    router.push('/password-changed'); // redirect to password changed page
  };

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
          <form onSubmit={handleSubmit}>
            <Field
              label={<span style={{ color: veniceBlue, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>New Password</span>}
              mb={4}
            >
              <InputGroup w="100%">
                <Input
                  type="password"
                  placeholder=""
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
                  onChange={e => setPassword(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field
              label={<span style={{ color: veniceBlue, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Confirm New Password</span>}
              mb={4}
              errorText={error ? error : undefined}
            >
              <InputGroup w="100%">
                <Input
                  type="password"
                  placeholder=""
                  required
                  autoComplete="new-password"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={veniceBlue}
                  bg="white"
                  borderColor={error ? '#E53E3E' : '#D5D7DA'}
                  borderWidth={error ? 2 : 1}
                  boxShadow={error ? '0 0 0 2px #E53E3E' : 'none'}
                  _focus={error ? { borderColor: '#E53E3E', boxShadow: '0 0 0 2px #E53E3E' } : { borderColor: teal, boxShadow: '0 0 0 1px #319795' }}
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    // Debug log
                    console.log('Confirm Password changed:', e.target.value, 'Error:', error);
                  }}
                />
              </InputGroup>
              {error && (
                <Text color="#E53E3E" fontSize="sm" mt={1} fontWeight={600} fontFamily="'Open Sans', sans-serif">
                  {error}
                </Text>
              )}
            </Field>
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
            >
              Reset Password
            </Button>
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Return to <Link href="/" style={{ color: teal, textDecoration: 'underline', fontWeight: 600 }}>login</Link>.
          </Text>
        </Box>
      </Flex>
      {/* Right: Image */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <Image
          src="/login.png"
          alt="First Connection Peer Support"
          fill
          style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
          priority
        />
      </Box>
    </Flex>
  );
} 