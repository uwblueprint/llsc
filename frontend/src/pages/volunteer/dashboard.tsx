import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import ProfileCard from '@/components/dashboard/ProfileCard';
import { getCurrentUser } from '@/APIClients/authAPIClient';

const VolunteerDashboardPage: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [matchedParticipants, setMatchedParticipants] = useState([]);

  useEffect(() => {
    // Get current user name
    const user = getCurrentUser();
    if (user) {
      const firstName = user.firstName || '';
      setUserName(firstName);
    }

    // TODO: Check if user has set availability, if not redirect to schedule page
    const hasSetAvailability = false; // Replace with actual check from API
    if (!hasSetAvailability) {
      router.push('/volunteer/schedule');
      return;
    }

    // TODO: Fetch matched participants from API
    // const fetchMatches = async () => {
    //   try {
    //     const response = await baseAPIClient.get('/matching/my-matches');
    //     setMatchedParticipants(response.data.matches);
    //   } catch (error) {
    //     console.error('Error fetching matches:', error);
    //   }
    // };
    // fetchMatches();
  }, [router]);

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
              {matchedParticipants.map((participant: any) => (
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
