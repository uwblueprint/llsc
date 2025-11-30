import React from 'react';
import { Box, Text, VStack, Button } from '@chakra-ui/react';
import ProfileHeader from '@/components/dashboard/ProfileHeader';

const AccountSettings: React.FC = () => {
  const handleBecomeVolunteer = () => {
    // TODO: Implement become volunteer functionality
    alert(
      'Become volunteer functionality will be implemented soon. Please contact support for assistance.',
    );
  };

  const handleOptOut = () => {
    // TODO: Implement opt-out functionality
    alert('Opt-out functionality will be implemented soon. Please contact support for assistance.');
  };

  return (
    <Box bg="white" p={0} mt="116px" minH="200px">
      <ProfileHeader>Account settings</ProfileHeader>

      <VStack gap={6} mt="32px" align="stretch">
        {/* Preferred Language - This is now in Personal Details, but keeping structure for future fields */}

        {/* Becoming a Volunteer */}
        <Box>
          <Text
            fontSize="1rem"
            fontWeight={600}
            lineHeight="30px"
            letterSpacing="0%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            mb={2}
          >
            Becoming a Volunteer
          </Text>
          <Text
            fontSize="0.875rem"
            fontWeight={400}
            lineHeight="1.5"
            color="#495D6C"
            fontFamily="'Open Sans', sans-serif"
            mb={4}
          >
            Complete the volunteer application to express your interest and confirm these details
            are correct. Once submitted, we&apos;ll follow up by email with next steps.
          </Text>
          <Button
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="0.875rem"
            fontFamily="'Open Sans', sans-serif"
            px={4}
            py={2}
            borderRadius="6px"
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033e42' }}
            onClick={handleBecomeVolunteer}
          >
            Volunteer Application Form
          </Button>
        </Box>

        {/* Opt Out */}
        <Box>
          <Text
            fontSize="1rem"
            fontWeight={600}
            lineHeight="30px"
            letterSpacing="0%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            mb={2}
          >
            Opt Out of the First Connections Program
          </Text>
          <Text
            fontSize="0.875rem"
            fontWeight={400}
            lineHeight="1.5"
            color="#495D6C"
            fontFamily="'Open Sans', sans-serif"
            mb={4}
          >
            Your experience is important to us. By opting out you are removing yourself from the
            matching algorithm and cannot be connected with a potential volunteer. When you are
            ready to participate again, please sign back in and click the Opt In. You do not need to
            re-register or create a new profile.
          </Text>
          <Button
            bg="#A70000"
            color="white"
            fontWeight={600}
            fontSize="0.875rem"
            fontFamily="'Open Sans', sans-serif"
            px={4}
            py={2}
            borderRadius="6px"
            _hover={{ bg: '#8B0000' }}
            _active={{ bg: '#750000' }}
            onClick={handleOptOut}
          >
            Opt Out
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default AccountSettings;
