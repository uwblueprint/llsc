import React from 'react';
import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import { COLORS } from '@/constants/colors';

interface DeactivateConfirmationModalProps {
  isOpen: boolean;
  isReactivate: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function DeactivateConfirmationModal({
  isOpen,
  isReactivate,
  onClose,
  onConfirm,
  isProcessing = false,
}: DeactivateConfirmationModalProps) {
  if (!isOpen) return null;

  const title = isReactivate
    ? 'Are you sure you want to reactivate this account?'
    : 'Are you sure you want to deactivate this account?';
  const description = isReactivate
    ? 'This volunteer will become eligible for matches again.'
    : 'This volunteer will no longer be eligible for matches until they are reactivated.';
  const confirmButtonText = isReactivate ? 'Reactivate Account' : 'Deactivate Account';

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
      onClick={onClose}
    >
      <Box
        bg={COLORS.white}
        borderRadius="lg"
        p={8}
        maxW="500px"
        w="90%"
        onClick={(e) => e.stopPropagation()}
        boxShadow={COLORS.shadow.lg}
      >
        <VStack align="stretch" gap={6} textAlign="center">
          {/* Warning Icon */}
          <Flex justify="center">
            <Box
              w="64px"
              h="64px"
              borderRadius="full"
              bg="#FEE2E2"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiAlertCircle} boxSize={8} color={COLORS.red} />
            </Box>
          </Flex>

          {/* Title */}
          <Heading fontSize="xl" fontWeight="600" color={COLORS.veniceBlue}>
            {title}
          </Heading>

          {/* Description */}
          <Text fontSize="md" color={COLORS.textSecondary} lineHeight="1.5">
            {description}
          </Text>

          {/* Action Buttons */}
          <Flex justify="space-between" gap={3} pt={2}>
            <Button
              onClick={onClose}
              disabled={isProcessing}
              color={COLORS.textSecondary}
              bg={COLORS.hoverBg}
              border="1px solid"
              borderColor={COLORS.grayBorder}
              _hover={{ bg: COLORS.lightBgHover }}
              flex="1"
            >
              Cancel
            </Button>
            <Button
              bg={COLORS.red}
              color="white"
              _hover={{ bg: '#8a0000' }}
              onClick={onConfirm}
              disabled={isProcessing}
              flex="1"
            >
              {confirmButtonText}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
