import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import { register, sendEmailVerification } from '@/APIClients/authAPIClient';
import { UserRole, SignUpMethod } from '@/types/AuthTypes';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const userData = {
        first_name: '',
        last_name: '',
        email,
        password,
        role: UserRole.ADMIN,
        signupMethod: SignUpMethod.PASSWORD,
      };
      const result = await register(userData);
      console.log('Admin registration success:', result);
      
      // Add a small delay to ensure Firebase user is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sendEmailVerification(email);
      router.push(`/verify?email=${encodeURIComponent(email)}&role=admin`);
    } catch (err: unknown) {
      console.error('Admin registration error:', err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        setError((err.response.data as { detail: string }).detail || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Admin Login Form */}
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
            Admin Portal - First Connection Peer<br />Support Program
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
            Welcome!
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            Let&apos;s start by setting up your admin account.
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
                  autoComplete="new-password"
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
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Confirm Password</span>}
              mb={6}
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
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </InputGroup>
            </Field>
            {error && (
              <Text color="red.500" mb={4} fontWeight={600} fontFamily="'Open Sans', sans-serif">
                {typeof error === 'string' ? error : JSON.stringify(error)}
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
            >
              Continue <span style={{ display: 'inline-block', marginLeft: 8 }}>&#8594;</span>
            </Button>
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={400} fontFamily="'Open Sans', sans-serif">
            Already have an account?{' '}
            <Link
              href="/admin"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
            >
              Sign in.
            </Link>
          </Text>
        </Box>
      </Flex>
      {/* Right: Image */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <Image
          src="/admin.png"
          alt="Admin Portal Visual"
          fill
          style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
          priority
        />
      </Box>
    </Flex>
  );
} 