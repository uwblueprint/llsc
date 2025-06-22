import React from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Stack,
  VStack,
  Flex,
} from '@chakra-ui/react';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';

interface PersonalDetailsProps {
  personalDetails: {
    name: string;
    email: string;
    birthday: string;
    gender: string;
    timezone: string;
    overview: string;
  };
  setPersonalDetails: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    birthday: string;
    gender: string;
    timezone: string;
    overview: string;
  }>>;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  personalDetails,
  setPersonalDetails,
}) => {
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Non-binary', label: 'Non-binary' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  const timezoneOptions = [
    { value: 'Eastern Standard Time (EST) • 11:40 AM', label: 'Eastern Standard Time (EST) • 11:40 AM' },
    { value: 'Central Standard Time (CST)', label: 'Central Standard Time (CST)' },
    { value: 'Mountain Standard Time (MST)', label: 'Mountain Standard Time (MST)' },
    { value: 'Pacific Standard Time (PST)', label: 'Pacific Standard Time (PST)' },
  ];

  return (
    <Box bg="white" p={6} h="494px">
      <Heading 
        w="519px"
        h="40px"
        fontSize="1.625rem"
        fontWeight={600}
        lineHeight="40px"
        letterSpacing="0%"
        color="#1D3448"
        fontFamily="'Open Sans', sans-serif"
        mb={6}
      >
        Personal details
      </Heading>
      
      <Flex gap="6.5%" mt="32px" align="start">
        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label="Name"
            value={personalDetails.name}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <ProfileTextInput
            label="Birthday"
            value={personalDetails.birthday}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, birthday: e.target.value }))}
          />
          
          <ProfileDropdown
            label="Timezone"
            value={personalDetails.timezone}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, timezone: e.target.value }))}
            options={timezoneOptions}
          />
        </VStack>

        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label="Email Address"
            value={personalDetails.email}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
          />
          
          <ProfileDropdown
            label="Gender"
            value={personalDetails.gender}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, gender: e.target.value }))}
            options={genderOptions}
          />
          
          <Box>
            <ProfileTextInput
              label="Overview"
              value={personalDetails.overview}
              onChange={(e) => setPersonalDetails(prev => ({ ...prev, overview: e.target.value }))}
              isTextarea={true}
              rows={4}
            />
            <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif" mt={2}>
              Explain your story! Participants will be able to learn more about you.
            </Text>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
};

export default PersonalDetails; 