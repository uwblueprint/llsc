import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import ProfileCard from '@/components/dashboard/ProfileCard';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';

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
  const [loading, setLoading] = useState(true);

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

        // Filter matches that need to be scheduled (pending or awaiting_volunteer_acceptance)
        const matchesNeedingScheduling = matches.filter((match: any) => {
          const status = match.matchStatus?.toLowerCase() || '';
          return status === 'pending' || status === 'awaiting_volunteer_acceptance';
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
            initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'
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
      <VolunteerDashboardLayout>
        <Box display="flex" justifyContent="center" w="100%">
          <Box w="711px">
            <Text
              fontSize="16px"
              color="#6B7280"
              fontFamily="'Open Sans', sans-serif"
              textAlign="left"
            >
              Loading matches...
            </Text>
          </Box>
        </Box>
      </VolunteerDashboardLayout>
    );
  }

  return (
    <VolunteerDashboardLayout>
      <Box display="flex" justifyContent="center" w="100%">
        <Box w="711px">
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
              : `No New Matches${userName ? `, ${userName}` : ''}`
            }
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {matchedParticipants.length > 0
              ? "Please schedule calls with your matches."
              : "Keep an eye out on your inbox! We'll notify you when we match you with a participant."
            }
          </Text>

          {matchedParticipants.length > 0 && (
            <VStack gap={6} align="flex-start">
              {matchedParticipants.map((participant) => (
                <ProfileCard
                  key={participant.id}
                  participant={participant}
                  onScheduleCall={() => {
                    // Handle schedule call action
                    console.log('Schedule call for', participant.name);
                  }}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </VolunteerDashboardLayout>
  );
};

export default VolunteerDashboardPage;
