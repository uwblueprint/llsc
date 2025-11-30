import { useEffect, useState } from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { DashboardSidebar } from '@/components/participant/DashboardSidebar';
import { ContactForm } from '@/components/shared/ContactForm';
import ParticipantEditProfileModal from '@/components/participant/ParticipantEditProfileModal';
import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import { AuthenticatedUser, FormStatus, UserRole } from '@/types/authTypes';

export default function ParticipantContactPage() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(getCurrentUser());
    }
  }, []);

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : '';

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" bg="white" py={10}>
          <Container maxW="container.xl">
            <Flex
              direction={{ base: 'column', lg: 'row' }}
              align="flex-start"
              gap={{ base: 8, lg: 12 }}
            >
              <DashboardSidebar />

              <Box flex={1} w="full">
                {/* User Avatar in top right */}
                {user && (
                  <Flex justify="flex-end" mb={6}>
                    <Box
                      cursor="pointer"
                      onClick={() => setIsEditProfileOpen(true)}
                      _hover={{ opacity: 0.8 }}
                      transition="opacity 0.2s"
                    >
                      <Avatar
                        name={userName}
                        size="lg"
                        bg="rgba(179, 206, 209, 0.3)"
                        color="#056067"
                        fontWeight={500}
                      />
                    </Box>
                  </Flex>
                )}

                {/* Contact Form */}
                <ContactForm redirectPath="/participant/dashboard" />
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Edit Profile Modal */}
        <ParticipantEditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
