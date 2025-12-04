import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

interface CancelCallConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCancelling?: boolean;
}

export function CancelCallConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isCancelling = false,
}: CancelCallConfirmationModalProps) {
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
      zIndex={1000}
    >
      <Box
        bg="white"
        borderRadius="12px"
        p={6}
        maxW="400px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack align="center" gap={5} alignSelf="stretch">
          {/* Warning Icon */}
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

          {/* Text Content */}
          <VStack align="center" gap={2} alignSelf="stretch">
            <Text
              fontSize="20px"
              fontWeight={600}
              color="#181D27"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.4em"
              textAlign="center"
            >
              Are you sure you want to cancel your call?
            </Text>
            <Text
              fontSize="16px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.36181640625em"
              textAlign="center"
            >
              You can request new matches if you&apos;d like to connect with other volunteers.
            </Text>
          </VStack>

          {/* Action Buttons */}
          <Flex gap={3} alignSelf="stretch" w="100%">
            <Button
              flex={1}
              bg="rgba(179, 206, 209, 0.3)"
              color="#495D6C"
              fontWeight={600}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.5em"
              px={4.5}
              py={2.5}
              borderRadius="8px"
              onClick={onClose}
              _hover={{
                bg: 'rgba(179, 206, 209, 0.4)',
              }}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              bg="#A70000"
              color="white"
              fontWeight={600}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.5em"
              px={4.5}
              py={2.5}
              borderRadius="8px"
              onClick={onConfirm}
              loading={isCancelling}
              loadingText="Cancelling..."
              disabled={isCancelling}
              _hover={{
                bg: '#8B0000',
              }}
              _active={{
                bg: '#750000',
              }}
            >
              Cancel Call
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
