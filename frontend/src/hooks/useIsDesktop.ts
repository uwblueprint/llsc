'use client';

import { useBreakpointValue } from '@chakra-ui/react';

export const useIsDesktop = (): boolean => {
  return useBreakpointValue({ base: false, lg: true }) ?? false;
};
