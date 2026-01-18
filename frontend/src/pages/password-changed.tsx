import React from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { AuthPageLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function PasswordChangedPage() {
  const router = useRouter();
  const t = useTranslations('auth');

  return (
    <AuthPageLayout>
      <VStack spacing={6} textAlign="center" align="center">
        <Box as="span">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="40"
              cy="40"
              r="38"
              stroke="var(--chakra-colors-brand-primary)"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M25 43L37 55L56 32"
              stroke="var(--chakra-colors-brand-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
        <Heading color="brand.navy" fontWeight={700}>
          {t('passwordChanged')}
        </Heading>
        <Text color="brand.navy" fontSize="lg">
          {t('canSignInNow')}
        </Text>
        <Button
          bg="brand.primary"
          color="white"
          fontWeight={600}
          fontSize="lg"
          borderRadius="8px"
          border="1px solid"
          borderColor="brand.primary"
          px={8}
          py={3}
          onClick={() => router.push('/')}
          _hover={{ bg: 'brand.primaryEmphasis' }}
          w={{ base: '100%', md: '320px' }}
        >
          {t('returnToLogIn')} &nbsp; &rarr;
        </Button>
      </VStack>
    </AuthPageLayout>
  );
}
