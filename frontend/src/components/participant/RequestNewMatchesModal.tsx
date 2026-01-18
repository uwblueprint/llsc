import { useState } from 'react';
import { Box, Button, Container, Flex, Heading, Text, Textarea, VStack } from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

interface RequestNewMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function RequestNewMatchesModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RequestNewMatchesModalProps) {
  const t = useTranslations('dashboard');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    await onSubmit(message.trim() || undefined);
    setMessage(''); // Reset form
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      onClose();
    }
  };

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
      overflowY="auto"
    >
      <Container maxW="container.md" pt={6} pb={10}>
        <VStack align="stretch" gap={8}>
          {/* Back Button */}
          <Flex>
            <Flex
              as="button"
              align="center"
              gap={2}
              onClick={handleClose}
              color="#1D3448"
              fontSize="md"
              fontWeight="500"
              cursor={isSubmitting ? 'not-allowed' : 'pointer'}
              opacity={isSubmitting ? 0.5 : 1}
              _hover={!isSubmitting ? { opacity: 0.8 } : {}}
              _disabled={{ cursor: 'not-allowed', opacity: 0.5 }}
              bg="transparent"
              border="none"
              p={0}
              aria-disabled={isSubmitting}
            >
              <Icon as={FiChevronLeft} boxSize={5} />
              <Text>{t('back')}</Text>
            </Flex>
          </Flex>

          {/* Main Content */}
          <VStack align="stretch" gap={8} flex={1}>
            {/* Heading */}
            <VStack align="stretch" gap={2}>
              <Heading fontSize="2xl" fontWeight="600" color="#1D3448">
                {t('doYouWantNewVolunteers')}
              </Heading>
              <Text fontSize="md" color="#697380" lineHeight="1.5">
                {t('processMayTakeDays')}
              </Text>
            </VStack>

            {/* Additional Notes Section */}
            <VStack align="stretch" gap={3}>
              <VStack align="stretch" gap={1}>
                <Heading fontSize="md" fontWeight="600" color="#1D3448">
                  {t('anyAdditionalNotes')}
                </Heading>
                <Text fontSize="sm" color="#697380" lineHeight="1.5">
                  {t('pleaseProvideAdditionalInfo')}
                </Text>
              </VStack>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('shareYourThoughts')}
                minH="200px"
                resize="vertical"
                border="1px solid"
                borderColor="#D5D7DA"
                borderRadius="md"
                p={4}
                _focus={{
                  borderColor: '#056067',
                  boxShadow: '0 0 0 1px #056067',
                }}
                disabled={isSubmitting}
                fontSize="md"
                bg="white"
              />
            </VStack>

            {/* Action Buttons */}
            <Flex justify="flex-end" gap={3} pt={4}>
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                color="#697380"
                bg="#B3CED14D"
                border="1px solid"
                borderColor="#B3CED14D"
                _hover={{ bg: '#B3CED14D', opacity: 0.8 }}
                px={6}
              >
                {t('cancel')}
              </Button>
              <Button
                bg="#056067"
                color="white"
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033a3e' }}
                onClick={handleSubmit}
                loading={isSubmitting}
                loadingText={t('submitting')}
                disabled={isSubmitting}
                px={6}
              >
                {t('submitRequest')}
              </Button>
            </Flex>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
