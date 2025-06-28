import React from 'react';
import { Box } from '@chakra-ui/react';

interface FieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  flex?: string | number;
}

export const Field: React.FC<FieldProps> = ({ label, children, flex }) => {
  return (
    <Box flex={flex}>
      {label}
      {children}
    </Box>
  );
};
