import { Box, Button, Flex, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { FiPhone } from 'react-icons/fi';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface ParticipantContactInfo {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface ViewParticipantContactModalProps {
  isOpen: boolean;
  participant: ParticipantContactInfo | null;
  onClose: () => void;
}

export function ViewParticipantContactModal({
  isOpen,
  participant,
  onClose,
}: ViewParticipantContactModalProps) {
  const isDesktop = useIsDesktop();

  if (!isOpen || !participant) {
    return null;
  }

  const displayName =
    participant.firstName && participant.lastName
      ? `${participant.firstName} ${participant.lastName[0]}.`
      : `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email;

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
        maxW="544px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <Flex
          gap={6}
          align={isDesktop ? 'flex-start' : 'center'}
          direction={{ base: 'column', lg: 'row' }}
        >
          {/* Phone Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="rgba(179, 206, 209, 0.3)"
            border="8px solid"
            borderColor="#F5F5FF"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Icon as={FiPhone} boxSize={5} color="#056067" />
          </Box>

          {/* Content */}
          <VStack align="stretch" gap={6} flex={1} w="100%">
            <VStack align={{ base: 'center', lg: 'stretch' }} gap={2}>
              <Text
                fontSize={{ base: '18px', lg: '20px' }}
                fontWeight={600}
                color="#181D27"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.4em"
                textAlign={{ base: 'center', lg: 'left' }}
              >
                Your call is set!
              </Text>
              <Text
                fontSize={{ base: '14px', lg: '16px' }}
                fontWeight={400}
                color="#535862"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.36181640625em"
                textAlign={{ base: 'center', lg: 'left' }}
              >
                Here are the contact details for your participant.
              </Text>
            </VStack>

            <VStack align="stretch" gap={4}>
              <HStack gap={4.5} align="center">
                <Text
                  fontSize={{ base: '14px', lg: '16px' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875em"
                  w={{ base: '80px', lg: '118px' }}
                  flexShrink={0}
                >
                  Name
                </Text>
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={400}
                  color="#056067"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.3333333333333333em"
                >
                  {displayName}
                </Text>
              </HStack>

              <HStack gap={4.5} align="center">
                <Text
                  fontSize={{ base: '14px', lg: '16px' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875em"
                  w={{ base: '80px', lg: '118px' }}
                  flexShrink={0}
                >
                  Email
                </Text>
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={400}
                  color="#056067"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.3333333333333333em"
                  wordBreak="break-all"
                >
                  {participant.email}
                </Text>
              </HStack>
            </VStack>

            <Flex justify={{ base: 'stretch', lg: 'flex-end' }} mt={2}>
              <Button
                w={{ base: '100%', lg: 'auto' }}
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
                Okay!
              </Button>
            </Flex>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
}
