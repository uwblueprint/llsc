import React, { useEffect, useState } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import { getCurrentUser } from '@/APIClients/authAPIClient';

const FAQsPage: React.FC = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const firstName = user.firstName || '';
      setUserName(firstName);
    }
  }, []);

  return (
    <VolunteerDashboardLayout>
      <Box display="flex" justifyContent="center" w="100%">
        <Box w={{ base: '100%', lg: '711px' }}>
          <Heading
            fontSize={{ base: '1.5rem', lg: '2.25rem' }}
            fontWeight={600}
            lineHeight="100%"
            letterSpacing="-0.015em"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={2}
          >
            Frequently Asked Questions{userName ? `, ${userName}` : ''}
          </Heading>

          <Text
            fontSize={{ base: '14px', lg: '16px' }}
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            Find answers to common questions about the volunteer program.
          </Text>

          <Text
            fontSize={{ base: '14px', lg: '16px' }}
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
            mt={16}
          >
            FAQs coming soon...
          </Text>
        </Box>
      </Box>
    </VolunteerDashboardLayout>
  );
};

export default FAQsPage;
