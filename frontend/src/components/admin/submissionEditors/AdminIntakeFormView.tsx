/**
 * AdminIntakeFormView - Single-page intake form view for admins
 *
 * This component displays the entire intake form on one scrollable page,
 * matching the exact UI/UX of the multi-page user-facing forms.
 *
 * Sections are conditionally rendered based on hasBloodCancer and caringForSomeone:
 * - Experience Type (always shown)
 * - Personal Information (always shown)
 * - Your Demographic Information (always shown, but fields vary)
 * - Your Cancer Experience (shown if hasBloodCancer=yes)
 * - Caregiver Experience (shown if hasBloodCancer=no && caringForSomeone=yes)
 * - Loved One Information (shown if caringForSomeone=yes)
 * - Additional Information (always shown)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Heading, VStack, HStack, Text, Input, Textarea } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { CustomRadio } from '@/components/CustomRadio';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { IntakeExperience, IntakeTreatment } from '@/types/intakeTypes';
import {
  COLORS,
  PROVINCES,
  PRONOUNS_OPTIONS,
  ETHNIC_GROUP_OPTIONS,
  TIMEZONE_OPTIONS_ABBREVIATED,
  MARITAL_STATUS_OPTIONS,
  HAS_KIDS_OPTIONS,
  DIAGNOSIS_OPTIONS,
} from '@/constants/form';

const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe',
];

const LANGUAGE_OPTIONS = ['English', 'Français'];

/**
 * Map language code to display name
 */
const mapLanguageToDisplay = (lang: string | undefined | null): string => {
  if (!lang) return 'English';
  const lower = lang.toLowerCase();
  if (lower === 'en' || lower === 'english') return 'English';
  if (lower === 'fr' || lower === 'french' || lower === 'français') return 'Français';
  return lang; // Return as-is if unknown
};

/**
 * Map display name to language code for backend
 */
const mapLanguageToCode = (lang: string | undefined | null): string => {
  if (!lang) return 'en';
  const lower = lang.toLowerCase();
  if (lower === 'english' || lower === 'en') return 'en';
  if (lower === 'français' || lower === 'french' || lower === 'fr') return 'fr';
  return lang; // Return as-is if unknown
};

/**
 * Format a date string to YYYY-MM-DD format for HTML date inputs
 * Handles various date formats including ISO strings, timestamps, and partial dates
 */
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  try {
    // Try parsing as ISO date string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // If parsing fails, return empty string
  }

  return '';
};

interface AdminIntakeFormData {
  // Experience Type
  hasBloodCancer: 'yes' | 'no' | '';
  caringForSomeone: 'yes' | 'no' | '';

  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  postalCode: string;
  city: string;
  province: string;

  // Eligibility (volunteers only)
  eligibilityCriteria?: {
    age18OrOlder: boolean;
    noCriminalRecord: boolean;
    resideInCanada: boolean;
    oneYearSinceTreatment: boolean;
    hasBloodCancerOrCaregiver: boolean;
    willingToParticipateIntake: boolean;
    willingToAttendTraining: boolean;
    accessToPhoneAndComputer: boolean;
    comfortableSharingExperience: boolean;
  };

  // Demographics
  genderIdentity: string;
  genderIdentityCustom?: string;
  pronouns: string[];
  pronounsCustom?: string;
  ethnicGroup: string[];
  ethnicGroupCustom?: string;
  preferredLanguage: string;
  maritalStatus: string;
  hasKids: string;
  timezone: string;

  // Cancer Experience (if hasBloodCancer=yes)
  diagnosis?: string;
  dateOfDiagnosis?: string;
  treatments?: string[];
  experiences?: string[];

  // Caregiver Experience (if hasBloodCancer=no && caringForSomeone=yes)
  caregiverExperiences?: string[];

  // Loved One Information (if caringForSomeone=yes)
  lovedOne?: {
    genderIdentity: string;
    genderIdentityCustom?: string;
    age: string;
    diagnosis: string;
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  };

  // Additional Information
  additionalInfo?: string;
}

interface AdminIntakeFormViewProps {
  initialData: Partial<AdminIntakeFormData>;
  formType: 'participant' | 'volunteer';
  onChange?: (data: AdminIntakeFormData, hasChanges: boolean) => void;
}

