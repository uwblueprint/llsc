import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { CheckMarkIcon } from '@/components/ui';
import { FormPageLayout } from '@/components/layout';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function ParticipantRankingThankYouPage() {
  const t = useTranslations('ranking');
  const tIntake = useTranslations('intake');

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.RANKING_SUBMITTED]}>
        <FormPageLayout maxW="800px">
          <Box textAlign="center">
            <VStack gap={6}>
              <CheckMarkIcon />

              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color="brand.navy"
                fontSize={{ base: '28px', md: '32px' }}
                mb={4}
              >
                {t('thankYouSharing')}
              </Heading>

              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="16px"
                color="brand.fieldText"
                lineHeight="1.6"
                maxW="600px"
                textAlign="center"
              >
                {t('reviewingVolunteers')} {t('preferencesReceiveEmail')} {t('1to2BusinessDays')}{' '}
                {t('connectWithStaffBefore')}{' '}
                <Text as="span" color="brand.primary" fontWeight={500}>
                  {tIntake('contactEmail')}
                </Text>
                . {tIntake('llscWorkingDays')} {tIntake('workingDaysMonThurs')}
              </Text>
            </VStack>
          </Box>
        </FormPageLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
