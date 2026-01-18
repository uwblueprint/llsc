import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { CheckMarkIcon } from '@/components/ui';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function VolunteerSecondaryApplicationThankYouPage() {
  const t = useTranslations('dashboard');

  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.SECONDARY_APPLICATION_SUBMITTED]}>
        <Flex minH="100vh" bg="gray.50" justify="center" py={12}>
          <Box
            w="full"
            maxW="800px"
            bg="white"
            borderRadius="8px"
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            p={{ base: 6, md: 12 }}
            textAlign="center"
          >
            <VStack gap={6}>
              <CheckMarkIcon />

              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color="brand.navy"
                fontSize={{ base: '28px', md: '32px' }}
                mb={2}
              >
                {t('success')}
              </Heading>
              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color="brand.navy"
                fontSize={{ base: '28px', md: '32px' }}
                mb={4}
              >
                {t('successThankYou')}
              </Heading>

              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="16px"
                color="gray.600"
                lineHeight="1.6"
                maxW="600px"
                textAlign="center"
              >
                {t('weWillReachOut5to7Days')}{' '}
                <Text as="span" color="brand.primary" fontWeight={500}>
                  FirstConnections@lls.org
                </Text>
                . {t('llscWorkingDays')}
              </Text>
            </VStack>
          </Box>
        </Flex>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
