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
  const [passwordValidationErrors, setPasswordValidationErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
      // Handle registration failure
      if (result.error === 'password_validation' && result.validationErrors) {
        setError(''); // Clear any previous errors
        setPasswordValidationErrors(result.validationErrors);
      } else {
        setPasswordValidationErrors([]); // Clear validation errors
        setError(result.error || 'Registration failed');
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
            <Box mb={4}>
              <Field
                label={
                  <span
                    style={{
                      color: fieldGray,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    Email
                  </span>
                }
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
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </InputGroup>
              </Field>
            </Box>
            <Box mb={4}>
              <Field
                label={
                  <span
                    style={{
                      color: fieldGray,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    Password
                  </span>
                }
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Clear password validation errors when user starts typing
                      if (passwordValidationErrors.length > 0) {
                        setPasswordValidationErrors([]);
                      }
                    }}
                  />
                </InputGroup>
              </Field>
            </Box>
            <Box mb={4}>
              <Field
                label={
                  <span
                    style={{
                      color: fieldGray,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    Confirm Password
                  </span>
                }
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </InputGroup>
              </Field>
            </Box>

            {/* Password Requirements - Only show when there are validation errors */}
            {passwordValidationErrors.length > 0 && (
              <Box mb={4}>
                <Box display="flex" flexDirection="column" gap="6px">
                  {[
                    { text: 'At least 8 characters', key: 'long' },
                    { text: 'At least 1 uppercase letter', key: 'uppercase' },
                    { text: 'At least 1 lowercase letter', key: 'lowercase' },
                    {
                      text: 'At least 1 special character (!, @, #, $, %, ^, &, or *)',
                      key: 'special',
                    },
                  ].map((requirement, index) => {
                    const hasError = passwordValidationErrors.some((error) => {
                      if (requirement.key === 'uppercase' && error.includes('uppercase'))
                        return true;
                      if (requirement.key === 'lowercase' && error.includes('lowercase'))
                        return true;
                      if (requirement.key === 'long' && error.includes('long')) return true;
                      if (requirement.key === 'special' && error.includes('special')) return true;
                      return false;
                    });

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
                                stroke="#056067"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </Box>
                        <Text
                          fontFamily="'Open Sans', sans-serif"
                          fontWeight={600}
                          fontSize="14px"
                          lineHeight="1.4285714285714286em"
                          color="#414651"
                        >
                          {requirement.text}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Text
              mt={2}
              mb={2}
              color={fieldGray}
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              fontSize={15}
            >
              I am signing up:
            </Text>
            <div
              className="radio-options-container"
              style={{ display: 'flex', flexDirection: 'row', gap: 40, marginBottom: 24 }}
            >
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
                  fontWeight: 600,
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
                  fontWeight: 600,
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
          <Text
            mt={8}
            color={veniceBlue}
            fontSize="md"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
          >
            Already have an account?{' '}
            <Link
              href="/"
              style={{
                color: teal,
                textDecoration: 'underline',
                fontWeight: 600,
                fontFamily: 'Open Sans, sans-serif',
              }}
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
          background: #f0f9ff;
        }

        .custom-radio.selected:hover .radio-circle {
          background: #056067;
        }
      `}</style>
    </>
  );
}
