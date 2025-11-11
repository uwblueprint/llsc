import React, { useState, useEffect, useRef } from 'react';
import { Box, Heading, Button, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { COLORS, VALIDATION } from '@/constants/form';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { IntakeExperience, IntakeTreatment } from '@/types/intakeTypes';

// Reusable Select component to replace inline styling
type StyledSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
  error?: boolean;
};

const StyledSelect = React.forwardRef<HTMLSelectElement, StyledSelectProps>(
  ({ children, error, style, ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: COLORS.veniceBlue,
        borderColor: error ? '#ef4444' : '#d1d5db',
        borderRadius: '6px',
        height: '40px',
        width: '100%',
        padding: '0 12px',
        border: '1px solid',
        outline: 'none',
        backgroundColor: 'white',
        textAlign: 'left',
        direction: 'ltr',
        ...(style || {}),
      }}
    >
      {children}
    </select>
  ),
);
StyledSelect.displayName = 'StyledSelect';

interface DemographicCancerFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  preferredLanguage: string;
  maritalStatus: string;
  hasKids: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
}

const DEFAULT_VALUES: DemographicCancerFormData = {
  genderIdentity: '',
  pronouns: [],
  ethnicGroup: [],
  preferredLanguage: '',
  maritalStatus: '',
  hasKids: '',
  diagnosis: '',
  dateOfDiagnosis: '',
  treatments: [],
  experiences: [],
};

const DIAGNOSIS_OPTIONS = [
  'Acute Myeloid Leukaemia',
  'Acute Lymphoblastic Leukaemia',
  'Chronic Myeloid Leukaemia',
  'Chronic Lymphocytic Leukaemia',
  'Hodgkin Lymphoma',
  'Non-Hodgkin Lymphoma',
  'Multiple Myeloma',
  'Myelodysplastic Syndrome',
  'Myelofibrosis',
  'Aplastic Anemia',
  'Other',
];

interface DemographicCancerFormProps {
  formType?: 'participant' | 'volunteer';
  onNext: (data: DemographicCancerFormData) => void;
  hasBloodCancer?: 'yes' | 'no' | '';
  caringForSomeone?: 'yes' | 'no' | '';
}

// Updated options to match Figma design - moved Self-describe to bottom
const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe',
];

const PRONOUNS_OPTIONS = [
  'He/Him',
  'She/Her',
  'They/Them',
  'Ze/Zir',
  'Prefer not to answer',
  'Self-describe',
];

const ETHNIC_OPTIONS = [
  'Indigenous',
  'Arab',
  'Black',
  'Chinese',
  'Filipino',
  'Japanese',
  'Korean',
  'Latin American',
  'South Asian',
  'Southeast Asian',
  'West Asian',
  'White',
  'Prefer not to answer',
  'Self-describe',
];

