import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

interface WelcomeScreenProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  icon,
  title,
  description,
  buttonText = 'Continue',
  onContinue,
}) => (
  <Box
    minH="100vh"
    bg={COLORS.lightGray}
    display="flex"
    alignItems="center"
    justifyContent="center"
    px={4}
  >
    <Box w="full" maxW="384px" mx="auto" textAlign="center">
      {icon}

      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color="#1f2937"
        fontSize="20px"
        mb={4}
        lineHeight="tight"
      >
        {title}
      </Heading>

      <Text
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14px"
        color={COLORS.fieldGray}
        mb={8}
        lineHeight="relaxed"
        dangerouslySetInnerHTML={{ __html: description }}
      />

      <Button
        bg={COLORS.teal}
        color="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={500}
        fontSize="14px"
        display="inline-flex"
        alignItems="center"
        gap={2}
        px={5}
        py="10px"
        h="auto"
        borderRadius="8px"
        _hover={{ bg: COLORS.teal, opacity: 0.9 }}
        _active={{ bg: COLORS.teal }}
        onClick={onContinue}
      >
        {buttonText}
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </Box>
  </Box>
);
