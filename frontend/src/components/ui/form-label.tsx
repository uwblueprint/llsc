'use client';

import { Text, type TextProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface FormLabelProps extends Omit<TextProps, 'as'> {
  children: ReactNode;
}

export function FormLabel({ children, ...props }: FormLabelProps) {
  return (
    <Text as="span" color="brand.fieldText" fontWeight={600} fontSize="sm" {...props}>
      {children}
    </Text>
  );
}
