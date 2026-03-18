import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import ScheduleCallModal from '@/components/dashboard/ScheduleCallModal';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { MatchStatusScreen, VolunteerMatch } from '@/components/matches/MatchStatusScreen';
import { TimeRequestNotificationModal } from '@/components/volunteer/TimeRequestNotificationModal';
import { CancelCallConfirmationModal } from '@/components/participant/CancelCallConfirmationModal';
import { ViewParticipantContactModal } from '@/components/volunteer/ViewParticipantContactModal';
import { CallCancelledNotificationModal } from '@/components/shared/CallCancelledNotificationModal';
import { CancelCallSuccessModal } from '@/components/participant/CancelCallSuccessModal';

interface MatchedParticipant {
  id: number;
  name: string;
  pronouns: string;
  age: number;
  timezone: string;
  diagnosis: string;
  treatments: string[];
  experiences: string[];
  initials: string;
}

const VolunteerDashboardPage: React.FC = () => {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [allMatches, setAllMatches] = useState<VolunteerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<MatchedParticipant | null>(null);
  const [showTimeRequestNotification, setShowTimeRequestNotification] = useState(false);
  const [requestingParticipantName, setRequestingParticipantName] = useState<string | undefined>(
    undefined,
  );

  const [matchToCancel, setMatchToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [contactParticipant, setContactParticipant] = useState<
    VolunteerMatch['participant'] | null
  >(null);
  const [showCancelledNotification, setShowCancelledNotification] = useState(false);
  const [cancelledByName, setCancelledByName] = useState('');

  const loadMatches = async () => {
    try {
      const response = await baseAPIClient.get('/matches/volunteer/me');
      const matches: VolunteerMatch[] = response.data.matches || [];
      setAllMatches(matches);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const user = getCurrentUser();
      if (user) {
        setUserName(user.firstName || '');
      }

      const matches = await loadMatches();

      const requestingMatchIds = matches
        .filter((match) => match.matchStatus?.toLowerCase() === 'requesting_new_times')
        .map((match) => String(match.id))
        .sort();

      const requestingMatches = matches.filter(
        (match) => match.matchStatus?.toLowerCase() === 'requesting_new_times',
      );

      if (typeof window !== 'undefined' && requestingMatchIds.length > 0) {
        const notificationKey = `volunteer-time-request-notification-${requestingMatchIds.join(',')}`;
        const hasSeenNotification = sessionStorage.getItem(notificationKey);
        if (!hasSeenNotification) {
          setShowTimeRequestNotification(true);
          sessionStorage.setItem(notificationKey, 'seen');

          if (requestingMatches.length > 0) {
            const first = requestingMatches[0].participant;
            const firstName = first.firstName || '';
            const lastName = first.lastName || '';
            const name =
              `${firstName} ${lastName.charAt(0) ? lastName.charAt(0) + '.' : ''}`.trim();
            setRequestingParticipantName(name || first.email);
          }
        }
      }

      // Check for recently cancelled matches (cancelled_by_participant)
      if (typeof window !== 'undefined') {
        const cancelledMatches = matches.filter(
          (m) => m.matchStatus?.toLowerCase() === 'cancelled_by_participant',
        );
        const cancelledIds = cancelledMatches.map((m) => String(m.id)).sort();
        if (cancelledIds.length > 0) {
          const cancelKey = `volunteer-cancelled-notification-${cancelledIds.join(',')}`;
          const hasSeen = sessionStorage.getItem(cancelKey);
          if (!hasSeen) {
            sessionStorage.setItem(cancelKey, 'seen');
            const first = cancelledMatches[0].participant;
            const firstName = first.firstName || '';
            const lastName = first.lastName || '';
            const name =
              `${firstName} ${lastName.charAt(0) ? lastName.charAt(0) + '.' : ''}`.trim();
            setCancelledByName(name || first.email);
            setShowCancelledNotification(true);
          }
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleCancelCall = async () => {
    if (!matchToCancel) return;
    try {
      setIsCancelling(true);
      await baseAPIClient.post(`/matches/${matchToCancel}/cancel-volunteer`);
      setMatchToCancel(null);
      setShowCancelSuccess(true);
      await loadMatches();
    } catch (error) {
      console.error('Error cancelling call:', error);
      alert('Failed to cancel call. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewContact = (matchId: number) => {
    const match = allMatches.find((m) => m.id === matchId);
    if (match) {
      setContactParticipant(match.participant);
    }
  };

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
        <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
          <VolunteerDashboardLayout>
            <Text
              fontSize="16px"
              color="#6B7280"
              fontFamily="'Open Sans', sans-serif"
              textAlign="left"
            >
              {t('loading')}
            </Text>
          </VolunteerDashboardLayout>
        </FormStatusGuard>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <VolunteerDashboardLayout>
          <Heading
            fontSize="2.25rem"
            fontWeight={600}
            lineHeight="100%"
            letterSpacing="-1.5%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={2}
          >
            {allMatches.length > 0
              ? t('participantsMatched', { name: userName })
              : t('noNewMatchesYet', { name: userName })}
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {allMatches.length > 0
              ? t('pleaseScheduleCalls')
              : t('keepEyeOnInboxParticipant')}
          </Text>

          {allMatches.length > 0 && (
            <Box mb={8}>
              <MatchStatusScreen
                matches={allMatches}
                userRole={UserRole.VOLUNTEER}
                userName={userName}
                onViewRequest={(matchId) =>
                  router.push(`/volunteer/dashboard/time-request/${matchId}`)
                }
                onScheduleCall={(matchId) => {
                  const match = allMatches.find((m) => m.id === matchId);
                  if (!match) return;
                  const participant = match.participant;
                  const firstName = participant.firstName || '';
                  const lastName = participant.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  setSelectedParticipant({
                    id: match.id,
                    name: fullName || participant.email,
                    pronouns: participant.pronouns?.join('/') || '',
                    age: participant.age || 0,
                    timezone: participant.timezone || 'N/A',
                    diagnosis: participant.diagnosis || 'N/A',
                    treatments: participant.treatments || [],
                    experiences: participant.experiences || [],
                    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?',
                  });
                  setIsScheduleModalOpen(true);
                }}
                onCancelCall={(matchId) => setMatchToCancel(matchId)}
                onViewContactDetails={handleViewContact}
              />
            </Box>
          )}

          {selectedParticipant && (
            <ScheduleCallModal
              isOpen={isScheduleModalOpen}
              onClose={() => {
                setIsScheduleModalOpen(false);
                setSelectedParticipant(null);
              }}
              participantName={selectedParticipant.name}
              onSend={async () => {
                try {
                  await baseAPIClient.post(`/matches/${selectedParticipant.id}/accept-volunteer`);
                  await loadMatches();

                  setIsScheduleModalOpen(false);
                  setSelectedParticipant(null);
                } catch (error) {
                  console.error('Error accepting match:', error);
                  alert(t('failedToSendAvailability'));
                }
              }}
            />
          )}

          <CancelCallConfirmationModal
            isOpen={matchToCancel !== null}
            onClose={() => setMatchToCancel(null)}
            onConfirm={handleCancelCall}
            isCancelling={isCancelling}
            supportingText="We will let the participant know you have cancelled the call."
          />

          <CancelCallSuccessModal
            isOpen={showCancelSuccess}
            onClose={() => setShowCancelSuccess(false)}
            supportingText="We've notified the participant about the cancellation."
          />

          <ViewParticipantContactModal
            isOpen={contactParticipant !== null}
            participant={contactParticipant}
            onClose={() => setContactParticipant(null)}
          />

          <CallCancelledNotificationModal
            isOpen={showCancelledNotification}
            onClose={() => setShowCancelledNotification(false)}
            cancelledByName={cancelledByName}
          />

          <TimeRequestNotificationModal
            isOpen={showTimeRequestNotification}
            onClose={() => setShowTimeRequestNotification(false)}
            participantName={requestingParticipantName}
            onViewRequests={() => {
              const firstRequestMatch = allMatches.find(
                (match) => match.matchStatus?.toLowerCase() === 'requesting_new_times',
              );
              setShowTimeRequestNotification(false);
              if (firstRequestMatch?.id) {
                router.push(`/volunteer/dashboard/time-request/${firstRequestMatch.id}`);
              }
            }}
          />
        </VolunteerDashboardLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
};

export default VolunteerDashboardPage;
