import React from 'react';
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
  pronouns: string;
  ethnicGroup: string;
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
  pronouns: '',
  ethnicGroup: '',
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
  onBack: () => void;
  onNext: () => void;
}

export function DemographicCancerForm({ onBack, onNext }: DemographicCancerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<DemographicCancerFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const selectedTreatments = watch('treatments') || [];
  const selectedExperiences = watch('experiences') || [];
  const otherTreatment = watch('otherTreatment') || '';
  const otherExperience = watch('otherExperience') || '';

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

        <VStack gap={5}>
          {/* Gender Identity */}
          <FormField label="Gender Identity" error={errors.genderIdentity?.message} flex="1">
            <Controller
              name="genderIdentity"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.genderIdentity}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </StyledSelect>
              )}
            />
          </FormField>

          {/* Pronouns */}
          <FormField label="Pronouns" error={errors.pronouns?.message} flex="1">
            <Controller
              name="pronouns"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.pronouns}>
                  <option value="">Pronouns</option>
                  <option value="he/him">He/Him</option>
                  <option value="she/her">She/Her</option>
                  <option value="they/them">They/Them</option>
                  <option value="other">Other</option>
                </StyledSelect>
              )}
            />
          </FormField>

          {/* Ethnic or Cultural Group */}
          <FormField label="Ethnic or Cultural Group" error={errors.ethnicGroup?.message} flex="1">
            <Controller
              name="ethnicGroup"
              control={control}
              render={({ field }) => (
                <StyledSelect {...field} error={!!errors.ethnicGroup}>
                  <option value="">Ethnic or Cultural Group</option>
                  <option value="caucasian">Caucasian</option>
                  <option value="asian">Asian</option>
                  <option value="african">African</option>
                  <option value="hispanic">Hispanic</option>
                  <option value="indigenous">Indigenous</option>
                  <option value="middle-eastern">Middle Eastern</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
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
      <Button
        type="submit"
        bg={COLORS.teal}
        color="white"
        _hover={{ bg: COLORS.teal }}
        _active={{ bg: COLORS.teal }}
        loading={isSubmitting}
        loadingText="Submitting..."
        w="auto"
        h="48px"
        fontSize="16px"
        fontWeight={500}
        px={8}
        ml="auto"
        display="flex"
      >
        Next Section →
      </Button>
    </form>
  );
}
