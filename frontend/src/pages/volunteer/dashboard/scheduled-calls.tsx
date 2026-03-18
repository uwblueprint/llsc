import React, { useEffect, useState } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { useTranslations } from 'next-intl';
import { MatchStatusScreen, VolunteerMatch } from '@/components/matches/MatchStatusScreen';
import { CancelCallConfirmationModal } from '@/components/participant/CancelCallConfirmationModal';
import { CancelCallSuccessModal } from '@/components/participant/CancelCallSuccessModal';
import { ViewParticipantContactModal } from '@/components/volunteer/ViewParticipantContactModal';

const ScheduledCallsPage: React.FC = () => {
  const t = useTranslations('dashboard');
  const [userName, setUserName] = useState('');
  const [confirmedMatches, setConfirmedMatches] = useState<VolunteerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchToCancel, setMatchToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [contactParticipant, setContactParticipant] = useState<
    VolunteerMatch['participant'] | null
  >(null);

  const loadData = async () => {
    const user = getCurrentUser();
    if (user) {
      setUserName(user.firstName || '');
    }

    try {
      const response = await baseAPIClient.get('/matches/volunteer/me');
      const matches: VolunteerMatch[] = response.data.matches || [];
      const confirmed = matches.filter((match) => match.matchStatus?.toLowerCase() === 'confirmed');
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
              {t('loadingScheduledCalls')}
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
              ? `${t('yourScheduledCalls')}${userName ? `, ${userName}` : ''}`
              : `${t('noScheduledCalls')}${userName ? `, ${userName}` : ''}`}
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {confirmedMatches.length > 0 ? t('hereAreUpcomingCalls') : t('noScheduledCallsYet')}
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
