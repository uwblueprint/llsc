import { Box, Button, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

interface CallCancelledNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelledByName: string;
}

export function CallCancelledNotificationModal({
  isOpen,
  onClose,
  cancelledByName,
}: CallCancelledNotificationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(16, 24, 40, 0.5)"
      backdropFilter="blur(8px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1200}
    >
      <Box
        bg="white"
        borderRadius="12px"
        p={6}
        maxW="400px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack align="center" gap={5}>
          {/* Error Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="#FEE4E2"
            border="8px solid"
            borderColor="#FEF3F2"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiAlertCircle} boxSize={6} color="#D92D20" />
          </Box>

          <VStack align="center" gap={2} alignSelf="stretch">
            <Text
              fontSize="20px"
              fontWeight={600}
              color="#181D27"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.4em"
              textAlign="center"
            >
              Call Cancelled
            </Text>
            <Text
              fontSize="16px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.36em"
              textAlign="center"
            >
              {cancelledByName} has cancelled the scheduled call. No further action is required on
              your end.
            </Text>
          </VStack>

          <Button
            w="100%"
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            lineHeight="1.5em"
            px={4.5}
            py={2.5}
            borderRadius="8px"
            onClick={onClose}
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033a3e' }}
          >
            Okay
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
