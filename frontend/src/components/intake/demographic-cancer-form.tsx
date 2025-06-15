import React, { useState, useEffect, useRef } from 'react';
import { Box, Heading, Button, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { COLORS } from '@/constants/form';

// Reusable Select component to replace inline styling
const StyledSelect: React.FC<{
  children: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: boolean;
}> = ({ children, value, onChange, error, ...props }) => (
  <select
    value={value}
    onChange={onChange}
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
    }}
    {...props}
  >
    {children}
  </select>
);

interface DemographicCancerFormData {
  genderIdentity: string;
  genderIdentityCustom: string;
  pronouns: string[];
  pronounsCustom: string;
  ethnicGroup: string[];
  ethnicGroupCustom: string;
  maritalStatus: string;
  hasKids: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  otherTreatment: string;
  experiences: string[];
  otherExperience: string;
}

const DEFAULT_VALUES: DemographicCancerFormData = {
  genderIdentity: '',
  genderIdentityCustom: '',
  pronouns: [],
  pronounsCustom: '',
  ethnicGroup: [],
  ethnicGroupCustom: '',
  maritalStatus: '',
  hasKids: '',
  diagnosis: '',
  dateOfDiagnosis: '',
  treatments: [],
  otherTreatment: '',
  experiences: [],
  otherExperience: '',
};

const TREATMENT_OPTIONS = [
  'Unknown',
  'Watch and Wait / Active Surveillance',
  'Chemotherapy',
  'Immunotherapy',
  'Oral Chemotherapy',
  'Radiation',
  'Maintenance Chemotherapy',
  'Palliative Care',
  'Transfusions',
  'Autologous Stem Cell Transplant',
  'Allogeneic Stem Cell Transplant',
  'Haplo Stem Cell Transplant',
  'CAR-T',
  'BTK Inhibitors',
];

const EXPERIENCE_OPTIONS = [
  'Brain Fog',
  'Caregiver Fatigue',
  'Communication Challenges',
  'Feeling Overwhelmed',
  'Fatigue',
  'Fertility Issues',
  'Graft vs Host',
  'Returning to work or school after/during treatment',
  'Speaking to your family or friends about the diagnosis',
  'Relapse',
  'Anxiety / Depression',
  'PTSD',
];

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
  onNext: () => void;
}

// Updated options to match Figma design - moved Self-describe to bottom
const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female', 
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe'
];

const PRONOUNS_OPTIONS = [
  'He/Him',
  'She/Her', 
  'They/Them',
  'Ze/Zir',
  'Prefer not to answer',
  'Self-describe'
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
  'Self-describe'
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
      onSelectionChange(selectedValues.filter(val => val !== option));
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
        <span style={{ 
          flex: '1', 
          textAlign: 'left', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: selectedValues.length > 0 ? COLORS.veniceBlue : '#9ca3af'
        }}>
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
                  cursor: 'pointer'
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

export function DemographicCancerForm({ onNext }: DemographicCancerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<DemographicCancerFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const otherTreatment = watch('otherTreatment') || '';
  const otherExperience = watch('otherExperience') || '';
  const genderIdentity = watch('genderIdentity') || '';
  const pronouns = watch('pronouns') || [];
  const ethnicGroup = watch('ethnicGroup') || [];

  const onSubmit = async (data: DemographicCancerFormData) => {
    try {
      console.log('Demographic cancer form data:', data);
      onNext();
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
        First Connection Participant Form
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
          This information can be taken into account when matching you with a service user.
        </Text>

        <VStack gap={5} align="stretch">
          {/* Gender Identity - Left aligned */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Gender Identity" error={errors.genderIdentity?.message}>
                <Controller
                  name="genderIdentity"
                  control={control}
                  render={({ field }) => (
                    <StyledSelect {...field} error={!!errors.genderIdentity}>
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
                <FormField label="Please specify" error={errors.genderIdentityCustom?.message}>
                  <Controller
                    name="genderIdentityCustom"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Please specify"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.genderIdentityCustom ? 'red.500' : '#d1d5db'}
                        borderRadius="6px"
                        h="40px"
                        border="1px solid"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      />
                    )}
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
                <FormField label="Please specify" error={errors.pronounsCustom?.message}>
                  <Controller
                    name="pronounsCustom"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Please specify"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.pronounsCustom ? 'red.500' : '#d1d5db'}
                        borderRadius="6px"
                        h="40px"
                        border="1px solid"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      />
                    )}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Ethnic or Cultural Group - Left aligned */}
          <HStack gap={4} w="full" align="start">
            <Box w="50%">
              <FormField label="Ethnic or Cultural Group" error={errors.ethnicGroup?.message}>
                <Controller
                  name="ethnicGroup"
                  control={control}
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
            
            {ethnicGroup.includes('Self-describe') && (
              <Box w="50%">
                <FormField label="Please specify" error={errors.ethnicGroupCustom?.message}>
                  <Controller
                    name="ethnicGroupCustom"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Please specify"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.ethnicGroupCustom ? 'red.500' : '#d1d5db'}
                        borderRadius="6px"
                        h="40px"
                        border="1px solid"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      />
                    )}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Marital Status and Kids - Keep side by side */}
          <HStack gap={4} w="full">
            <FormField label="Marital Status" error={errors.maritalStatus?.message} flex="1">
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.maritalStatus}>
                    
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
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.hasKids}>
                    
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
          This information can also be taken into account when matching you with a volunteer.
        </Text>

        <VStack gap={6}>
          {/* Diagnosis and Date */}
          <HStack gap={4} w="full">
            <FormField label="Your Diagnosis" error={errors.diagnosis?.message} flex="1">
              <Controller
                name="diagnosis"
                control={control}
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.diagnosis}>
                    <option value="">Acute Myeloid Leukaemia</option>
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
                    options={TREATMENT_OPTIONS}
                    selectedValues={field.value || []}
                    onValueChange={field.onChange}
                    maxSelections={2}
                    showOther
                    otherValue={otherTreatment}
                    onOtherChange={(value) => setValue('otherTreatment', value)}
                  />
                )}
              />
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
                    options={EXPERIENCE_OPTIONS}
                    selectedValues={field.value || []}
                    onValueChange={field.onChange}
                    maxSelections={5}
                    showOther
                    otherValue={otherExperience}
                    onOtherChange={(value) => setValue('otherExperience', value)}
                  />
                )}
              />
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
