import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import MatchBox from '../../components/MatchBox';

const VolunteerDashboard: React.FC = () => {
  // Mock data for matched participants
  const matchedParticipants = [
    {
      id: 1,
      name: 'Jane D.',
      pronouns: 'she/her',
      age: 24,
      timezone: 'EST',
      diagnosis: 'Lymphoma',
      treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
      initials: 'JD'
    },
    {
      id: 2,
      name: 'Jane D.',
      pronouns: 'she/her',
      age: 24,
      timezone: 'EST',
      diagnosis: 'Lymphoma',
      treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
      initials: 'JD'
    },
    {
      id: 3,
      name: 'Jane D.',
      pronouns: 'she/her',
      age: 24,
      timezone: 'EST',
      diagnosis: 'Lymphoma',
      treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
      initials: 'JD'
    }
  ];

  return (
    <DashboardLayout>
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
            Participants have matched with you, John!
              </Heading>
                    
                    <Text 
            fontSize="16px" 
            color="#6B7280" 
                      fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
                    >
            Please schedule calls with your matches.
                    </Text>

                    <VStack gap={6} align="flex-start">
            {matchedParticipants.map((participant) => (
              <MatchBox 
                key={participant.id}
                participant={participant}
                onScheduleCall={() => {
                  // Handle schedule call action
                  console.log('Schedule call for', participant.name);
                }}
              />
            ))}
            </VStack>
          </Box>
      </Box>
    </DashboardLayout>
  );
};

export default VolunteerDashboard; 