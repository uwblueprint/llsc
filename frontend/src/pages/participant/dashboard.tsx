import { useEffect, useState } from 'react';
import { Box, Button, Container, Flex, Heading, Icon, Spinner, Text, VStack } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { DashboardSidebar } from '@/components/participant/DashboardSidebar';
import { VolunteerCard } from '@/components/participant/VolunteerCard';
import { RequestNewMatchesModal } from '@/components/participant/RequestNewMatchesModal';
import { RequestConfirmationModal } from '@/components/participant/RequestConfirmationModal';
import { participantMatchAPIClient } from '@/APIClients/participantMatchAPIClient';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { Match } from '@/types/matchTypes';

export default function ParticipantDashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'contact'>('matches');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = getCurrentUser();
  const userName = user?.firstName || 'there';

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await participantMatchAPIClient.getMyMatches();
      // Filter to only show matches that are pending (accepted by volunteer, not yet scheduled)
      const pendingMatches = data.matches.filter(
        (match) => match.matchStatus === 'pending' || match.matchStatus === 'requesting_new_times'
      );
      setMatches(pendingMatches);
      setHasPendingRequest(data.hasPendingRequest || false);
    } catch (err) {
      console.error('Error loading matches:', err);
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'detail' in err.response.data
          ? String((err.response as { data: { detail: unknown } }).data.detail)
          : 'Failed to load matches. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (matchId: number) => {
    console.log('Schedule flow not implemented yet for match:', matchId);
    // TODO: Implement schedule flow
  };

  const handleRequestNewMatchesClick = () => {
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async (message?: string) => {
    try {
      setIsSubmitting(true);
      await participantMatchAPIClient.requestNewVolunteers(message);
      setIsRequestModalOpen(false);
      setIsConfirmationModalOpen(true);
      // Reload matches after requesting new volunteers
      await loadMatches();
    } catch (err) {
      console.error('Error requesting new matches:', err);
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'detail' in err.response.data
          ? String((err.response as { data: { detail: unknown } }).data.detail)
          : 'Failed to request new matches. Please try again.';
      setError(errorMessage);
      setIsRequestModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setIsConfirmationModalOpen(false);
  };

  const renderMatchesTab = () => {
    // If pending request, don't show any content (header already shows pending message)
    if (hasPendingRequest) {
      return null;
    }

    if (loading) {
      return (
        <Box py={12} textAlign="center">
          <Spinner size="xl" color="#056067" />
        </Box>
      );
    }

    if (error) {
      return (
        <Box bg="red.50" border="1px" borderColor="red.200" borderRadius="md" p={4}>
          <Text color="red.700" fontWeight="medium">
            {error}
          </Text>
        </Box>
      );
    }

    if (matches.length === 0) {
      return (
        <Box bg="white" borderRadius="lg" p={8} textAlign="center" boxShadow="sm">
          <Heading size="lg" color="gray.800" mb={3}>
            No matches yet
          </Heading>
          <Text color="gray.600">
            We&apos;re working on finding volunteers for you. Check back soon!
          </Text>
        </Box>
      );
    }

    return (
      <VStack align="stretch" gap={6}>
        {matches.map((match) => (
          <VolunteerCard key={match.id} match={match} onSchedule={handleSchedule} />
        ))}
        
        {/* Request New Matches Button */}
        <Button
          bg="#056067"
          color="white"
          border="1px solid"
          borderColor="#056067"
          borderRadius="8px"
          px={7}
          py={3}
          fontWeight="600"
          fontSize="16px"
          lineHeight="1.5em"
          fontFamily="Open Sans, sans-serif"
          boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
          _hover={{ bg: '#044d52', borderColor: '#044d52' }}
          _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
          onClick={handleRequestNewMatchesClick}
        >
          <Flex align="center" gap={2}>
            <Icon as={FiPlus} boxSize={5} />
            <Text>Request New Matches</Text>
          </Flex>
        </Button>
      </VStack>
    );
  };

  const renderContactTab = () => {
    return (
      <Box bg="white" borderRadius="lg" p={8} textAlign="center" boxShadow="sm">
        <Heading size="lg" color="gray.800" mb={3}>
          Contact
        </Heading>
        <Text color="gray.600">
          Schedule a call with a volunteer to unlock contact details.
        </Text>
      </Box>
    );
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" bg="#F3F4F6" py={10}>
          <Container maxW="container.xl">
            <Flex
              direction={{ base: 'column', lg: 'row' }}
              align="flex-start"
              gap={{ base: 8, lg: 12 }}
            >
              <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

              <Box flex={1} w="full">
                <VStack align="stretch" gap={6}>
                  {/* Header - Show pending message if hasPendingRequest, otherwise show normal header */}
                  {hasPendingRequest && activeTab === 'matches' ? (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          Your request is pending!
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          Check back in a few days.
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          w="48px"
                          h="48px"
                          bg="#4A5568"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          ml={4}
                        >
                          <Text fontSize="md" fontWeight="medium" color="white">
                            {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  ) : (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          Who would you like to chat with, {userName}?
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          We&apos;ve carefully selected volunteers who we think fit your needs best.
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          w="48px"
                          h="48px"
                          bg="#4A5568"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          ml={4}
                        >
                          <Text fontSize="md" fontWeight="medium" color="white">
                            {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  )}

                  {/* Content */}
                  {activeTab === 'matches' ? renderMatchesTab() : renderContactTab()}
                </VStack>
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Modals */}
        <RequestNewMatchesModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleSubmitRequest}
          isSubmitting={isSubmitting}
        />
        <RequestConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={handleConfirmationClose}
        />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
