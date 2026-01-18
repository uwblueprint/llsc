import React, { useEffect, useState } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import { useTranslations } from 'next-intl';

const FAQsPage: React.FC = () => {
  const t = useTranslations('dashboard');
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
            {t('faqsTitle')}
            {userName ? `, ${userName}` : ''}
          </Heading>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={8}
          >
            {t('findAnswers')}
          </Text>

          <Text
            fontSize="16px"
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
            mt={16}
          >
            {t('faqsComingSoon')}
          </Text>
        </Box>
      </Box>
    </VolunteerDashboardLayout>
  );
};

export default FAQsPage;
