import { Box, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface FormPageLayoutProps {
  children: ReactNode;
  /**
   * Maximum width of the form container
   * @default "1200px"
   */
  maxW?: string;
  /**
   * Background color of the outer container
   * @default "gray.50"
   */
  bg?: string;
  /**
   * Whether a dropdown is currently open (adds extra bottom padding to prevent clipping)
   * @default false
   */
  hasDropdownOpen?: boolean;
}

/**
 * Layout component for multi-step form pages.
 * Provides a centered container with responsive padding and consistent styling.
 *
 * @example
 * ```tsx
 * <FormPageLayout maxW="800px">
 *   <PersonalInfoForm onSubmit={handleSubmit} />
 * </FormPageLayout>
 * ```
 */
export function FormPageLayout({
  children,
  maxW = '1200px',
  bg = 'gray.50',
  hasDropdownOpen = false,
}: FormPageLayoutProps) {
  return (
    <Flex
      minH="100vh"
      bg={bg}
      justify="center"
      pt={12}
      pb={hasDropdownOpen ? '50vh' : 12}
      overflow="visible"
    >
      <Box
        w="full"
        maxW={maxW}
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={{ base: 6, md: 10 }}
        overflow="visible"
        position="relative"
      >
        {children}
      </Box>
    </Flex>
  );
}
