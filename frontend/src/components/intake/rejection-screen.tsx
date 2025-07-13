import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

// X mark icon component
const XMarkIcon: React.FC = () => (
  <Box
    w="80px"
    h="80px"
    borderRadius="50%"
    bg="white"
    border={`4px solid ${COLORS.teal}`}
    display="flex"
    alignItems="center"
    justifyContent="center"
    mb={6}
  >
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke={COLORS.teal}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

export function RejectionScreen() {
  return (
    <Box minH="100vh" bg="white" display="flex" alignItems="center" justifyContent="center" py={12}>
      <VStack gap={6}>
        <XMarkIcon />

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="24px"
          fontWeight={600}
          color={COLORS.veniceBlue}
          mb={2}
        >
          Your request has been declined.
        </Text>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18px"
          color={COLORS.fieldGray}
          lineHeight="1.6"
          maxW="600px"
          textAlign="center"
        >
          For any inquiries, please reach us at{' '}
          <Text as="span" color={COLORS.teal} fontWeight={500}>
            FirstConnections@lls.org
          </Text>
          .
        </Text>
      </VStack>
    </Box>
  );
}
