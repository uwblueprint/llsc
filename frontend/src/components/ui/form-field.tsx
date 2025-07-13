import React from 'react';
import { Text, Box } from '@chakra-ui/react';
import { Field } from './field';
import { COLORS } from '@/constants/form';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  flex?: string | number;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children, flex }) => {
  return (
    <Box position="relative" flex={flex}>
      <Field
        label={
          <Text
            color={COLORS.veniceBlue}
            fontWeight={500}
            fontSize="14px"
            fontFamily="system-ui, -apple-system, sans-serif"
            mb={1}
          >
            {label}
          </Text>
        }
      >
        {children}
      </Field>
      {error && (
        <Text color="red.500" fontSize="12px" position="absolute" bottom="-20px" left="0">
          {error}
        </Text>
      )}
    </Box>
  );
};
