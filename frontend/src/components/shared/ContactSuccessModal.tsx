import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';

interface ContactSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSuccessModal({ isOpen, onClose }: ContactSuccessModalProps) {
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
          {/* Success Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="#D1FADF"
            border="8px solid"
            borderColor="#ECFDF3"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiCheckCircle} boxSize={6} color="#039855" />
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
              Message sent!
            </Text>
            <Text
              fontSize="16px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.36181640625em"
              textAlign="center"
            >
              A staff member will get back to you as soon as possible.
            </Text>
          </VStack>

          {/* Action Button */}
          <Flex alignSelf="stretch" w="100%">
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
      </Box>
    </Box>
  );
}
