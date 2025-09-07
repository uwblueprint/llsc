import React from 'react';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * Simple loading component for protected pages
 */
export const AuthLoadingSkeleton: React.FC = () => {
  return (
    <Flex minH="100vh" align="center" justify="center">
      <Box textAlign="center">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text fontSize="lg" color="gray.600" mt={4}>
          Loading...
        </Text>
      </Box>
    </Flex>
  );
};
