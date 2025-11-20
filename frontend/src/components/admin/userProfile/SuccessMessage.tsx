import { Box, Text } from '@chakra-ui/react';
import { SaveMessage } from '@/types/userProfileTypes';

interface SuccessMessageProps {
  message: SaveMessage | null;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <Box
      position="fixed"
      top="20px"
      right="20px"
      zIndex={1000}
      p={4}
      borderRadius="md"
      boxShadow="lg"
      bg={message.type === 'success' ? 'green.50' : 'red.50'}
      border="1px solid"
      borderColor={message.type === 'success' ? 'green.200' : 'red.200'}
      minW="300px"
    >
      <Text fontSize="sm" fontWeight={500} color={message.type === 'success' ? 'green.700' : 'red.700'}>
        {message.text}
      </Text>
    </Box>
  );
}

