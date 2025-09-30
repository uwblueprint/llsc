import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function ParticipantDashboardPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
          <VStack spacing={4} bg="white" p={12} borderRadius="lg" boxShadow="md" maxW="lg" textAlign="center">
            <Heading size="lg">Participant dashboard coming soon</Heading>
            <Text>
              Thanks for completing your forms. We&apos;re building the dashboard experience—stay tuned
              for upcoming program updates.
            </Text>
          </VStack>
        </Box>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
