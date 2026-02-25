import { Box, Button, Flex, Text, VStack, HStack } from '@chakra-ui/react';
import { Match } from '@/types/matchTypes';
import Image from 'next/image';

interface ViewContactDetailsModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
}

export function ViewContactDetailsModal({ isOpen, match, onClose }: ViewContactDetailsModalProps) {
  if (!isOpen || !match) {
    return null;
  }

  const { volunteer } = match;
  const volunteerName = `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim();
  const displayName =
    volunteer.firstName && volunteer.lastName
      ? `${volunteer.firstName} ${volunteer.lastName[0]}.`
      : volunteerName;
  const phoneNumber = volunteer.phone || 'Not available';

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
        <Flex gap={{ base: 4, lg: 6 }} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
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
            alignSelf={{ base: 'center', lg: 'flex-start' }}
          >
            <Image src="/icons/phone-call.png" alt="Phone" width={24} height={24} />
          </Box>

          {/* Content */}
          <VStack align="stretch" gap={{ base: 4, lg: 6 }} flex={1} w="100%">
            {/* Text and supporting text */}
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
                You will get a call from your volunteer at your scheduled time.
              </Text>
            </VStack>

            {/* Contact Details */}
            <VStack align="stretch" gap={4}>
              {/* Name */}
              <HStack gap={{ base: 3, lg: 4.5 }} align="center" flexWrap="wrap">
                <Text
                  fontSize={{ base: '14px', lg: '16px' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875em"
                  w={{ base: 'auto', lg: '118px' }}
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

              {/* Phone Number */}
              <HStack gap={{ base: 3, lg: 4.5 }} align="center" flexWrap="wrap">
                <Text
                  fontSize={{ base: '14px', lg: '16px' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875em"
                  w={{ base: 'auto', lg: '118px' }}
                  flexShrink={0}
                >
                  Phone Number
                </Text>
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={400}
                  color="#056067"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.3333333333333333em"
                >
                  {phoneNumber}
                </Text>
              </HStack>
            </VStack>

            {/* Action Button */}
            <Flex justify={{ base: 'stretch', lg: 'flex-end' }} mt={2}>
              <Button
                bg="#056067"
                color="white"
                fontWeight={600}
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.5em"
                px={4.5}
                py={2.5}
                borderRadius="8px"
                w={{ base: '100%', lg: 'auto' }}
                onClick={onClose}
                _hover={{
                  bg: '#044d52',
                }}
                _active={{
                  bg: '#033a3e',
                }}
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
