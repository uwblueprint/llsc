import React, { useState, useMemo } from 'react';
import { Box, VStack, Flex, Button } from '@chakra-ui/react';
import { FiHeart } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';
import ProfileHeader from './ProfileHeader';
import { GENDER_DROPDOWN_OPTIONS, TIMEZONE_OPTIONS } from '@/constants/form';
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
    preferredLanguage?: string | undefined;
  };
  lovedOneDetails?: {
    birthday: string;
    gender: string;
  } | null;
  setPersonalDetails: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      birthday: string;
      gender: string;
      pronouns: string;
      timezone: string;
      overview: string;
      preferredLanguage?: string;
    }>
  >;
  setLovedOneDetails?: React.Dispatch<
    React.SetStateAction<{
      birthday: string;
      gender: string;
    } | null>
  >;
  onSave?: (field: string, value: string) => Promise<void>;
  isVolunteer?: boolean;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  personalDetails,
  lovedOneDetails,
  setPersonalDetails,
  setLovedOneDetails,
  onSave,
  isVolunteer = false,
}) => {
  const t = useTranslations('dashboard');
  const tOptions = useTranslations('options');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Translate gender options - store English value, display translated label
  const translatedGenderOptions = useMemo(() => {
    return GENDER_DROPDOWN_OPTIONS.map((option) => ({
      value: option.value, // Keep English value for storage
      label: tOptions(`genders.${option.value}`), // Display translated label
    }));
  }, [tOptions]);

  const handleInputFocus = (fieldName: string) => {
    setEditingField(fieldName);
    // Clear error for this field when focused
    setErrors((prev) => ({ ...prev, [fieldName]: '' }));
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
        // Age field - just validate it's not empty and is a reasonable number
        if (!value || !value.trim()) {
          validation = { isValid: false, error: t('ageRequired') };
        } else {
          const ageNum = parseInt(value, 10);
          if (isNaN(ageNum) || ageNum < 0 || ageNum > 1000) {
            validation = { isValid: false, error: t('ageInvalid') };
          } else {
            validation = { isValid: true };
          }
        }
        break;
      case 'pronouns':
        validation = validatePronouns(value);
        break;
      case 'name':
        if (!value || !value.trim()) {
          setErrors((prev) => ({ ...prev, [fieldName]: t('nameRequired') }));
          return false;
        }
        validation = { isValid: true };
        break;
      default:
        validation = { isValid: true };
    }

    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, [fieldName]: validation.error || t('invalidValue') }));
      return false;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    return true;
  };

  const handleBlur = (fieldName: string) => {
    let value: string;
    if (fieldName === 'lovedOneBirthday') {
      value = lovedOneDetails?.birthday || '';
    } else if (fieldName === 'lovedOneGender') {
      value = lovedOneDetails?.gender || '';
    } else {
      const fieldValue = personalDetails[fieldName as keyof typeof personalDetails];
      value = typeof fieldValue === 'string' ? fieldValue : '';
    }
    validateField(fieldName, value);
  };

  const handleSave = async () => {
    if (!editingField || !onSave) {
      setEditingField(null);
      return;
    }

    let value: string;
    if (editingField === 'lovedOneBirthday') {
      value = lovedOneDetails?.birthday || '';
    } else if (editingField === 'lovedOneGender') {
      value = lovedOneDetails?.gender || '';
    } else {
      const fieldValue = personalDetails[editingField as keyof typeof personalDetails];
      value = typeof fieldValue === 'string' ? fieldValue : '';
    }

    // Validate before saving
    if (!validateField(editingField, value)) {
      return;
    }

    setSaving(true);
    try {
      await onSave(editingField, value);
      setEditingField(null);
      setErrors((prev) => ({ ...prev, [editingField]: '' }));
    } catch (error) {
      console.error('Error saving field:', error);
      alert(t('failedToSaveChanges'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box bg="white" p={0} minH="556px">
      <ProfileHeader>{t('personalDetails')}</ProfileHeader>

      <Flex gap="6.5%" mt="32px" align="start">
        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label={t('name')}
            value={personalDetails.name}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, name: e.target.value }))}
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}

          <ProfileTextInput
            label={t('birthday')}
            value={personalDetails.birthday}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, birthday: e.target.value }))}
            onFocus={() => handleInputFocus('birthday')}
            onBlur={() => handleBlur('birthday')}
            error={errors.birthday}
            placeholder={t('dateFormatPlaceholder')}
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}

          <ProfileTextInput
            label={t('pronouns')}
            value={personalDetails.pronouns}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, pronouns: e.target.value }))}
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}
        </VStack>

        <VStack gap={8} flex="1" align="stretch">
          <ProfileTextInput
            label={t('emailAddress')}
            value={personalDetails.email}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, email: e.target.value }))}
            readOnly={true}
            error={errors.email}
          />

          <ProfileDropdown
            label={t('gender')}
            value={personalDetails.gender}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, gender: e.target.value }))}
            onFocus={() => handleInputFocus('gender')}
            onBlur={() => handleBlur('gender')}
            options={translatedGenderOptions}
          />
          {editingField === 'gender' && (
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}

          <ProfileDropdown
            label={t('timezone')}
            value={personalDetails.timezone}
            onChange={(e) => {
              setPersonalDetails((prev) => ({ ...prev, timezone: e.target.value }));
              handleInputFocus('timezone');
            }}
            onFocus={() => handleInputFocus('timezone')}
            onBlur={() => handleBlur('timezone')}
            options={TIMEZONE_OPTIONS.map((option) => ({
              value: option.value,
              label: `${option.label} • ${new Date().toLocaleTimeString('en-US', {
                timeZone:
                  option.value === 'Newfoundland Standard Time (NST)'
                    ? 'America/St_Johns'
                    : option.value === 'Atlantic Standard Time (AST)'
                      ? 'America/Halifax'
                      : option.value === 'Eastern Standard Time (EST)'
                        ? 'America/New_York'
                        : option.value === 'Pacific Standard Time (PST)'
                          ? 'America/Los_Angeles'
                          : option.value === 'Central Standard Time (CST)'
                            ? 'America/Chicago'
                            : option.value === 'Mountain Standard Time (MST)'
                              ? 'America/Denver'
                              : 'America/New_York',
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
              })}`,
            }))}
          />
          {editingField === 'timezone' && (
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}
          <ProfileDropdown
            label={t('preferredLanguage')}
            value={personalDetails.preferredLanguage || 'en'}
            onChange={(e) => {
              setPersonalDetails((prev) => ({ ...prev, preferredLanguage: e.target.value }));
              handleInputFocus('preferredLanguage');
            }}
            onFocus={() => handleInputFocus('preferredLanguage')}
            onBlur={() => handleBlur('preferredLanguage')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'Français' },
            ]}
          />
          {editingField === 'preferredLanguage' && (
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}
        </VStack>
      </Flex>

      {/* Overview section - only for volunteers */}
      {isVolunteer && (
        <Box mt={8}>
          <ProfileTextInput
            label={t('overview')}
            value={personalDetails.overview}
            onChange={(e) => setPersonalDetails((prev) => ({ ...prev, overview: e.target.value }))}
            isTextarea={true}
            rows={2}
            helperText={t('explainYourStory')}
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
                _hover={{ bg: '#044d52' }}
                _active={{ bg: '#033e42' }}
              >
                {t('save')}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Loved One Section */}
      {lovedOneDetails && (
        <>
          <Box mt={12} mb={8} borderBottom="1px solid" borderColor="#E5E7EB" />

          <Flex gap="6.5%" mt="32px" align="start">
            <VStack gap={8} flex="1" align="stretch">
              <ProfileTextInput
                label={t('lovedOneAge')}
                value={lovedOneDetails.birthday}
                onChange={(e) =>
                  setLovedOneDetails &&
                  setLovedOneDetails((prev) =>
                    prev ? { ...prev, birthday: e.target.value } : null,
                  )
                }
                onFocus={() => handleInputFocus('lovedOneBirthday')}
                onBlur={() => handleBlur('lovedOneBirthday')}
                error={errors.lovedOneBirthday}
                placeholder={t('agePlaceholder')}
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
                    _hover={{ bg: '#044d52' }}
                    _active={{ bg: '#033e42' }}
                    disabled={saving}
                  >
                    {saving ? t('saving') : t('save')}
                  </Button>
                </Box>
              )}
            </VStack>

            <VStack gap={8} flex="1" align="stretch">
              <ProfileDropdown
                label={t('lovedOneGender')}
                value={lovedOneDetails.gender}
                onChange={(e) =>
                  setLovedOneDetails &&
                  setLovedOneDetails((prev) => (prev ? { ...prev, gender: e.target.value } : null))
                }
                onFocus={() => handleInputFocus('lovedOneGender')}
                onBlur={() => handleBlur('lovedOneGender')}
                options={translatedGenderOptions}
                icon={<FiHeart size={14} color="#1D3448" />}
              />
              {editingField === 'lovedOneGender' && (
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
                    _hover={{ bg: '#044d52' }}
                    _active={{ bg: '#033e42' }}
                    disabled={saving}
                  >
                    {saving ? t('saving') : t('save')}
                  </Button>
                </Box>
              )}
            </VStack>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default PersonalDetails;
