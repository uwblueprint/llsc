import { Box, HStack } from '@chakra-ui/react';

interface StepIndicatorProps {
  /**
   * Current step number (1-indexed)
   */
  currentStep: number;
  /**
   * Total number of steps (component always renders 3 segments)
   * @default 3
   */
  totalSteps?: number;
}

/**
 * Visual progress indicator for multi-step forms.
 * Always renders 3 segments, highlighting the current step.
 *
 * @example
 * ```tsx
 * <StepIndicator currentStep={2} />
 * ```
 */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  // Always render 3 segments as per current implementation
  const segments = 3;

  return (
    <Box mb={10}>
      <HStack gap={3}>
        {Array.from({ length: segments }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;

          return (
            <Box key={stepNumber} flex="1">
              <Box h="3px" bg={isActive ? 'brand.primary' : 'gray.300'} borderRadius="full" />
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
}
