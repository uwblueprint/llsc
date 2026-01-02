import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ScheduleCallModal from '@/components/dashboard/ScheduleCallModal';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import type { TimeSlot } from '@/components/dashboard/types';
import { MatchStatusScreen } from '@/components/matches/MatchStatusScreen';

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
  const [userName, setUserName] = useState('');
  const [matchedParticipants, setMatchedParticipants] = useState<MatchedParticipant[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<MatchedParticipant | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Get current user name
      const user = getCurrentUser();
      if (user) {
        const firstName = user.firstName || '';
        setUserName(firstName);
      }

      // Fetch matched participants from API
      try {
        const response = await baseAPIClient.get('/matches/volunteer/me');
        const matches = response.data.matches || [];

        // Store all matches for status screen
        setAllMatches(matches);

        // Filter matches that need to be scheduled (only awaiting_volunteer_acceptance)
        const matchesNeedingScheduling = matches.filter((match: any) => {
          const status = match.matchStatus?.toLowerCase() || '';
          return status === 'awaiting_volunteer_acceptance';
        });

        // Transform API response to match ProfileCard format
        const transformedMatches = matchesNeedingScheduling.map((match: any) => {
          const participant = match.participant;
          const firstName = participant.firstName || '';
          const lastName = participant.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: match.id, // Use match ID instead of participant UUID
            name: fullName || participant.email,
            pronouns: participant.pronouns?.join('/') || '',
            age: participant.age || 0,
            timezone: participant.timezone || 'N/A',
            diagnosis: participant.diagnosis || 'N/A',
            treatments: participant.treatments || [],
            experiences: participant.experiences || [],
            initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?',
          };
        });

        setMatchedParticipants(transformedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
              Loading matches...
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
            {matchedParticipants.length > 0
              ? `Participants have matched with you, ${userName}!`
              : `No New Matches${userName ? `, ${userName}` : ''}`}
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {matchedParticipants.length > 0
              ? 'Please schedule calls with your matches.'
              : allMatches.length > 0
                ? 'View your matches below.'
                : "Keep an eye out on your inbox! We'll notify you when we match you with a participant."}
          </Text>

          {/* Show status screen with all matches */}
          {allMatches.length > 0 && (
            <Box mb={8}>
              <MatchStatusScreen
                matches={allMatches}
                userRole={UserRole.VOLUNTEER}
                userName={userName}
              />
            </Box>
          )}

          {/* Show ProfileCards for matches that need acceptance */}
          {matchedParticipants.length > 0 && (
            <VStack gap={6} align="flex-start">
              {matchedParticipants.map((participant) => (
                <ProfileCard
                  key={participant.id}
                  participant={participant}
                  onScheduleCall={() => {
                    setSelectedParticipant(participant);
                    setIsScheduleModalOpen(true);
                  }}
                />
              ))}
            </VStack>
          )}

          {/* Schedule Call Modal */}
          {selectedParticipant && (
            <ScheduleCallModal
              isOpen={isScheduleModalOpen}
              onClose={() => {
                setIsScheduleModalOpen(false);
                setSelectedParticipant(null);
              }}
              participantName={selectedParticipant.name}
              onSend={async (timeSlots: TimeSlot[], additionalInfo: string) => {
                try {
                  // Accept the match - this will attach the volunteer's availability templates as suggested times
                  await baseAPIClient.post(`/matches/${selectedParticipant.id}/accept-volunteer`);

                  // Reload all matches to update the status screen
                  const response = await baseAPIClient.get('/matches/volunteer/me');
                  const matches = response.data.matches || [];
                  setAllMatches(matches);

                  // Filter matches that need to be scheduled (only awaiting_volunteer_acceptance)
                  const matchesNeedingScheduling = matches.filter((match: any) => {
                    const status = match.matchStatus?.toLowerCase() || '';
                    return status === 'awaiting_volunteer_acceptance';
                  });

                  // Transform API response to match ProfileCard format
                  const transformedMatches = matchesNeedingScheduling.map((match: any) => {
                    const participant = match.participant;
                    const firstName = participant.firstName || '';
                    const lastName = participant.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();

                    return {
                      id: match.id,
                      name: fullName || participant.email,
                      pronouns: participant.pronouns?.join('/') || '',
                      age: participant.age || 0,
                      timezone: participant.timezone || 'N/A',
                      diagnosis: participant.diagnosis || 'N/A',
                      treatments: participant.treatments || [],
                      experiences: participant.experiences || [],
                      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?',
                    };
                  });

                  setMatchedParticipants(transformedMatches);

                  setIsScheduleModalOpen(false);
                  setSelectedParticipant(null);
                } catch (error) {
                  console.error('Error accepting match:', error);
                  // TODO: Show error message to user
                  alert('Failed to send availability. Please try again.');
                }
              }}
            />
          )}
        </VolunteerDashboardLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
};

export default VolunteerDashboardPage;
