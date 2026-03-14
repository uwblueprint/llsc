import React, { useEffect, useState } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { MatchStatusScreen } from '@/components/matches/MatchStatusScreen';
import { CancelCallConfirmationModal } from '@/components/participant/CancelCallConfirmationModal';
import { CancelCallSuccessModal } from '@/components/participant/CancelCallSuccessModal';
import { ViewParticipantContactModal } from '@/components/volunteer/ViewParticipantContactModal';

interface ScheduledCallMatch {
  id: number;
  matchStatus: string;
  chosenTimeBlock: { id: number; startTime: string } | null;
  participant: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    pronouns: string[] | null;
    age: number | null;
    timezone: string | null;
    diagnosis: string | null;
    treatments: string[];
    experiences: string[];
  };
}

const ScheduledCallsPage: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [confirmedMatches, setConfirmedMatches] = useState<ScheduledCallMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchToCancel, setMatchToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [contactParticipant, setContactParticipant] = useState<ScheduledCallMatch['participant'] | null>(null);

  const loadData = async () => {
    const user = getCurrentUser();
    if (user) {
      setUserName(user.firstName || '');
    }

    try {
      const response = await baseAPIClient.get('/matches/volunteer/me');
      const matches: ScheduledCallMatch[] = response.data.matches || [];
      const confirmed = matches.filter(
        (match) => match.matchStatus?.toLowerCase() === 'confirmed',
      );
      setConfirmedMatches(confirmed);
    } catch (error) {
      console.error('Error fetching scheduled calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelCall = async () => {
    if (!matchToCancel) return;
    try {
      setIsCancelling(true);
      await baseAPIClient.post(`/matches/${matchToCancel}/cancel-volunteer`);
      setMatchToCancel(null);
      setShowCancelSuccess(true);
      await loadData();
    } catch (error) {
      console.error('Error cancelling call:', error);
      alert('Failed to cancel call. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewContact = (matchId: number) => {
    const match = confirmedMatches.find((m) => m.id === matchId);
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
              Loading scheduled calls...
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
            {confirmedMatches.length > 0
              ? `Your Scheduled Calls${userName ? `, ${userName}` : ''}`
              : `No Scheduled Calls${userName ? `, ${userName}` : ''}`}
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {confirmedMatches.length > 0
              ? 'Here are your upcoming calls with participants.'
              : "You don't have any scheduled calls yet. Check the Matches tab to schedule calls with your matched participants."}
          </Text>

          {confirmedMatches.length > 0 && (
            <MatchStatusScreen
              matches={confirmedMatches}
              userRole={UserRole.VOLUNTEER}
              userName={userName}
              onCancelCall={(matchId) => setMatchToCancel(matchId)}
              onViewContactDetails={handleViewContact}
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
        </VolunteerDashboardLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
};

export default ScheduledCallsPage;
