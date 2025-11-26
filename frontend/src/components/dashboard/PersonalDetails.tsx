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
import { FiHeart } from 'react-icons/fi';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';
import ProfileHeader from './ProfileHeader';
import { GENDER_DROPDOWN_OPTIONS, TIMEZONE_OPTIONS, COLORS } from '@/constants/form';
import { validateEmail, validateBirthday, validatePronouns } from '@/utils/validationUtils';

interface PersonalDetailsProps {
  personalDetails: {
    name: string;
    email: string;
    birthday: string;
    gender: string;
    pronouns: string;
    timezone: string;
    overview: string;
  };
  lovedOneDetails?: {
    birthday: string;
    gender: string;
  } | null;
  setPersonalDetails: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    birthday: string;
    gender: string;
    pronouns: string;
    timezone: string;
    overview: string;
  }>>;
  setLovedOneDetails?: React.Dispatch<React.SetStateAction<{
    birthday: string;
    gender: string;
  } | null>>;
  onSave?: (field: string, value: string) => Promise<void>;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  personalDetails,
  lovedOneDetails,
  setPersonalDetails,
  setLovedOneDetails,
  onSave,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputFocus = (fieldName: string) => {
    setEditingField(fieldName);
    // Clear error for this field when focused
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const validateField = (fieldName: string, value: string): boolean => {
    let validation;

    switch (fieldName) {
      case 'email':
        validation = validateEmail(value);
        break;
      case 'birthday':
        validation = validateBirthday(value, 18); // Require at least 18 years old
        break;
      case 'lovedOneBirthday':
        validation = validateBirthday(value, 0); // No age requirement for loved one
        break;
      case 'pronouns':
        validation = validatePronouns(value);
        break;
      case 'name':
        if (!value || !value.trim()) {
          setErrors(prev => ({ ...prev, [fieldName]: 'Name is required' }));
          return false;
        }
        validation = { isValid: true };
        break;
      default:
        validation = { isValid: true };
    }

    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.error || 'Invalid value' }));
      return false;
    }

    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  };

  const handleBlur = (fieldName: string) => {
    let value;
    if (fieldName === 'lovedOneBirthday') {
      value = lovedOneDetails?.birthday || '';
    } else {
      value = personalDetails[fieldName as keyof typeof personalDetails];
    }
    validateField(fieldName, value);
  };

  const handleSave = async () => {
    if (!editingField || !onSave) {
      setEditingField(null);
      return;
    }

    let value;
    if (editingField === 'lovedOneBirthday') {
      value = lovedOneDetails?.birthday || '';
    } else {
      value = personalDetails[editingField as keyof typeof personalDetails];
    }

    // Validate before saving
    if (!validateField(editingField, value)) {
      return;
    }

    setSaving(true);
    try {
      await onSave(editingField, value);
      setEditingField(null);
      setErrors(prev => ({ ...prev, [editingField]: '' }));
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
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
            onBlur={() => handleBlur('name')}
            error={errors.name}
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
                isDisabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
          
          <ProfileTextInput
            label="Birthday"
            value={personalDetails.birthday}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, birthday: e.target.value }))}
            onFocus={() => handleInputFocus('birthday')}
            onBlur={() => handleBlur('birthday')}
            error={errors.birthday}
            placeholder="DD/MM/YYYY"
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
                isDisabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}

          <ProfileTextInput
            label="Pronouns"
            value={personalDetails.pronouns}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, pronouns: e.target.value }))}
            onFocus={() => handleInputFocus('pronouns')}
            onBlur={() => handleBlur('pronouns')}
            error={errors.pronouns}
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
                isDisabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}

        </VStack>

        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label="Email Address"
            value={personalDetails.email}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
            onFocus={() => handleInputFocus('email')}
            onBlur={() => handleBlur('email')}
            error={errors.email}
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
                isDisabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
          
          <ProfileDropdown
            label="Gender"
            value={personalDetails.gender}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, gender: e.target.value }))}
            options={GENDER_DROPDOWN_OPTIONS}
          />

          <ProfileDropdown
            label="Timezone"
            value={personalDetails.timezone}
            onChange={(e) => setPersonalDetails(prev => ({ ...prev, timezone: e.target.value }))}
            options={TIMEZONE_OPTIONS.map(option => ({
              value: option.value,
              label: `${option.label} • ${new Date().toLocaleTimeString('en-US', {
                timeZone: option.value === 'Eastern Standard Time (EST)' ? 'America/New_York' :
                         option.value === 'Pacific Standard Time (PST)' ? 'America/Los_Angeles' :
                         option.value === 'Central Standard Time (CST)' ? 'America/Chicago' :
                         option.value === 'Mountain Standard Time (MST)' ? 'America/Denver' :
                         'America/New_York',
                hour12: true,
                hour: 'numeric',
                minute: '2-digit'
              })}`
            }))}
          />
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

      {/* Loved One Section */}
      {lovedOneDetails && (
        <>
          <Box
            mt={12}
            mb={8}
            borderBottom="1px solid"
            borderColor="#E5E7EB"
          />

          <Heading
            fontSize="1.625rem"
            fontWeight={600}
            lineHeight="40px"
            letterSpacing="0%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            mb={8}
          >
            Your Loved One's Personal Details
          </Heading>

          <Flex gap="6.5%" mt="32px" align="start">
            <VStack gap={8} flex="1" align="stretch">
              <ProfileTextInput
                label="Your Loved One's Birthday"
                value={lovedOneDetails.birthday}
                onChange={(e) => setLovedOneDetails && setLovedOneDetails(prev => prev ? ({ ...prev, birthday: e.target.value }) : null)}
                onFocus={() => handleInputFocus('lovedOneBirthday')}
                onBlur={() => handleBlur('lovedOneBirthday')}
                error={errors.lovedOneBirthday}
                placeholder="DD/MM/YYYY"
                icon={<FiHeart size={14} color="#1D3448" />}
              />
              {editingField === 'lovedOneBirthday' && (
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
                    isDisabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
            </VStack>

            <VStack gap={8} flex="1" align="stretch">
              <ProfileDropdown
                label="Your Loved One's Gender"
                value={lovedOneDetails.gender}
                onChange={(e) => setLovedOneDetails && setLovedOneDetails(prev => prev ? ({ ...prev, gender: e.target.value }) : null)}
                options={GENDER_DROPDOWN_OPTIONS}
                icon={<FiHeart size={14} color="#1D3448" />}
              />
            </VStack>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default PersonalDetails;