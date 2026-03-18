import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';

interface TimeRequestNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRequests: () => void;
  participantName?: string;
}

export function TimeRequestNotificationModal({
  isOpen,
  onClose,
  onViewRequests,
  participantName,
}: TimeRequestNotificationModalProps) {
  if (!isOpen) {
    return null;
  }

  const displayName = participantName || 'A participant';

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
        maxW="480px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
        overflow="hidden"
      >
        <VStack align="center" gap={5} px={6} pt={6} pb={0}>
          {/* Warning Featured Icon */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="48px"
            h="48px"
            borderRadius="28px"
            bg="#FEF0C7"
            border="8px solid #FFFAEB"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.66 1.55 19.02C1.55 19.38 1.64 19.73 1.82 20.04C2 20.35 2.25 20.6 2.56 20.78C2.86 20.96 3.21 21.05 3.56 21.05H20.49C20.84 21.05 21.19 20.96 21.5 20.78C21.8 20.6 22.05 20.35 22.23 20.04C22.41 19.73 22.5 19.38 22.5 19.02C22.5 18.66 22.41 18.31 22.23 18L13.76 3.86C13.58 3.56 13.33 3.31 13.03 3.13C12.73 2.95 12.39 2.86 12.04 2.86C11.69 2.86 11.35 2.95 11.05 3.13C10.75 3.31 10.5 3.56 10.29 3.86Z"
                stroke="#DC6803"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>

          {/* Text Content */}
          <VStack align="center" gap={1}>
            <Text
              fontSize="18px"
              fontWeight={600}
              color="#181D27"
              fontFamily="'Open Sans', sans-serif"
              textAlign="center"
            >
              {displayName} requested new times!
            </Text>
            <Text
              fontSize="14px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
              textAlign="center"
              lineHeight="1.4"
            >
              {displayName} has proposed new times for your call. Review and choose an option when
              you&apos;re ready.
            </Text>
          </VStack>
        </VStack>

        {/* Action Buttons */}
        <Flex gap={3} px={6} py={6}>
          <Button
            flex={1}
            bg="white"
            color="#344054"
            border="1px solid #D0D5DD"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            borderRadius="8px"
            h="44px"
            boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
            _hover={{ bg: '#F9FAFB' }}
            onClick={onClose}
          >
            View Later
          </Button>
          <Button
            flex={1}
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            borderRadius="8px"
            h="44px"
            border="1px solid #056067"
            boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033a3e' }}
            onClick={onViewRequests}
          >
            View Request
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