const buildDefaultValues = (initialData: Partial<AdminIntakeFormData>): AdminIntakeFormData => ({
  hasBloodCancer: initialData.hasBloodCancer || '',
  caringForSomeone: initialData.caringForSomeone || '',
  firstName: initialData.firstName || '',
  lastName: initialData.lastName || '',
  dateOfBirth: formatDateForInput(initialData.dateOfBirth),
  phoneNumber: initialData.phoneNumber || '',
  postalCode: initialData.postalCode || '',
  city: initialData.city || '',
  province: initialData.province || '',
  eligibilityCriteria: initialData.eligibilityCriteria || {
    age18OrOlder: false,
    noCriminalRecord: false,
    resideInCanada: false,
    oneYearSinceTreatment: false,
    hasBloodCancerOrCaregiver: false,
    willingToParticipateIntake: false,
    willingToAttendTraining: false,
    accessToPhoneAndComputer: false,
    comfortableSharingExperience: false,
  },
  genderIdentity: initialData.genderIdentity || '',
  genderIdentityCustom: initialData.genderIdentityCustom || '',
  pronouns: initialData.pronouns || [],
  pronounsCustom: initialData.pronounsCustom || '',
  ethnicGroup: initialData.ethnicGroup || [],
  ethnicGroupCustom: initialData.ethnicGroupCustom || '',
  preferredLanguage: mapLanguageToDisplay(initialData.preferredLanguage),
  maritalStatus: initialData.maritalStatus || '',
  hasKids: initialData.hasKids || '',
  timezone: initialData.timezone || 'EST',
  diagnosis: initialData.diagnosis || '',
  dateOfDiagnosis: formatDateForInput(initialData.dateOfDiagnosis),
  treatments: initialData.treatments || [],
  experiences: initialData.experiences || [],
  caregiverExperiences: initialData.caregiverExperiences || [],
  lovedOne: initialData.lovedOne
    ? {
        genderIdentity: initialData.lovedOne.genderIdentity || '',
        genderIdentityCustom: initialData.lovedOne.genderIdentityCustom || '',
        age: initialData.lovedOne.age || '',
        diagnosis: initialData.lovedOne.diagnosis || '',
        dateOfDiagnosis: formatDateForInput(initialData.lovedOne.dateOfDiagnosis),
        treatments: initialData.lovedOne.treatments || [],
        experiences: initialData.lovedOne.experiences || [],
      }
    : {
        genderIdentity: '',
        genderIdentityCustom: '',
        age: '',
        diagnosis: '',
        dateOfDiagnosis: '',
        treatments: [],
        experiences: [],
      },
  additionalInfo: initialData.additionalInfo || '',
});

