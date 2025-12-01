import React from 'react';
import { Box, Flex, Text, Link } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { logout } from '@/APIClients/authAPIClient';
import { COLORS } from '@/constants/form';

interface IntakeHeaderProps {
  title: string;
}

export function IntakeHeader({ title }: IntakeHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    await router.push('/');
  };

  return (
    <Flex
      w="full"
      maxW="1200px"
      justify="space-between"
      align="center"
      mb={8}
      px={4}
    >
      <Text
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="28px"
      >
        {title}
      </Text>
      <Link
        onClick={handleSignOut}
        style={{
          color: COLORS.veniceBlue,
          textDecoration: 'underline',
          fontWeight: 400,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Sign out
      </Link>
    </Flex>
  );
}
