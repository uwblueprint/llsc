import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { CheckMarkIcon } from '@/components/ui';
import { FormPageLayout } from '@/components/layout';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function ParticipantRankingThankYouPage() {
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
                mb={2}
              >
                Thank you for sharing your experience and
              </Heading>
              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color="brand.navy"
                fontSize={{ base: '28px', md: '32px' }}
                mb={4}
              >
                preferences with us.
              </Heading>

              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="16px"
                color="brand.fieldText"
                lineHeight="1.6"
                maxW="600px"
                textAlign="center"
              >
                We are reviewing which volunteers would best fit those preferences. You will receive
                an email from us in the next 1-2 business days with the next steps. If you would
                like to connect with a LLSC staff before then, please reach out to{' '}
                <Text as="span" color="brand.primary" fontWeight={500}>
                  FirstConnections@lls.org
                </Text>
                .
              </Text>
            </VStack>
          </Box>
        </FormPageLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
