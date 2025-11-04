import Link from 'next/link';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCurrentUser, syncCurrentUser } from '@/APIClients/authAPIClient';
import { AuthenticatedUser, FormStatus, UserRole } from '@/types/authTypes';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { getRedirectRoute } from '@/constants/formStatusRoutes';

export default function WelcomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const evaluate = async () => {
      const stored = getCurrentUser();
      if (stored) {
        setCurrentUser(stored);
      }

      try {
        const synced = await syncCurrentUser();
        if (synced) {
          setCurrentUser(synced);
          const role = roleIdToUserRole(synced.user?.roleId ?? null);
          const status = synced.user?.formStatus as FormStatus | undefined;

          if (role) {
            if (role === UserRole.ADMIN) {
              await router.replace('/admin/dashboard');
              return;
            }

            if (status && status !== FormStatus.INTAKE_TODO) {
              const destination = getRedirectRoute(role, status);
              if (destination !== router.asPath) {
                await router.replace(destination);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync user on welcome page:', error);
      }

      setLoading(false);
    };

    void evaluate();
  }, [router]);

  const handleContinueInEnglish = () => {
    const role = roleIdToUserRole(currentUser?.user?.roleId ?? null);
    const status = currentUser?.user?.formStatus as FormStatus | undefined;

    if (!role || !status) {
      router.push('/');
      return;
    }

    if (role === UserRole.ADMIN) {
      router.push('/admin/dashboard');
      return;
    }

    if (status !== FormStatus.INTAKE_TODO) {
      router.push(getRedirectRoute(role, status));
      return;
    }

    if (role === UserRole.PARTICIPANT) {
      router.push('/participant/intake');
    } else if (role === UserRole.VOLUNTEER) {
      router.push('/volunteer/intake');
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Content */}
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
            color="#1d3448"
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
            color="#1d3448"
            fontSize={{ base: 'xl', md: '2xl' }}
            mb={6}
            mt={8}
          >
            Welcome to our application portal!
          </Heading>
          <Text
            mb={5}
            color="#1d3448"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
          >
            You can learn more about the program{' '}
            <a href="#" style={{ color: '#056067', textDecoration: 'underline' }}>
              here
            </a>
            .
          </Text>
          <Text
            mb={5}
            color="#1d3448"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
          >
            We&apos;re going to ask you a few questions to get started.
          </Text>
          <Text
            mb={8}
            color="#1d3448"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="md"
          >
            This form takes ~10 minutes to complete. Your responses will not be saved if you close
            the tab, or exit this web page.
          </Text>
          <Button
            w="100%"
            maxW="518px"
            mt={2}
            size="lg"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
            fontSize="lg"
            bg="#056067"
            color="white"
            borderRadius="8px"
            border="1px solid #056067"
            boxShadow="none"
            _hover={{ bg: '#044953' }}
            px={8}
            py={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={handleContinueInEnglish}
          >
            Continue in English &nbsp; &rarr;
          </Button>
          <Button
            w="100%"
            maxW="518px"
            mt={4}
            size="lg"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
            fontSize="lg"
            bg="white"
            color="#056067"
            borderRadius="8px"
            border="1px solid #056067"
            boxShadow="none"
            _hover={{ bg: '#f0f0f0' }}
            px={8}
            py={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            _focus={{ boxShadow: 'none', outline: 'none' }}
            _active={{ boxShadow: 'none', outline: 'none' }}
            onClick={handleContinueInEnglish}
          >
            Continue en Francais &nbsp; &rarr;
          </Button>
          <Text
            mt={8}
            color="#1d3448"
            fontSize="md"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
          >
            Already have an account?{' '}
            <Link
              href="/"
              style={{
                color: '#056067',
                textDecoration: 'underline',
                fontWeight: 600,
                fontFamily: 'Open Sans, sans-serif',
              }}
            >
              Sign In
            </Link>
          </Text>
        </Box>
      </Flex>
      {/* Right: Image */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <img
          src="/login.png"
          alt="First Connection Peer Support"
          style={{ objectFit: 'cover', objectPosition: '90% 50%', width: '100%', height: '100%' }}
        />
      </Box>
    </Flex>
  );
}
