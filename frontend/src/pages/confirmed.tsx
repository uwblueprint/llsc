import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input, Spinner } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, applyActionCode, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { verifyEmail } from '@/APIClients/authAPIClient';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

export default function ConfirmedPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const router = useRouter();
  const { mode, oobCode, verified } = router.query;

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // If verification was already completed in action page, show success
  useEffect(() => {
    if (verified === 'true' && mode === 'verifyEmail') {
      setVerificationStatus('success');
      setVerificationMessage('Email verified successfully! You can now sign in.');
    }
  }, [verified, mode]);

  // If signed in and have oobCode, verify email (fallback for direct access)
  useEffect(() => {
    if (firebaseUser && mode === 'verifyEmail' && oobCode && verificationStatus === 'idle') {
      handleEmailVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, mode, oobCode, verificationStatus]);

  const handleEmailVerification = async () => {
    setVerificationStatus('verifying');
    setVerificationMessage('Verifying your email...');
    try {
      // First, verify with Firebase
      await applyActionCode(auth, oobCode as string);
      
      // Then, verify with backend if we have the user's email
      // Note: Backend verification is optional and won't block the flow
      const attemptBackendVerification = async (email: string) => {
        try {
          const backendVerificationSuccess = await verifyEmail(email);
          if (!backendVerificationSuccess) {
            console.warn('Firebase verification succeeded but backend verification failed');
          }
        } catch (error) {
          console.warn('Backend verification failed, but Firebase verification succeeded:', error);
          // This is not critical since Firebase verification already succeeded
        }
      };

      if (firebaseUser?.email) {
        await attemptBackendVerification(firebaseUser.email);
      } else {
        // If we don't have the user's email, try to get it from the URL or localStorage
        const emailFromQuery = router.query.email as string;
        const emailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('emailForSignIn') : null;
        const emailToVerify = emailFromQuery || emailFromStorage;
        
        if (emailToVerify) {
          await attemptBackendVerification(emailToVerify);
        }
      }
      
      setVerificationStatus('success');
      setVerificationMessage('Email verified successfully! You can now sign in.');
    } catch (error) {
      setVerificationStatus('error');
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        if (errorCode === 'auth/invalid-action-code') {
          setVerificationMessage('Invalid or expired verification link. Please request a new one.');
        } else if (errorCode === 'auth/expired-action-code') {
          setVerificationMessage('Verification link has expired. Please request a new one.');
        } else {
          setVerificationMessage('Verification failed. Please try again.');
        }
      } else {
        setVerificationMessage('An error occurred during verification.');
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Firebase user state will update, triggering verification
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Confirmation and Sign In */}
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
            Thank you for confirming!
          </Heading>

          {/* Email verification status */}
          {verificationStatus !== 'idle' && (
            <Box mb={6} p={4} borderRadius="8px" bg={verificationStatus === 'success' ? 'green.50' : verificationStatus === 'error' ? 'red.50' : 'blue.50'}>
              <Text
                color={verificationStatus === 'success' ? 'green.600' : verificationStatus === 'error' ? 'red.600' : 'blue.600'}
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="md"
              >
                {verificationStatus === 'verifying' && <Spinner size="sm" mr={2} />} {verificationMessage}
              </Text>
            </Box>
          )}

          {/* Show sign-in form if not signed in and not verified yet */}
          {!firebaseUser && verificationStatus !== 'success' && (
            <form onSubmit={handleSignIn}>
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
                loading={isSigningIn}
              >
                Sign In
              </Button>
            </form>
          )}

          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Don&apos;t have an account?{' '}
            <Link
              href="/participant-form"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
            >
              Complete our First Connection Participant Form.
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