import React from 'react';
import Link from 'next/link';
import { Heading, Text, Button, VStack } from '@chakra-ui/react';
import { AuthPageLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function Unauthorized() {
  const t = useTranslations('auth');

  return (
    <AuthPageLayout>
      <VStack spacing={6} textAlign="center" align="center">
        <Heading
          as="h1"
          size="4xl"
          bgGradient="linear(to-r, brand.primary, brand.navy)"
          bgClip="text"
        >
          403
        </Heading>

        <Heading as="h2" size="xl" color="brand.navy">
          {t('accessDenied')}
        </Heading>

        <Text color="gray.500" fontSize="lg">
          {t('noPermission')}
          <br />
          {t('contactAdministrator')}
        </Text>

        <Button
          as={Link}
          href="/"
          bg="brand.primary"
          color="white"
          size="lg"
          fontWeight={600}
          w="full"
          maxW="320px"
          _hover={{ bg: 'brand.navy' }}
        >
          {t('goToHomePage')}
        </Button>
      </VStack>
    </AuthPageLayout>
  );
}
