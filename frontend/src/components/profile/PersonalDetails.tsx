import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Stack,
  VStack,
  Flex,
  Textarea,
  Button,
} from '@chakra-ui/react';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';
import ProfileHeader from './ProfileHeader';
import { GENDER_DROPDOWN_OPTIONS, TIMEZONE_OPTIONS, COLORS } from '@/constants/form';

interface PersonalDetailsProps {
  personalDetails: {
    name: string;
    email: string;
    birthday: string;
    gender: string;
    timezone: string;
    pronouns: string;
    overview: string;
  };
  setPersonalDetails: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    birthday: string;
    gender: string;
    timezone: string;
    pronouns: string;
    overview: string;
  }>>;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  personalDetails,
  setPersonalDetails,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleInputFocus = (fieldName: string) => {
    setEditingField(fieldName);
  };

  const handleSave = () => {
    setEditingField(null);
    // Add any additional save logic here if needed
  };

  return (
    <Box bg="white" p={0} minH="556px">
      <ProfileHeader>Personal details</ProfileHeader>
      
      <Flex gap="6.5%" mt="32px" align="start">
        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label="Name"
            value={personalDetails.name}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, name: e.target.value }))}
            onFocus={() => handleInputFocus('name')}
          />
          {editingField === 'name' && (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                onClick={handleSave}
                bg="#056067"
                color="white"
                px={4}
                py={1}
                borderRadius="6px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="0.875rem"
                _hover={{ bg: "#044d52" }}
                _active={{ bg: "#033e42" }}
              >
                Save
              </Button>
            </Box>
          )}
          
          <ProfileTextInput
            label="Birthday"
            value={personalDetails.birthday}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, birthday: e.target.value }))}
            onFocus={() => handleInputFocus('birthday')}
          />
          {editingField === 'birthday' && (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                onClick={handleSave}
                bg="#056067"
                color="white"
                px={4}
                py={1}
                borderRadius="6px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="0.875rem"
                _hover={{ bg: "#044d52" }}
                _active={{ bg: "#033e42" }}
              >
                Save
              </Button>
            </Box>
          )}
          
          <ProfileDropdown
            label="Timezone"
            value={personalDetails.timezone}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, timezone: e.target.value }))}
            options={TIMEZONE_OPTIONS}
          />
          
        </VStack>

        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label="Email Address"
            value={personalDetails.email}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
            onFocus={() => handleInputFocus('email')}
          />
          {editingField === 'email' && (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                onClick={handleSave}
                bg="#056067"
                color="white"
                px={4}
                py={1}
                borderRadius="6px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="0.875rem"
                _hover={{ bg: "#044d52" }}
                _active={{ bg: "#033e42" }}
              >
                Save
              </Button>
            </Box>
          )}
          
          <ProfileDropdown
            label="Gender"
            value={personalDetails.gender}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, gender: e.target.value }))}
            options={GENDER_DROPDOWN_OPTIONS}
          />

          <ProfileTextInput
            label="Pronouns"
            value={personalDetails.pronouns}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, pronouns: e.target.value }))}
            onFocus={() => handleInputFocus('pronouns')}
          />
          {editingField === 'pronouns' && (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                onClick={handleSave}
                bg="#056067"
                color="white"
                px={4}
                py={1}
                borderRadius="6px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="0.875rem"
                _hover={{ bg: "#044d52" }}
                _active={{ bg: "#033e42" }}
              >
                Save
              </Button>
            </Box>
          )}
        </VStack>
      </Flex>
      
      <Box mt={8}>
        <ProfileTextInput
          label="Overview"
          value={personalDetails.overview}
          onChange={(e) => setPersonalDetails(prev => ({ ...prev, overview: e.target.value }))}
          isTextarea={true}
          rows={2}
          helperText="Explain your story! Participants will be able to learn more about you."
          onFocus={() => handleInputFocus('overview')}
        />
        {editingField === 'overview' && (
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              onClick={handleSave}
              bg="#056067"
              color="white"
              px={4}
              py={1}
              borderRadius="6px"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="0.875rem"
              _hover={{ bg: "#044d52" }}
              _active={{ bg: "#033e42" }}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PersonalDetails; 