// Multi-select dropdown component
const MultiSelectDropdown: React.FC<{
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
}> = ({ options, selectedValues, onSelectionChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter((val) => val !== option));
    }
  };

  const displayText = selectedValues.length > 0 ? selectedValues.join(', ') : placeholder;

  return (
    <Box position="relative" w="full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: '40px',
          padding: '0 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: COLORS.veniceBlue,
          textAlign: 'left',
          cursor: 'pointer',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = COLORS.teal;
          e.target.style.boxShadow = `0 0 0 3px ${COLORS.teal}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      >
        <span
          style={{
            flex: '1',
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedValues.length > 0 ? COLORS.veniceBlue : '#9ca3af',
          }}
        >
          {displayText}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          bg="white"
          border="1px solid #d1d5db"
          borderRadius="6px"
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          zIndex={10}
          maxH="200px"
          overflowY="auto"
        >
          {options.map((option) => (
            <Box
              key={option}
              px={3}
              py={2}
              display="flex"
              alignItems="center"
              gap={2}
              _hover={{ bg: '#f9fafb' }}
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                const isSelected = selectedValues.includes(option);
                handleCheckboxChange(option, !isSelected);
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: COLORS.teal,
                  cursor: 'pointer',
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14px"
                color={COLORS.veniceBlue}
                cursor="pointer"
                flex="1"
              >
                {option}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export function DemographicCancerForm({
  formType,
  onNext,
  hasBloodCancer,
  caringForSomeone,
}: DemographicCancerFormProps) {
  const { control, handleSubmit, formState, watch } = useForm<DemographicCancerFormData>({
    defaultValues: DEFAULT_VALUES,
  });
  const { errors, isSubmitting } = formState;

  // Local state for custom values
  const [genderIdentityCustom, setGenderIdentityCustom] = useState('');
  const [pronounsCustom, setPronounsCustom] = useState('');
  const [ethnicGroupCustom, setEthnicGroupCustom] = useState('');
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);

  useEffect(() => {
    const run = async () => {
      const hasBloodCancerBool = hasBloodCancer === 'yes';
      const caringForSomeoneBool = caringForSomeone === 'yes';

      let target = '';
      if (hasBloodCancerBool && caringForSomeoneBool) {
        target = 'both';
      } else if (hasBloodCancerBool) {
        target = 'patient';
      } else if (caringForSomeoneBool) {
        target = 'caregiver';
      } else {
        // This form should only render if at least one of these answers is "yes".
        console.error(
          'Invalid intake flow state: neither hasBloodCancer nor caringForSomeone is "yes". ' +
            `Received hasBloodCancer="${hasBloodCancer}", caringForSomeone="${caringForSomeone}". ` +
            'This Demographic Cancer form expects at least one to be "yes".',
        );
        alert(
          'We hit an unexpected state.\n\n' +
            'This step is only shown if you have blood cancer or are caring for someone with blood cancer. ' +
            'Please go back to the previous step and select "Yes" for one of those questions, or navigate to the basic demographics form.',
        );
        return;
      }

      const options = await getOptions(target);
      console.log(options);

      setTreatmentOptions(options.treatments.map((treatment: IntakeTreatment) => treatment.name));

      setExperienceOptions(
        options.experiences.map((experience: IntakeExperience) => experience.name),
      );
    };

    run();
  }, [hasBloodCancer, caringForSomeone]);

  const genderIdentity = watch('genderIdentity') || '';
  const pronouns = watch('pronouns') || [];
  const ethnicGroup = watch('ethnicGroup') || [];

  const getOptions = async (target: string) => {
    const options = await baseAPIClient.get(`/intake/options?target=${target}`);
    return options.data;
  };
  const onSubmit = async (data: DemographicCancerFormData) => {
    try {
      // Merge custom values into the arrays
      const finalData = {
        ...data,
        genderIdentity:
          data.genderIdentity === 'Self-describe' ? genderIdentityCustom : data.genderIdentity,
        pronouns: data.pronouns.includes('Self-describe')
          ? data.pronouns.map((p) => (p === 'Self-describe' ? pronounsCustom : p))
          : data.pronouns,
        ethnicGroup: data.ethnicGroup.includes('Self-describe')
          ? data.ethnicGroup.map((e) => (e === 'Self-describe' ? ethnicGroupCustom : e))
          : data.ethnicGroup,
      };

      console.log('Demographic cancer form data:', finalData);
      onNext(finalData);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Error submitting form. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="28px"
        mb={8}
      >
        First Connection {formType === 'participant' ? 'Participant' : 'Volunteer'} Form
      </Heading>

      {/* Progress Bar */}
      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* Demographic Information Section */}
      <Box mb={10}>
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
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color={COLORS.fieldGray}
          mb={6}
        >
          {formType === 'volunteer'
            ? 'This information can be taken into account when matching you with a service user.'
            : 'This information can be taken into account when matching you with a volunteer.'}
        </Text>

        <VStack gap={5} align="stretch">
          {/* Gender Identity - Left aligned */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Gender Identity" error={errors.genderIdentity?.message}>
                <Controller
                  name="genderIdentity"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return 'Gender identity is required';
                      if (value === 'Self-describe' && !genderIdentityCustom.trim()) {
                        return 'Please specify your gender identity when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <StyledSelect {...field} error={!!errors.genderIdentity}>
                      <option value="">Gender Identity</option>
                      {GENDER_IDENTITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                />
              </FormField>
            </Box>

            {genderIdentity === 'Self-describe' && (
              <Box w="50%">
                <FormField label="Please specify">
                  <Input
                    value={genderIdentityCustom}
                    onChange={(e) => setGenderIdentityCustom(e.target.value)}
                    placeholder="Please specify"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    border="1px solid"
                    px={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Pronouns - Left aligned */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Pronouns" error={errors.pronouns?.message}>
                <Controller
                  name="pronouns"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return 'Please select at least one pronoun option';
                      }
                      if (value.includes('Self-describe') && !pronounsCustom.trim()) {
                        return 'Please specify your pronouns when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={PRONOUNS_OPTIONS}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Pronouns"
                    />
                  )}
                />
              </FormField>
            </Box>

            {pronouns.includes('Self-describe') && (
              <Box w="50%">
                <FormField label="Please specify">
                  <Input
                    value={pronounsCustom}
                    onChange={(e) => setPronounsCustom(e.target.value)}
                    placeholder="Please specify"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    border="1px solid"
                    px={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Ethnic or Cultural Group (Left) and Preferred Language (Right) */}
          <HStack gap={4} w="full" align="start">
            <Box flex="1">
              <FormField label="Ethnic or Cultural Group" error={errors.ethnicGroup?.message}>
                <Controller
                  name="ethnicGroup"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return 'Please select at least one ethnic or cultural group';
                      }
                      if (value.includes('Self-describe') && !ethnicGroupCustom.trim()) {
                        return 'Please specify your ethnic or cultural group when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={ETHNIC_OPTIONS}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Ethnic or Cultural Group"
                    />
                  )}
                />
              </FormField>
            </Box>

            <Box flex="1">
              <FormField label="Preferred Language" error={errors.preferredLanguage?.message}>
                <Controller
                  name="preferredLanguage"
                  control={control}
                  rules={{ required: 'Please select your preferred language' }}
                  render={({ field }) => (
                    <StyledSelect {...field} error={!!errors.preferredLanguage}>
                      <option value="">Select language</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </StyledSelect>
                  )}
                />
              </FormField>
            </Box>
          </HStack>

          {/* Self-describe input for Ethnic Group (conditional, full width) */}
          {ethnicGroup.includes('Self-describe') && (
            <Box w="full">
              <FormField label="Please specify your ethnic or cultural group">
                <Input
                  value={ethnicGroupCustom}
                  onChange={(e) => setEthnicGroupCustom(e.target.value)}
                  placeholder="Please specify"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color={COLORS.veniceBlue}
                  borderColor="#d1d5db"
                  borderRadius="6px"
                  h="40px"
                  border="1px solid"
                  px={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                />
              </FormField>
            </Box>
          )}

          {/* Marital Status and Kids - Keep side by side */}
          <HStack gap={4} w="full">
            <FormField label="Marital Status" error={errors.maritalStatus?.message} flex="1">
              <Controller
                name="maritalStatus"
                control={control}
                rules={{ required: 'Marital status is required' }}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.maritalStatus}>
                    <option value="">Marital Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                    <option value="common-law">Common Law</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </StyledSelect>
                )}
              />
            </FormField>

            <FormField label="Do you have kids?" error={errors.hasKids?.message} flex="1">
              <Controller
                name="hasKids"
                control={control}
                rules={{ required: 'Please specify if you have kids' }}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.hasKids}>
                    <option value="">Do you have kids?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </StyledSelect>
                )}
              />
            </FormField>
          </HStack>
        </VStack>
      </Box>

      {/* Cancer Experience Section */}
      <Box mb={10}>
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
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color={COLORS.fieldGray}
          mb={6}
        >
          {formType === 'volunteer'
            ? 'This information can also be taken into account when matching you with a service user.'
            : 'This information can also be taken into account when matching you with a volunteer.'}
        </Text>

        <VStack gap={6}>
          {/* Diagnosis and Date */}
          <HStack gap={4} w="full">
            <FormField label="Your Diagnosis" error={errors.diagnosis?.message} flex="1">
              <Controller
                name="diagnosis"
                control={control}
                rules={{ required: 'Diagnosis is required' }}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.diagnosis}>
                    <option value="">Select your diagnosis</option>
                    {DIAGNOSIS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </StyledSelect>
                )}
              />
            </FormField>

            <FormField
              label="Your Date of Diagnosis"
              error={errors.dateOfDiagnosis?.message}
              flex="1"
            >
              <Controller
                name="dateOfDiagnosis"
                control={control}
                rules={{
                  required: 'Date of diagnosis is required',
                  pattern: {
                    value: VALIDATION.DATE,
                    message: 'Please enter a valid date (DD/MM/YYYY)',
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="DD/MM/YYYY"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                      borderColor={errors.dateOfDiagnosis ? 'red.500' : '#d1d5db'}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </HStack>

          {/* Treatment and Experience Sections Side by Side */}
          <HStack gap={8} w="full" align="start">
            {/* Treatment Section */}
            <Box flex="1">
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                color={COLORS.veniceBlue}
                mb={2}
              >
                Which of the following treatments have you done?
              </Text>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12px"
                color={COLORS.fieldGray}
                mb={4}
              >
                You can select a maximum of 2.
              </Text>

              <Controller
                name="treatments"
                control={control}
                render={({ field }) => (
                  <CheckboxGroup
                    options={treatmentOptions}
                    selectedValues={field.value || []}
                    onValueChange={field.onChange}
                    maxSelections={2}
                  />
                )}
              />
              {errors.treatments && (
                <Text color="red.500" fontSize="12px" mt={2}>
                  {errors.treatments.message}
                </Text>
              )}
            </Box>

            {/* Experience Section */}
            <Box flex="1">
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                color={COLORS.veniceBlue}
                mb={2}
              >
                Which of the following do you have experience with?
              </Text>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12px"
                color={COLORS.fieldGray}
                mb={4}
              >
                You can select a maximum of 5.
              </Text>

              <Controller
                name="experiences"
                control={control}
                render={({ field }) => (
                  <CheckboxGroup
                    options={experienceOptions}
                    selectedValues={field.value || []}
                    onValueChange={field.onChange}
                    maxSelections={5}
                  />
                )}
              />
              {errors.experiences && (
                <Text color="red.500" fontSize="12px" mt={2}>
                  {errors.experiences.message}
                </Text>
              )}
            </Box>
          </HStack>
        </VStack>
      </Box>

      {/* Submit Button */}
      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          loading={isSubmitting}
          loadingText="Submitting..."
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Next Section →
        </Button>
      </Box>
    </form>
  );
}

// Basic Demographics Form for users with no cancer experience
interface BasicDemographicsFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  preferredLanguage: string;
  maritalStatus: string;
  hasKids: string;
}

const BASIC_DEFAULT_VALUES: BasicDemographicsFormData = {
  genderIdentity: '',
  pronouns: [],
  ethnicGroup: [],
  preferredLanguage: '',
  maritalStatus: '',
  hasKids: '',
};

interface BasicDemographicsFormProps {
  formType?: 'participant' | 'volunteer';
  onNext: (data: BasicDemographicsFormData) => void;
}

export function BasicDemographicsForm({ formType, onNext }: BasicDemographicsFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<BasicDemographicsFormData>({
    defaultValues: BASIC_DEFAULT_VALUES,
  });

  // Local state for custom values
  const [genderIdentityCustom, setGenderIdentityCustom] = useState('');
  const [pronounsCustom, setPronounsCustom] = useState('');
  const [ethnicGroupCustom, setEthnicGroupCustom] = useState('');

  const genderIdentity = watch('genderIdentity') || '';
  const pronouns = watch('pronouns') || [];
  const ethnicGroup = watch('ethnicGroup') || [];

  const onSubmit = async (data: BasicDemographicsFormData) => {
    try {
      // Merge custom values into the arrays
      const finalData = {
        ...data,
        genderIdentity:
          data.genderIdentity === 'Self-describe' ? genderIdentityCustom : data.genderIdentity,
        pronouns: data.pronouns.includes('Self-describe')
          ? data.pronouns.map((p) => (p === 'Self-describe' ? pronounsCustom : p))
          : data.pronouns,
        ethnicGroup: data.ethnicGroup.includes('Self-describe')
          ? data.ethnicGroup.map((e) => (e === 'Self-describe' ? ethnicGroupCustom : e))
          : data.ethnicGroup,
      };

      console.log('Basic demographics form data:', finalData);
      onNext(finalData);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Error submitting form. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="28px"
        mb={8}
      >
        First Connection {formType === 'participant' ? 'Participant' : 'Volunteer'} Form
      </Heading>

      {/* Progress Bar */}
      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* Demographic Information Section */}
      <Box mb={10}>
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
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color={COLORS.fieldGray}
          mb={6}
        >
          {formType === 'volunteer'
            ? 'This information helps us understand how you might be able to support others in the future.'
            : 'This information helps us understand your background and how we might be able to support you.'}
        </Text>

        <VStack gap={5} align="stretch">
          {/* Gender Identity */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Gender Identity" error={errors.genderIdentity?.message}>
                <Controller
                  name="genderIdentity"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return 'Gender identity is required';
                      if (value === 'Self-describe' && !genderIdentityCustom.trim()) {
                        return 'Please specify your gender identity when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <StyledSelect {...field} error={!!errors.genderIdentity}>
                      <option value="">Gender Identity</option>
                      {GENDER_IDENTITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                />
              </FormField>
            </Box>

            {genderIdentity === 'Self-describe' && (
              <Box w="50%">
                <FormField label="Please specify">
                  <Input
                    value={genderIdentityCustom}
                    onChange={(e) => setGenderIdentityCustom(e.target.value)}
                    placeholder="Please specify"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    border="1px solid"
                    px={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Pronouns */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Pronouns" error={errors.pronouns?.message}>
                <Controller
                  name="pronouns"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return 'Please select at least one pronoun option';
                      }
                      if (value.includes('Self-describe') && !pronounsCustom.trim()) {
                        return 'Please specify your pronouns when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={PRONOUNS_OPTIONS}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Pronouns"
                    />
                  )}
                />
              </FormField>
            </Box>

            {pronouns.includes('Self-describe') && (
              <Box w="50%">
                <FormField label="Please specify">
                  <Input
                    value={pronounsCustom}
                    onChange={(e) => setPronounsCustom(e.target.value)}
                    placeholder="Please specify"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    border="1px solid"
                    px={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Ethnic or Cultural Group (Left) and Preferred Language (Right) */}
          <HStack gap={4} w="full" align="start">
            <Box flex="1">
              <FormField label="Ethnic or Cultural Group" error={errors.ethnicGroup?.message}>
                <Controller
                  name="ethnicGroup"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return 'Please select at least one ethnic or cultural group';
                      }
                      if (value.includes('Self-describe') && !ethnicGroupCustom.trim()) {
                        return 'Please specify your ethnic or cultural group when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={ETHNIC_OPTIONS}
                      selectedValues={field.value || []}
                      onSelectionChange={field.onChange}
                      placeholder="Ethnic or Cultural Group"
                    />
                  )}
                />
              </FormField>
            </Box>

            <Box flex="1">
              <FormField label="Preferred Language" error={errors.preferredLanguage?.message}>
                <Controller
                  name="preferredLanguage"
                  control={control}
                  rules={{ required: 'Please select your preferred language' }}
                  render={({ field }) => (
                    <StyledSelect {...field} error={!!errors.preferredLanguage}>
                      <option value="">Select language</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </StyledSelect>
                  )}
                />
              </FormField>
            </Box>
          </HStack>

          {/* Self-describe input for Ethnic Group (conditional, full width) */}
          {ethnicGroup.includes('Self-describe') && (
            <Box w="full">
              <FormField label="Please specify your ethnic or cultural group">
                <Input
                  value={ethnicGroupCustom}
                  onChange={(e) => setEthnicGroupCustom(e.target.value)}
                  placeholder="Please specify"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color={COLORS.veniceBlue}
                  borderColor="#d1d5db"
                  borderRadius="6px"
                  h="40px"
                  border="1px solid"
                  px={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                />
              </FormField>
            </Box>
          )}

          {/* Marital Status and Kids */}
          <HStack gap={4} w="full">
            <FormField label="Marital Status" error={errors.maritalStatus?.message} flex="1">
              <Controller
                name="maritalStatus"
                control={control}
                rules={{ required: 'Marital status is required' }}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.maritalStatus}>
                    <option value="">Marital Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                    <option value="common-law">Common Law</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </StyledSelect>
                )}
              />
            </FormField>

            <FormField label="Do you have kids?" error={errors.hasKids?.message} flex="1">
              <Controller
                name="hasKids"
                control={control}
                rules={{ required: 'Please specify if you have kids' }}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.hasKids}>
                    <option value="">Do you have kids?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </StyledSelect>
                )}
              />
            </FormField>
          </HStack>
        </VStack>
      </Box>

      {/* Submit Button */}
      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          loading={isSubmitting}
          loadingText="Submitting..."
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Complete Registration →
        </Button>
      </Box>
    </form>
  );
}
