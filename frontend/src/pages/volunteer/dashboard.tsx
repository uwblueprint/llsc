import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function VolunteerDashboardPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
          <VStack spacing={4} bg="white" p={12} borderRadius="lg" boxShadow="md" maxW="lg" textAlign="center">
            <Heading size="lg">Volunteer dashboard coming soon</Heading>
            <Text>
              You&apos;ve finished the application flow. Once the dashboard is ready, we&apos;ll guide you
              through next steps from here.
            </Text>
          </VStack>
        </Box>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
