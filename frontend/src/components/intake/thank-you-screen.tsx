import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

// Check mark icon component
const CheckMarkIcon: React.FC = () => (
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
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke={COLORS.teal}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

export function ThankYouScreen() {
  return (
    <Box
      minH="100vh"
      bg={COLORS.lightGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      <Box
        w="full"
        maxW="600px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
        textAlign="center"
      >
        <VStack gap={6}>
          <CheckMarkIcon />
          
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={2}
          >
            Thank you!
          </Heading>
          
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={4}
          >
            Your request has been received.
          </Heading>
          
          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
            maxW="500px"
            textAlign="center"
          >
            You will receive a confirmation email. A staff member will call you within 4-5 business days to better understand your match preferences. For any inquiries, please reach us at{' '}
            <Text as="span" color={COLORS.teal} fontWeight={500}>
              placeholder@placeholder.com
            </Text>
            .
          </Text>
        </VStack>
      </Box>
    </Box>
  );
} 