export function AdminIntakeFormView({ initialData, formType, onChange }: AdminIntakeFormViewProps) {
  const defaultValues = useMemo(() => buildDefaultValues(initialData), [initialData]);

  const {
    control,
    watch,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<AdminIntakeFormData>({
    defaultValues,
  });

  const [selfTreatmentOptions, setSelfTreatmentOptions] = useState<string[]>([]);
  const [selfExperienceOptions, setSelfExperienceOptions] = useState<string[]>([]);
  const [lovedOneTreatmentOptions, setLovedOneTreatmentOptions] = useState<string[]>([]);
  const [lovedOneExperienceOptions, setLovedOneExperienceOptions] = useState<string[]>([]);
  const [genderIdentityCustom, setGenderIdentityCustom] = useState(
    defaultValues.genderIdentityCustom || '',
  );
  const [pronounsCustom, setPronounsCustom] = useState(defaultValues.pronounsCustom || '');
  const [ethnicGroupCustom, setEthnicGroupCustom] = useState(defaultValues.ethnicGroupCustom || '');
  const [lovedOneGenderCustom, setLovedOneGenderCustom] = useState(
    defaultValues.lovedOne?.genderIdentityCustom || '',
  );

  // Watch form values
  const hasBloodCancer = watch('hasBloodCancer');
  const caringForSomeone = watch('caringForSomeone');
  const genderIdentity = watch('genderIdentity');
  const pronouns = watch('pronouns');
  const ethnicGroup = watch('ethnicGroup');
  const lovedOneGenderIdentity = watch('lovedOne.genderIdentity');

  // Store latest form data and isDirty in refs to avoid stale closures
  const latestFormDataRef = useRef<AdminIntakeFormData | null>(null);
  const isDirtyRef = useRef<boolean>(false);

  // Update isDirty ref whenever it changes
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Reset form state when initial data changes (e.g., after save or navigation)
  useEffect(() => {
    reset(defaultValues);
    setGenderIdentityCustom(defaultValues.genderIdentityCustom || '');
    setPronounsCustom(defaultValues.pronounsCustom || '');
    setEthnicGroupCustom(defaultValues.ethnicGroupCustom || '');
    setLovedOneGenderCustom(defaultValues.lovedOne?.genderIdentityCustom || '');
  }, [defaultValues, reset]);

  // Transform form data to replace "Self-describe" with custom values
  const transformFormData = useCallback(
    (data: AdminIntakeFormData): AdminIntakeFormData => {
      return {
        ...data,
        // Replace "Self-describe" with custom value for genderIdentity
        genderIdentity:
          data.genderIdentity === 'Self-describe' ? genderIdentityCustom : data.genderIdentity,
        genderIdentityCustom:
          data.genderIdentity === 'Self-describe'
            ? genderIdentityCustom
            : data.genderIdentityCustom,
        // Replace "Self-describe" in pronouns array with custom value
        pronouns: data.pronouns?.includes('Self-describe')
          ? data.pronouns.map((p) => (p === 'Self-describe' ? pronounsCustom : p))
          : data.pronouns,
        pronounsCustom: data.pronouns?.includes('Self-describe')
          ? pronounsCustom
          : data.pronounsCustom,
        // Replace self-describe option in ethnicGroup array with custom value
        ethnicGroup: data.ethnicGroup?.some((e) => e.toLowerCase().includes('self-describe'))
          ? data.ethnicGroup.map((e) =>
              e.toLowerCase().includes('self-describe') ? ethnicGroupCustom : e,
            )
          : data.ethnicGroup,
        ethnicGroupCustom: data.ethnicGroup?.some((e) => e.toLowerCase().includes('self-describe'))
          ? ethnicGroupCustom
          : data.ethnicGroupCustom,
        // Convert language display name to code for backend
        preferredLanguage: mapLanguageToCode(data.preferredLanguage),
        // Transform lovedOne data if present
        lovedOne: data.lovedOne
          ? {
              ...data.lovedOne,
              // Replace "Self-describe" with custom value for loved one genderIdentity
              genderIdentity:
                data.lovedOne.genderIdentity === 'Self-describe'
                  ? lovedOneGenderCustom
                  : data.lovedOne.genderIdentity,
              genderIdentityCustom:
                data.lovedOne.genderIdentity === 'Self-describe'
                  ? lovedOneGenderCustom
                  : data.lovedOne.genderIdentityCustom,
            }
          : undefined,
      };
    },
    [genderIdentityCustom, pronounsCustom, ethnicGroupCustom, lovedOneGenderCustom],
  );

  // Watch form data changes and notify parent
  useEffect(() => {
    const subscription = watch((data) => {
      const transformedData = transformFormData(data as AdminIntakeFormData);
      latestFormDataRef.current = transformedData;
      // Use ref to get latest isDirty value to avoid stale closure
      onChange?.(transformedData, isDirtyRef.current);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange, transformFormData]);

  // Separate effect to notify when isDirty changes (ensures we catch isDirty updates)
  useEffect(() => {
    // If we have form data, notify parent with updated isDirty
    if (latestFormDataRef.current) {
      onChange?.(latestFormDataRef.current, isDirty);
    }
  }, [isDirty, onChange]);

  // Watch for custom value changes and update form data
  useEffect(() => {
    // Get current form values without causing re-renders
    const currentFormValues = getValues();
    const transformedData = transformFormData(currentFormValues);
    latestFormDataRef.current = transformedData;
    onChange?.(transformedData, isDirtyRef.current);
  }, [
    genderIdentityCustom,
    pronounsCustom,
    ethnicGroupCustom,
    lovedOneGenderCustom,
    transformFormData,
    onChange,
    getValues,
  ]);

  // Fetch treatment and experience options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const hasCancer = hasBloodCancer === 'yes';
        const isCaregiver = caringForSomeone === 'yes';

        const selfTarget =
          hasCancer && isCaregiver
            ? 'both'
            : hasCancer
              ? 'patient'
              : isCaregiver
                ? 'caregiver'
                : 'patient';

        const selfResponse = await baseAPIClient.get(`/intake/options?target=${selfTarget}`);
        setSelfTreatmentOptions(selfResponse.data.treatments.map((t: IntakeTreatment) => t.name));
        setSelfExperienceOptions(
          selfResponse.data.experiences.map((e: IntakeExperience) => e.name),
        );

        if (isCaregiver) {
          const lovedOneResponse = await baseAPIClient.get('/intake/options?target=patient');
          setLovedOneTreatmentOptions(
            lovedOneResponse.data.treatments.map((t: IntakeTreatment) => t.name),
          );
          setLovedOneExperienceOptions(
            lovedOneResponse.data.experiences.map((e: IntakeExperience) => e.name),
          );
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };

    void fetchOptions();
  }, [hasBloodCancer, caringForSomeone]);

  return (
    <Box>
      <VStack align="stretch" gap={12}>
        {/* Experience Type Section */}
        <Box>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Experience Type
          </Heading>
          <Text
            color={COLORS.fieldGray}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
            mb={8}
          >
            Help us learn more about your experience with cancer.
          </Text>

          <HStack align="start" gap={12} w="full">
            {/* Do you have blood cancer? */}
            <Box flex="1">
              <Text
                color={COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={4}
              >
                Do you have blood cancer?
              </Text>
              <Controller
                name="hasBloodCancer"
                control={control}
                render={({ field }) => (
                  <VStack align="start" gap={1}>
                    <CustomRadio
                      name="hasBloodCancer"
                      value="yes"
                      checked={field.value === 'yes'}
                      onChange={(value) => field.onChange(value)}
                    >
                      <Text fontSize="14px" color={COLORS.veniceBlue}>
                        Yes
                      </Text>
                    </CustomRadio>
                    <CustomRadio
                      name="hasBloodCancer"
                      value="no"
                      checked={field.value === 'no'}
                      onChange={(value) => field.onChange(value)}
                    >
                      <Text fontSize="14px" color={COLORS.veniceBlue}>
                        No
                      </Text>
                    </CustomRadio>
                  </VStack>
                )}
              />
            </Box>

            {/* Are you caring for anyone with blood cancer? */}
            <Box flex="1">
              <Text
                color={COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={4}
              >
                Are you caring for anyone with blood cancer?
              </Text>
              <Controller
                name="caringForSomeone"
                control={control}
                render={({ field }) => (
                  <VStack align="start" gap={1}>
                    <CustomRadio
                      name="caringForSomeone"
                      value="yes"
                      checked={field.value === 'yes'}
                      onChange={(value) => field.onChange(value)}
                    >
                      <Text fontSize="14px" color={COLORS.veniceBlue}>
                        Yes
                      </Text>
                    </CustomRadio>
                    <CustomRadio
                      name="caringForSomeone"
                      value="no"
                      checked={field.value === 'no'}
                      onChange={(value) => field.onChange(value)}
                    >
                      <Text fontSize="14px" color={COLORS.veniceBlue}>
                        No
                      </Text>
                    </CustomRadio>
                  </VStack>
                )}
              />
            </Box>
          </HStack>
        </Box>

        {/* Personal Information Section */}
        <Box>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={8}
          >
            Personal Information
          </Heading>

          <VStack align="stretch" gap={6}>
            <HStack gap={6}>
              <Box flex="1">
                <FormField label="First Name">
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="First Name"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1">
                <FormField label="Last Name">
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="Last Name"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6}>
              <Box flex="1">
                <FormField label="Date of Birth">
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          type="date"
                          placeholder="YYYY-MM-DD"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1">
                <FormField label="Phone Number">
                  <Controller
                    name="phoneNumber"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="###-###-####"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6}>
              <Box flex="1">
                <FormField label="Postal Code">
                  <Controller
                    name="postalCode"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="A1A 1A1"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1">
                <FormField label="City">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="City"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                        />
                      </InputGroup>
                    )}
                  />
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6}>
              <Box flex="1">
                <FormField label="Province">
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <SingleSelectDropdown
                        options={[...PROVINCES]}
                        selectedValue={field.value}
                        onSelectionChange={field.onChange}
                        placeholder="Select province"
                      />
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1" /> {/* Spacer */}
            </HStack>
          </VStack>
        </Box>

        {/* Your Demographic Information Section */}
        <Box>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Your Demographic Information
          </Heading>
          <Text
            color={COLORS.fieldGray}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
            mb={8}
          >
            This information can be taken into account when matching you with the right support.
          </Text>

          <VStack align="stretch" gap={6}>
            {/* Gender Identity */}
            <Box>
              <FormField label="Gender Identity">
                <Controller
                  name="genderIdentity"
                  control={control}
                  render={({ field }) => (
                    <SingleSelectDropdown
                      options={GENDER_IDENTITY_OPTIONS}
                      selectedValue={field.value}
                      onSelectionChange={field.onChange}
                      placeholder="Select gender identity"
                    />
                  )}
                />
              </FormField>
              {genderIdentity === 'Self-describe' && (
                <Box mt={2}>
                  <FormField label="Please specify">
                    <Input
                      value={genderIdentityCustom}
                      onChange={(e) => setGenderIdentityCustom(e.target.value)}
                      placeholder="Please specify"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                      borderRadius="6px"
                      h="40px"
                      px={3}
                      border="1px solid"
                      borderColor="#d1d5db"
                      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </FormField>
                </Box>
              )}
            </Box>

            {/* Pronouns */}
            <Box>
              <FormField label="Pronouns">
                <Controller
                  name="pronouns"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={[...PRONOUNS_OPTIONS]}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Select pronouns"
                    />
                  )}
                />
              </FormField>
              {pronouns?.includes('Self-describe') && (
                <Box mt={2}>
                  <FormField label="Please specify">
                    <Input
                      value={pronounsCustom}
                      onChange={(e) => setPronounsCustom(e.target.value)}
                      placeholder="Please specify"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                      borderRadius="6px"
                      h="40px"
                      px={3}
                      border="1px solid"
                      borderColor="#d1d5db"
                      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </FormField>
                </Box>
              )}
            </Box>

            {/* Ethnic or Cultural Group */}
            <Box>
              <FormField label="Ethnic or Cultural Group">
                <Controller
                  name="ethnicGroup"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={[...ETHNIC_GROUP_OPTIONS]}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Select ethnic or cultural group(s)"
                    />
                  )}
                />
              </FormField>
              {(ethnicGroup?.includes('Self-describe') ||
                ethnicGroup?.some((e) => e.toLowerCase().includes('self-describe'))) && (
                <Box mt={2}>
                  <FormField label="Please specify">
                    <Input
                      value={ethnicGroupCustom}
                      onChange={(e) => setEthnicGroupCustom(e.target.value)}
                      placeholder="Please specify"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                      borderRadius="6px"
                      h="40px"
                      px={3}
                      border="1px solid"
                      borderColor="#d1d5db"
                      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </FormField>
                </Box>
              )}
            </Box>

            <HStack gap={6}>
              <Box flex="1">
                <FormField label="Preferred Language">
                  <Controller
                    name="preferredLanguage"
                    control={control}
                    render={({ field }) => (
                      <SingleSelectDropdown
                        options={LANGUAGE_OPTIONS}
                        selectedValue={field.value}
                        onSelectionChange={field.onChange}
                        placeholder="Select language"
                      />
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1">
                <FormField label="Timezone">
                  <Controller
                    name="timezone"
                    control={control}
                    render={({ field }) => (
                      <SingleSelectDropdown
                        options={TIMEZONE_OPTIONS_ABBREVIATED as string[]}
                        selectedValue={field.value}
                        onSelectionChange={field.onChange}
                        placeholder="Select timezone"
                      />
                    )}
                  />
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6}>
              <Box flex="1">
                <FormField label="Marital Status">
                  <Controller
                    name="maritalStatus"
                    control={control}
                    render={({ field }) => (
                      <SingleSelectDropdown
                        options={[...MARITAL_STATUS_OPTIONS]}
                        selectedValue={field.value}
                        onSelectionChange={field.onChange}
                        placeholder="Select marital status"
                      />
                    )}
                  />
                </FormField>
              </Box>
              <Box flex="1">
                <FormField label="Do you have kids?">
                  <Controller
                    name="hasKids"
                    control={control}
                    render={({ field }) => (
                      <SingleSelectDropdown
                        options={[...HAS_KIDS_OPTIONS]}
                        selectedValue={field.value}
                        onSelectionChange={field.onChange}
                        placeholder="Select an option"
                      />
                    )}
                  />
                </FormField>
              </Box>
            </HStack>
          </VStack>
        </Box>

        {/* Your Cancer Experience Section - Only if hasBloodCancer=yes */}
        {hasBloodCancer === 'yes' && (
          <Box>
            <Heading
              as="h2"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              color={COLORS.veniceBlue}
              fontSize="20px"
              mb={3}
            >
              Your Cancer Experience
            </Heading>
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="15px"
              mb={8}
            >
              This information can also be taken into account when matching you with a{' '}
              {formType === 'volunteer' ? 'service user' : 'volunteer'}.
            </Text>

            <VStack align="stretch" gap={6}>
              <HStack gap={6}>
                <Box flex="1">
                  <FormField label="Your Diagnosis">
                    <Controller
                      name="diagnosis"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectDropdown
                          options={[...DIAGNOSIS_OPTIONS]}
                          selectedValue={field.value || ''}
                          onSelectionChange={field.onChange}
                          placeholder="Select diagnosis"
                        />
                      )}
                    />
                  </FormField>
                </Box>
                <Box flex="1">
                  <FormField label="Date of Diagnosis">
                    <Controller
                      name="dateOfDiagnosis"
                      control={control}
                      render={({ field }) => (
                        <InputGroup>
                          <Input
                            {...field}
                            type="date"
                            placeholder="YYYY-MM-DD"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontSize="14px"
                          />
                        </InputGroup>
                      )}
                    />
                  </FormField>
                </Box>
              </HStack>

              <HStack gap={6} align="start">
                <Box flex="1">
                  <Text
                    color={COLORS.veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={2}
                  >
                    Which treatments have you done?
                  </Text>
                  <Text color={COLORS.fieldGray} fontSize="12px" mb={4}>
                    You can select a maximum of 2.
                  </Text>
                  <Controller
                    name="treatments"
                    control={control}
                    render={({ field }) => (
                      <CheckboxGroup
                        options={selfTreatmentOptions}
                        selectedValues={field.value || []}
                        onValueChange={field.onChange}
                        maxSelections={2}
                      />
                    )}
                  />
                </Box>
                <Box flex="1">
                  <Text
                    color={COLORS.veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={2}
                  >
                    Which experiences do you have?
                  </Text>
                  <Text color={COLORS.fieldGray} fontSize="12px" mb={4}>
                    You can select a maximum of 5.
                  </Text>
                  <Controller
                    name="experiences"
                    control={control}
                    render={({ field }) => (
                      <CheckboxGroup
                        options={selfExperienceOptions}
                        selectedValues={field.value || []}
                        onValueChange={field.onChange}
                        maxSelections={5}
                      />
                    )}
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Caregiver Experience Section - Only if hasBloodCancer=no && caringForSomeone=yes */}
        {hasBloodCancer === 'no' && caringForSomeone === 'yes' && (
          <Box>
            <Heading
              as="h2"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              color={COLORS.veniceBlue}
              fontSize="20px"
              mb={3}
            >
              Your Caregiver Experience
            </Heading>
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="15px"
              mb={8}
            >
              Tell us about your experience as a caregiver.
            </Text>

            <Box>
              <Text
                color={COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={2}
              >
                Which experiences do you have?
              </Text>
              <Text color={COLORS.fieldGray} fontSize="12px" mb={4}>
                You can select a maximum of 5.
              </Text>
              <Controller
                name="caregiverExperiences"
                control={control}
                render={({ field }) => (
                  <CheckboxGroup
                    options={selfExperienceOptions}
                    selectedValues={field.value || []}
                    onValueChange={field.onChange}
                    maxSelections={5}
                  />
                )}
              />
            </Box>
          </Box>
        )}

        {/* Loved One Information Section - Only if caringForSomeone=yes */}
        {caringForSomeone === 'yes' && (
          <Box>
            <Heading
              as="h2"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              color={COLORS.veniceBlue}
              fontSize="20px"
              mb={3}
            >
              Loved One Information
            </Heading>
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="15px"
              mb={8}
            >
              If you are caring for someone with blood cancer, tell us about them so we can match
              you with the right support.
            </Text>

            <VStack align="stretch" gap={6}>
              {/* Loved One Demographics */}
              <HStack gap={6}>
                <Box flex="1">
                  <FormField label="Gender Identity">
                    <Controller
                      name="lovedOne.genderIdentity"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectDropdown
                          options={GENDER_IDENTITY_OPTIONS}
                          selectedValue={field.value || ''}
                          onSelectionChange={field.onChange}
                          placeholder="Select gender identity"
                        />
                      )}
                    />
                  </FormField>
                  {lovedOneGenderIdentity === 'Self-describe' && (
                    <Box mt={2}>
                      <FormField label="Please specify">
                        <Input
                          value={lovedOneGenderCustom}
                          onChange={(e) => setLovedOneGenderCustom(e.target.value)}
                          placeholder="Please specify"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={COLORS.veniceBlue}
                          borderRadius="6px"
                          h="40px"
                          px={3}
                          border="1px solid"
                          borderColor="#d1d5db"
                          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{
                            borderColor: COLORS.teal,
                            boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                          }}
                        />
                      </FormField>
                    </Box>
                  )}
                </Box>
                <Box flex="1">
                  <FormField label="Age">
                    <Controller
                      name="lovedOne.age"
                      control={control}
                      render={({ field }) => (
                        <InputGroup>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Age"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontSize="14px"
                          />
                        </InputGroup>
                      )}
                    />
                  </FormField>
                </Box>
              </HStack>

              {/* Loved One Cancer Experience */}
              <HStack gap={6}>
                <Box flex="1">
                  <FormField label="Diagnosis">
                    <Controller
                      name="lovedOne.diagnosis"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectDropdown
                          options={[...DIAGNOSIS_OPTIONS]}
                          selectedValue={field.value || ''}
                          onSelectionChange={field.onChange}
                          placeholder="Select diagnosis"
                        />
                      )}
                    />
                  </FormField>
                </Box>
                <Box flex="1">
                  <FormField label="Date of Diagnosis">
                    <Controller
                      name="lovedOne.dateOfDiagnosis"
                      control={control}
                      render={({ field }) => (
                        <InputGroup>
                          <Input
                            {...field}
                            type="date"
                            placeholder="YYYY-MM-DD"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontSize="14px"
                          />
                        </InputGroup>
                      )}
                    />
                  </FormField>
                </Box>
              </HStack>

              <HStack gap={6} align="start">
                <Box flex="1">
                  <Text
                    color={COLORS.veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={2}
                  >
                    Which treatments have they done?
                  </Text>
                  <Text color={COLORS.fieldGray} fontSize="12px" mb={4}>
                    You can select a maximum of 2.
                  </Text>
                  <Controller
                    name="lovedOne.treatments"
                    control={control}
                    render={({ field }) => (
                      <CheckboxGroup
                        options={lovedOneTreatmentOptions}
                        selectedValues={field.value || []}
                        onValueChange={field.onChange}
                        maxSelections={2}
                      />
                    )}
                  />
                </Box>
                <Box flex="1">
                  <Text
                    color={COLORS.veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={2}
                  >
                    Which experiences do they have?
                  </Text>
                  <Text color={COLORS.fieldGray} fontSize="12px" mb={4}>
                    You can select a maximum of 5.
                  </Text>
                  <Controller
                    name="lovedOne.experiences"
                    control={control}
                    render={({ field }) => (
                      <CheckboxGroup
                        options={lovedOneExperienceOptions}
                        selectedValues={field.value || []}
                        onValueChange={field.onChange}
                        maxSelections={5}
                      />
                    )}
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Additional Information Section */}
        <Box>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Additional Information
          </Heading>
          <Text
            color={COLORS.fieldGray}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
            mb={8}
          >
            Is there anything else you&apos;d like to share with us?
          </Text>

          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              color={COLORS.veniceBlue}
              mb={2}
            >
              Additional Information (Optional)
            </Text>
            <Controller
              name="additionalInfo"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Please share any additional information that might be helpful..."
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color={COLORS.veniceBlue}
                  borderColor="#d1d5db"
                  borderRadius="6px"
                  minH="200px"
                  resize="vertical"
                  border="1px solid"
                  px={3}
                  py={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: COLORS.teal,
                    boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                  }}
                />
              )}
            />
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
