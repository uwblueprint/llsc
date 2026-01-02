import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

interface SendMatchesConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participantName?: string;
  matchCount: number;
  isSending?: boolean;
}

export function SendMatchesConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  participantName,
  matchCount,
  isSending = false,
}: SendMatchesConfirmationModalProps) {
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
        maxW="500px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack align="center" gap={5} alignSelf="stretch">
          {/* Warning Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="#FEF0C7"
            border="8px solid"
            borderColor="#FFFBEB"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiAlertCircle} boxSize={6} color="#DC6803" />
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
              Are you sure you want to send these matches
              {participantName ? ` to ${participantName}` : ''}?
            </Text>
            <Text
              fontSize="16px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.36181640625em"
              textAlign="center"
            >
              Once submitted, {matchCount === 1 ? 'this match will' : 'these matches will'} be
              shared
              {participantName ? ` with ${participantName}` : ' with the participant'} for review.
              Please ensure all selections are accurate.
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
              disabled={isSending}
              _hover={{
                bg: 'rgba(179, 206, 209, 0.4)',
              }}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              bg="#056067"
              color="white"
              fontWeight={600}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.5em"
              px={4.5}
              py={2.5}
              borderRadius="8px"
              onClick={onConfirm}
              disabled={isSending}
              loading={isSending}
              loadingText="Sending..."
              _hover={{
                bg: '#044d52',
              }}
              _active={{
                bg: '#033a3e',
              }}
            >
              Confirm
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
