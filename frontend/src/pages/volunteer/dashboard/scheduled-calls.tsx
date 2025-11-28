import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import ProfileCard from '@/components/dashboard/ProfileCard';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';

interface ScheduledCall {
  id: number;
  name: string;
  pronouns: string;
  age: number;
  timezone: string;
  diagnosis: string;
  treatments: string[];
  experiences: string[];
  initials: string;
  scheduledTime?: Date;
}

const ScheduledCallsPage: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Get current user name
      const user = getCurrentUser();
      if (user) {
        const firstName = user.firstName || '';
        setUserName(firstName);
      }

      // Fetch scheduled calls from API
      try {
        const response = await baseAPIClient.get('/matches/volunteer/me');
        const matches = response.data.matches || [];

        // Filter matches that are confirmed (scheduled)
        const confirmedMatches = matches.filter((match: any) => {
          const status = match.matchStatus?.toLowerCase() || '';
          return status === 'confirmed';
        });

        // Transform API response to match ProfileCard format
        const transformedCalls = confirmedMatches.map((match: any) => {
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
            scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : undefined,
          };
        });

        setScheduledCalls(transformedCalls);
      } catch (error) {
        console.error('Error fetching scheduled calls:', error);
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
              Loading scheduled calls...
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
            {scheduledCalls.length > 0
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
            {scheduledCalls.length > 0
              ? 'Here are your upcoming calls with participants.'
              : "You don't have any scheduled calls yet. Check the Matches tab to schedule calls with your matched participants."}
          </Text>

          {scheduledCalls.length > 0 && (
            <VStack gap={6} align="flex-start">
              {scheduledCalls.map((call) => (
                <ProfileCard
                  key={call.id}
                  participant={call}
                  time={call.scheduledTime}
                  showTimes={!!call.scheduledTime}
                  onViewContact={() => {
                    // Handle view contact action
                    console.log('View contact for', call.name);
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

export default ScheduledCallsPage;
