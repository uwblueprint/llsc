import Link from 'next/link';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCurrentUser, syncCurrentUser } from '@/APIClients/authAPIClient';
import { AuthenticatedUser, FormStatus, UserRole } from '@/types/authTypes';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { getRedirectRoute } from '@/constants/formStatusRoutes';
import { AuthPageLayout } from '@/components/layout';

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
              await router.replace('/admin/directory');
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
      router.push('/admin/directory');
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
            Welcome to our application portal!
          </Heading>
        </Box>

        <VStack spacing={4}>
          <Text color="brand.navy" fontSize="md">
            You can learn more about the program{' '}
            <a
              href="#"
              style={{ color: 'var(--chakra-colors-brand-primary)', textDecoration: 'underline' }}
            >
              here
            </a>
            .
          </Text>
          <Text color="brand.navy" fontSize="md">
            We&apos;re going to ask you a few questions to get started.
          </Text>
          <Text color="brand.navy" fontSize="md">
            This form takes ~10 minutes to complete. Your responses will not be saved if you close
            the tab, or exit this web page.
          </Text>
        </VStack>

        <Button
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
          onClick={handleContinueInEnglish}
        >
          Continue in English &nbsp; &rarr;
        </Button>
        <Button
          w="full"
          size="lg"
          fontWeight={600}
          fontSize="lg"
          bg="white"
          color="brand.primary"
          borderRadius="8px"
          border="1px solid"
          borderColor="brand.primary"
          boxShadow="none"
          _hover={{ bg: 'gray.50' }}
          px={8}
          py={3}
          onClick={handleContinueInEnglish}
        >
          Continue en Francais &nbsp; &rarr;
        </Button>

        <Text color="brand.navy" fontSize="md" fontWeight={600}>
          Already have an account?{' '}
          <Link
            href="/"
            style={{
              color: 'var(--chakra-colors-brand-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </Text>
      </VStack>
    </AuthPageLayout>
  );
}
