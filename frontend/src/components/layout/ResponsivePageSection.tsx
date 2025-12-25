'use client';

import { Box, type BoxProps } from '@chakra-ui/react';

interface ResponsivePageSectionProps extends BoxProps {
  withShadow?: boolean;
}

export function ResponsivePageSection({
  children,
  withShadow = true,
  ...rest
}: ResponsivePageSectionProps) {
  return (
    <Box
      w="full"
      maxW={{ base: 'container.sm', md: 'container.md', lg: 'container.lg' }}
      mx="auto"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 10 }}
      bg="brand.surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.border"
      boxShadow={withShadow ? '0px 10px 35px rgba(65, 70, 81, 0.08)' : 'none'}
      {...rest}
    >
      {children}
    </Box>
  );
}
