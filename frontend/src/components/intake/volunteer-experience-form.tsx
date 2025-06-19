import React, { useState, useEffect, useRef } from 'react';
import { Box, Heading, Button, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { COLORS } from '@/constants/form';

// Reusable Select component
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

interface VolunteerExperienceFormData {
  genderIdentity: string;
  pronouns: string;
  ethnicGroup: string;
  maritalStatus: string;
  hasKids: string;
  experiences: string[];
  otherExperience: string;
}

const DEFAULT_VALUES: VolunteerExperienceFormData = {
  genderIdentity: '',
  pronouns: '',
  ethnicGroup: '',
  maritalStatus: '',
  hasKids: '',
  experiences: [],
  otherExperience: '',
};

const EXPERIENCE_OPTIONS = [
  'Brain Fog',
  'Caregiver Fatigue',
  'Communication Challenges',
  'Feeling Overwhelmed',
  'Fatigue',
  'Fertility Issues',
  'Graft vs Host',
  'Relapse',
  'Anxiety / Depression',
  'PTSD',
];

interface VolunteerExperienceFormProps {
  onNext: () => void;
}

export function VolunteerExperienceForm({ onNext }: VolunteerExperienceFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<VolunteerExperienceFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const otherExperience = watch('otherExperience') || '';

  const onSubmit = async (data: VolunteerExperienceFormData) => {
    try {
      console.log('Volunteer experience form data:', data);
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
        First Connection Volunteer Form
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

      {/* Your Demographic Information Section */}
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
          {/* Gender Identity */}
          <FormField label="Gender Identity" error={errors.genderIdentity?.message}>
            <Controller
              name="genderIdentity"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.genderIdentity}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="transgender">Transgender</option>
                  <option value="prefer-not-to-answer">Prefer not to answer</option>
                  <option value="self-describe">Self-describe</option>
                </StyledSelect>
              )}
            />
          </FormField>

          {/* Pronouns */}
          <FormField label="Pronouns" error={errors.pronouns?.message}>
            <Controller
              name="pronouns"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.pronouns}>
                  <option value="">Pronouns</option>
                  <option value="he/him">He/Him</option>
                  <option value="she/her">She/Her</option>
                  <option value="they/them">They/Them</option>
                  <option value="ze/zir">Ze/Zir</option>
                  <option value="prefer-not-to-answer">Prefer not to answer</option>
                  <option value="self-describe">Self-describe</option>
                </StyledSelect>
              )}
            />
          </FormField>

          {/* Ethnic or Cultural Group */}
          <FormField label="Ethnic or Cultural Group" error={errors.ethnicGroup?.message}>
            <Controller
              name="ethnicGroup"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.ethnicGroup}>
                  <option value="">Ethnic or Cultural Group</option>
                  <option value="indigenous">Indigenous</option>
                  <option value="arab">Arab</option>
                  <option value="black">Black</option>
                  <option value="chinese">Chinese</option>
                  <option value="filipino">Filipino</option>
                  <option value="japanese">Japanese</option>
                  <option value="korean">Korean</option>
                  <option value="latin-american">Latin American</option>
                  <option value="south-asian">South Asian</option>
                  <option value="southeast-asian">Southeast Asian</option>
                  <option value="west-asian">West Asian</option>
                  <option value="white">White</option>
                  <option value="prefer-not-to-answer">Prefer not to answer</option>
                  <option value="self-describe">Self-describe</option>
                </StyledSelect>
              )}
            />
          </FormField>

          {/* Marital Status and Kids */}
          <HStack gap={4} w="full">
            <FormField label="Marital Status" error={errors.maritalStatus?.message} flex="1">
              <Controller
                name="maritalStatus"
                control={control}
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
                render={({ field }) => (
                  <StyledSelect {...field} error={!!errors.hasKids}>
                    <option value="">Yes/No</option>
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

      {/* Your Experience Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Your Experience
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color={COLORS.fieldGray}
          mb={6}
        >
          This information can also be taken into account when matching you with a service user.
        </Text>

        <VStack gap={6}>
          {/* Experience Section */}
          <Box w="full">
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
