import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { register } from '@/APIClients/authAPIClient';
import { useRouter } from 'next/router';
import { UserRole, SignUpMethod } from '@/types/authTypes';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

export function ParticipantFormPage() {
  const [signupType, setSignupType] = useState('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

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
        role: signupType === 'volunteer' ? UserRole.VOLUNTEER : UserRole.PARTICIPANT,
        signupMethod: SignUpMethod.PASSWORD,
      };
      const result = await register(userData);
      console.log('Registration success:', result);
      router.push(`/verify?email=${encodeURIComponent(email)}&role=${signupType}`);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        setError((err.response.data as { detail: string }).detail || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Participant Form */}
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
            Welcome to our application portal!
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            Let&apos;s start by creating an account.
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
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Text mt={2} mb={2} color={fieldGray} fontWeight={600} fontFamily="'Open Sans', sans-serif" fontSize={15}>
              I am signing up:
            </Text>
            <div className="radio-options-container" style={{ display: 'flex', flexDirection: 'row', gap: 40, marginBottom: 24 }}>
              <div 
                className={`custom-radio ${signupType === 'volunteer' ? 'selected' : ''}`}
                onClick={() => setSignupType('volunteer')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  fontFamily: "'Open Sans', sans-serif", 
                  fontSize: 14, 
                  color: '#414651', 
                  fontWeight: 600 
                }}
              >
                <div className="radio-circle"></div>
                As a Peer Support Volunteer
              </div>
              <div 
                className={`custom-radio ${signupType === 'request' ? 'selected' : ''}`}
                onClick={() => setSignupType('request')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  fontFamily: "'Open Sans', sans-serif", 
                  fontSize: 14, 
                  color: '#414651', 
                  fontWeight: 600 
                }}
              >
                <div className="radio-circle"></div>
                To Request Peer Support
              </div>
            </div>
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
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              Continue <span style={{ fontSize: 22, marginLeft: 8 }}>&rarr;</span>
            </Button>
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Already have an account?{' '}
            <Link
              href="/"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
            >
              Sign in
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

export default function ParticipantFormPageWrapper() {
  return (
    <>
      <ParticipantFormPage />
      <style jsx global>{`
        .radio-circle {
          width: 18px;
          height: 18px;
          border: 2px solid #718096;
          border-radius: 50%;
          background: white;
          position: relative;
          flex-shrink: 0;
        }
        
        .custom-radio.selected .radio-circle {
          border-color: #056067;
          background: #056067;
        }
        
        .custom-radio.selected .radio-circle::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        }
        
        .custom-radio:hover .radio-circle {
          border-color: #056067;
          background: #F0F9FF;
        }
        
        .custom-radio.selected:hover .radio-circle {
          background: #056067;
        }
      `}</style>
    </>
  );
} 