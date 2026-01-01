import { SimpleGrid } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface ResponsiveFieldGroupProps {
  children: ReactNode;
  /**
   * Number of columns on medium+ screens
   * @default 2
   */
  columns?: number;
  /**
   * Gap between fields
   * @default 4
   */
  gap?: number | string;
}

/**
 * Responsive field group that stacks fields vertically on mobile
 * and displays them in columns on tablet and desktop.
 *
 * Replaces the pattern of `HStack` + `FormField flex="1"` with automatic
 * responsive behavior.
 *
 * @example
 * ```tsx
 * <ResponsiveFieldGroup>
 *   <FormField label="First Name">...</FormField>
 *   <FormField label="Last Name">...</FormField>
 * </ResponsiveFieldGroup>
 * ```
 */
export function ResponsiveFieldGroup({
  children,
  columns = 2,
  gap = 4,
}: ResponsiveFieldGroupProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: columns }} gap={gap} w="full">
      {children}
    </SimpleGrid>
  );
}
