import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface FieldProps extends BoxProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, children, ...boxProps }) => {
  return (
    <Box {...boxProps}>
      {label}
      {children}
    </Box>
  );
};
