import React from 'react';
import { Box } from '@chakra-ui/react';

export const UserIcon: React.FC = () => (
  <Box mx="auto" display="flex" alignItems="center" justifyContent="center" mb={6}>
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--chakra-colors-brand-primary)"
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" strokeWidth="2" fill="none" />
    </svg>
  </Box>
);
