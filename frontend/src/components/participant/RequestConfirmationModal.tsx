import { Box, Button, Container, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

interface RequestConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestConfirmationModal({ isOpen, onClose }: RequestConfirmationModalProps) {
  const t = useTranslations('dashboard');

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="white"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="container.sm">
        <VStack align="stretch" gap={8} textAlign="center">
          {/* Checkmark Icon */}
          <Flex justify="center">
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              border="3px solid"
              borderColor="#056067"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="white"
            >
              <Icon as={FiCheck} boxSize={10} color="#056067" strokeWidth={3} />
            </Box>
          </Flex>

          {/* Success Message */}
          <VStack align="stretch" gap={3}>
            <Heading fontSize="2xl" fontWeight="600" color="#1D3448">
              {t('success')}
            </Heading>
            <Text fontSize="md" color="#697380" lineHeight="1.5">
              {t('weHaveReceivedRequest')}
            </Text>
          </VStack>

          {/* Back Button */}
          <Flex justify="center">
            <Button
              bg="#056067"
              color="white"
              _hover={{ bg: '#044d52' }}
              _active={{ bg: '#033a3e' }}
              onClick={onClose}
              px={8}
            >
              {t('backToDashboard')}
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
