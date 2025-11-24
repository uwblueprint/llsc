import React from 'react';
import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import { COLORS } from '@/constants/colors';

interface DeactivateSuccessModalProps {
  isOpen: boolean;
  isReactivate: boolean;
  onClose: () => void;
}

export function DeactivateSuccessModal({
  isOpen,
  isReactivate,
  onClose,
}: DeactivateSuccessModalProps) {
  if (!isOpen) return null;

  const title = isReactivate ? 'Account Reactivated' : 'Account Deactivated';
  const description = isReactivate
    ? 'This volunteer is now eligible for matches again.'
    : 'This volunteer is no longer eligible for matches.';

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.5)"
      backdropFilter="blur(4px)"
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg={COLORS.white}
        borderRadius="lg"
        p={8}
        maxW="500px"
        w="90%"
        boxShadow={COLORS.shadow.lg}
      >
        <VStack align="stretch" gap={8} textAlign="center">
          {/* Checkmark Icon */}
          <Flex justify="center">
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              border="3px solid"
              borderColor={COLORS.teal}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={COLORS.white}
            >
              <Icon as={FiCheck} boxSize={10} color={COLORS.teal} strokeWidth={3} />
            </Box>
          </Flex>

          {/* Success Message */}
          <VStack align="stretch" gap={3}>
            <Heading fontSize="2xl" fontWeight="600" color={COLORS.veniceBlue}>
              {title}
            </Heading>
            <Text fontSize="md" color={COLORS.textSecondary} lineHeight="1.5">
              {description}
            </Text>
          </VStack>

          {/* Okay Button */}
          <Flex justify="center">
            <Button
              bg={COLORS.teal}
              color="white"
              _hover={{ bg: COLORS.tealDarker }}
              _active={{ bg: '#033a3e' }}
              onClick={onClose}
              w="100%"
              mx={0}
            >
              Okay!
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
