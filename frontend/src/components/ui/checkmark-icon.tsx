import React from 'react';
import { Box } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

export const CheckMarkIcon: React.FC = () => (
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
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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