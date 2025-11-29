import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { COLORS as UI_COLORS } from '@/constants/colors';
import { COLORS as FORM_COLORS } from '@/constants/form';

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, description, children }) => (
  <Box
    bg={UI_COLORS.white}
    border="1px solid"
    borderColor={UI_COLORS.gray300}
    borderRadius="24px"
    boxShadow="0px 12px 24px rgba(16, 24, 40, 0.08)"
    p="32px"
  >
    <Heading
      as="h2"
      fontFamily="'Open Sans', sans-serif"
      fontWeight={600}
      color={UI_COLORS.veniceBlue}
      fontSize="24px"
      mb={description ? 2 : 4}
    >
      {title}
    </Heading>
    {description && (
      <Text
        color={FORM_COLORS.fieldGray}
        fontFamily="'Open Sans', sans-serif"
        fontSize="15px"
        mb={6}
        maxW="720px"
      >
        {description}
      </Text>
    )}
    <Box>{children}</Box>
  </Box>
);
