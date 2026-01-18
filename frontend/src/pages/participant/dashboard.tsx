import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { DashboardSidebar } from '@/components/participant/DashboardSidebar';
import { VolunteerCard } from '@/components/participant/VolunteerCard';
import { ConfirmedMatchCard } from '@/components/participant/ConfirmedMatchCard';
import { RequestNewMatchesModal } from '@/components/participant/RequestNewMatchesModal';
import { RequestConfirmationModal } from '@/components/participant/RequestConfirmationModal';
import { ViewContactDetailsModal } from '@/components/participant/ViewContactDetailsModal';
import { CancelCallConfirmationModal } from '@/components/participant/CancelCallConfirmationModal';
import { CancelCallSuccessModal } from '@/components/participant/CancelCallSuccessModal';
import ParticipantEditProfileModal from '@/components/participant/ParticipantEditProfileModal';
import { Avatar } from '@/components/ui/avatar';
import { participantMatchAPIClient } from '@/APIClients/participantMatchAPIClient';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import { AuthenticatedUser, FormStatus, UserRole } from '@/types/authTypes';
import { Match } from '@/types/matchTypes';
import { MatchStatusScreen } from '@/components/matches/MatchStatusScreen';

export default function ParticipantDashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isViewContactModalOpen, setIsViewContactModalOpen] = useState(false);
  const [isCancelCallConfirmationOpen, setIsCancelCallConfirmationOpen] = useState(false);
  const [isCancelCallSuccessOpen, setIsCancelCallSuccessOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchToCancel, setMatchToCancel] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const userName = user?.firstName || 'there';
  const userFullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(getCurrentUser());
    }
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await participantMatchAPIClient.getMyMatches();

      // Separate matches by status
      const pendingMatches = data.matches.filter(
        (match) => match.matchStatus === 'pending' || match.matchStatus === 'requesting_new_times',
      );
      const confirmed = data.matches.filter((match) => match.matchStatus === 'confirmed');

      setMatches(pendingMatches);
      setConfirmedMatches(confirmed);
      setHasPendingRequest(data.hasPendingRequest || false);

      // Store all matches for status screen
      setAllMatches(data.matches);
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
          : t('failedToLoadMatches');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (matchId: number) => {
    router.push(`/participant/schedule/${matchId}`);
  };

  const handleCancelCall = (matchId: number) => {
    setMatchToCancel(matchId);
    setIsCancelCallConfirmationOpen(true);
  };

  const handleConfirmCancelCall = async () => {
    if (!matchToCancel) return;

    try {
      setIsCancelling(true);
      await participantMatchAPIClient.cancelMatch(matchToCancel);
      setIsCancelCallConfirmationOpen(false);
      setIsCancelCallSuccessOpen(true);
      setMatchToCancel(null);
      // Reload matches to reflect the cancellation
      await loadMatches();
    } catch (err) {
      console.error('Error cancelling match:', err);
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
          : t('failedToCancelCall');
      setError(errorMessage);
      setIsCancelCallConfirmationOpen(false);
      setMatchToCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewContactDetails = (matchId: number) => {
    const match = confirmedMatches.find((m) => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setIsViewContactModalOpen(true);
    }
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
      setRequestMessage(''); // Reset form message
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
          : t('failedToRequestMatches');
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

    // Show request new matches screen when there are no active matches
    // This includes: completed matches, cancelled matches, or brand new users
    if (allMatches.length === 0) {
      return (
        <VStack align="stretch" gap={6}>
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
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
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

          {/* Submit Button */}
          <Flex justify="flex-end" pt={4}>
            <Button
              bg="#056067"
              color="white"
              _hover={{ bg: '#044d52' }}
              _active={{ bg: '#033a3e' }}
              onClick={() => handleSubmitRequest(requestMessage.trim() || undefined)}
              loading={isSubmitting}
              loadingText={t('submitting')}
              disabled={isSubmitting}
              px={6}
            >
              {t('submitRequest')}
            </Button>
          </Flex>
        </VStack>
      );
    }

    // Show status screen with all matches
    return (
      <VStack align="stretch" gap={6}>
        <MatchStatusScreen
          matches={allMatches}
          userRole={UserRole.PARTICIPANT}
          userName={userName}
        />

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
            <Text>{t('requestNewMatches')}</Text>
          </Flex>
        </Button>
      </VStack>
    );
  };

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
                <VStack align="stretch" gap={6}>
                  {/* Header */}
                  {hasPendingRequest ? (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          {t('yourRequestIsPending')}
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          {t('checkBackInFewDays')}
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          flexShrink={0}
                          ml={4}
                          cursor="pointer"
                          onClick={() => setIsEditProfileOpen(true)}
                          _hover={{ opacity: 0.8 }}
                          transition="opacity 0.2s"
                        >
                          <Avatar
                            name={userFullName}
                            size="lg"
                            bg="rgba(179, 206, 209, 0.3)"
                            color="#056067"
                            fontWeight={500}
                          />
                        </Box>
                      )}
                    </Flex>
                  ) : confirmedMatches.length > 0 ? (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          {t('thanksForScheduling')}
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          {t('viewContactDetails')}
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          flexShrink={0}
                          ml={4}
                          cursor="pointer"
                          onClick={() => setIsEditProfileOpen(true)}
                          _hover={{ opacity: 0.8 }}
                          transition="opacity 0.2s"
                        >
                          <Avatar
                            name={userFullName}
                            size="lg"
                            bg="rgba(179, 206, 209, 0.3)"
                            color="#056067"
                            fontWeight={500}
                          />
                        </Box>
                      )}
                    </Flex>
                  ) : confirmedMatches.length === 0 && matches.length === 0 ? (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          {t('requestNewVolunteers')}
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          {t('wouldYouLikeNewMatches')}
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          flexShrink={0}
                          ml={4}
                          cursor="pointer"
                          onClick={() => setIsEditProfileOpen(true)}
                          _hover={{ opacity: 0.8 }}
                          transition="opacity 0.2s"
                        >
                          <Avatar
                            name={userFullName}
                            size="lg"
                            bg="rgba(179, 206, 209, 0.3)"
                            color="#056067"
                            fontWeight={500}
                          />
                        </Box>
                      )}
                    </Flex>
                  ) : (
                    <Flex justify="space-between" align="flex-start">
                      <Box flex={1}>
                        <Heading fontSize="2xl" fontWeight="600" color="#1F2937" mb={2}>
                          {t('whoWouldYouLikeToChat', { name: userName })}
                        </Heading>
                        <Text fontSize="md" color="#6B7280" opacity={0.85}>
                          {t('carefullySelectedVolunteers')}
                        </Text>
                      </Box>
                      {/* User Avatar in top right */}
                      {user && (
                        <Box
                          flexShrink={0}
                          ml={4}
                          cursor="pointer"
                          onClick={() => setIsEditProfileOpen(true)}
                          _hover={{ opacity: 0.8 }}
                          transition="opacity 0.2s"
                        >
                          <Avatar
                            name={userFullName}
                            size="lg"
                            bg="rgba(179, 206, 209, 0.3)"
                            color="#056067"
                            fontWeight={500}
                          />
                        </Box>
                      )}
                    </Flex>
                  )}

                  {/* Content */}
                  {renderMatchesTab()}
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
        <ViewContactDetailsModal
          isOpen={isViewContactModalOpen}
          match={selectedMatch}
          onClose={() => {
            setIsViewContactModalOpen(false);
            setSelectedMatch(null);
          }}
        />
        <CancelCallConfirmationModal
          isOpen={isCancelCallConfirmationOpen}
          onClose={() => {
            setIsCancelCallConfirmationOpen(false);
            setMatchToCancel(null);
          }}
          onConfirm={handleConfirmCancelCall}
          isCancelling={isCancelling}
        />
        <CancelCallSuccessModal
          isOpen={isCancelCallSuccessOpen}
          onClose={() => {
            setIsCancelCallSuccessOpen(false);
          }}
        />
        <ParticipantEditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
