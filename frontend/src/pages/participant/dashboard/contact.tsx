import { useEffect, useState } from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import {
  DashboardSidebar,
  useParticipantNavItems,
} from '@/components/participant/DashboardSidebar';
import { ContactForm } from '@/components/shared/ContactForm';
import ParticipantEditProfileModal from '@/components/participant/ParticipantEditProfileModal';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import { AuthenticatedUser, FormStatus, UserRole } from '@/types/authTypes';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function ParticipantContactPage() {
  const isDesktop = useIsDesktop();
  const navItems = useParticipantNavItems();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <Box minH="100vh" bg="white">
          {/* Mobile Header */}
          {!isDesktop && (
            <MobileHeader
              userName={userName}
              onMenuOpen={() => setIsMobileMenuOpen(true)}
              onAvatarClick={() => setIsEditProfileOpen(true)}
            />
          )}

          {/* Mobile Drawer */}
          <MobileDrawer
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            userName={userName}
            navItems={navItems}
            onEditProfile={() => setIsEditProfileOpen(true)}
          />

          <Box py={{ base: 4, lg: 10 }}>
            <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                align="flex-start"
                gap={{ base: 6, lg: 12 }}
              >
                <DashboardSidebar />

                <Box flex={1} w="full">
                  {/* User Avatar in top right - desktop only */}
                  {user && isDesktop && (
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
