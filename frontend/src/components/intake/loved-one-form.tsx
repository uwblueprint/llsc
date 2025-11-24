import React, { useState, useEffect } from 'react';
import { Box, Heading, Button, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { COLORS, VALIDATION } from '@/constants/form';
import { IntakeExperience, IntakeTreatment } from '@/types/intakeTypes';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';

const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe',
];

interface LovedOneFormData {
  genderIdentity: string;
  age: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
}

const DEFAULT_VALUES: LovedOneFormData = {
  genderIdentity: '',
  age: '',
  diagnosis: '',
  dateOfDiagnosis: '',
  treatments: [],
  experiences: [],
};

const DIAGNOSIS_OPTIONS = [
  'Unknown',
  'Acute Myeloid Leukemia',
  'Acute Lymphoblastic Leukemia',
  'Acute Promyelocytic Leukemia',
  'Mixed Phenotype Leukemia',
  'Chronic Lymphocytic Leukemia/Small Lymphocytic Lymphoma',
  'Chronic Myeloid Leukemia',
  'Hairy Cell Leukemia',
  'Myeloma/Multiple Myeloma',
  "Hodgkin's Lymphoma",
  "Indolent/Low Grade Non-Hodgkin's Lymphoma",
];

interface LovedOneFormProps {
  formType?: 'participant' | 'volunteer';
  onSubmit: (data: LovedOneFormData) => void;
}

export function LovedOneForm({ formType = 'participant', onSubmit }: LovedOneFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LovedOneFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  // Local state for custom values
  const [genderIdentityCustom, setGenderIdentityCustom] = useState('');
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);

  useEffect(() => {
    const run = async () => {
      const target = 'patient';

      const options = await getOptions(target);

      setTreatmentOptions(options.treatments.map((treatment: IntakeTreatment) => treatment.name));

      setExperienceOptions(
        options.experiences.map((experience: IntakeExperience) => experience.name),
      );
    };

    run();
  }, []);

  const genderIdentity = watch('genderIdentity') || '';

  const getOptions = async (target: string) => {
    const options = await baseAPIClient.get(`/intake/options?target=${target}`);
    return options.data;
  };

  const onFormSubmit = async (data: LovedOneFormData) => {
    try {
      // Merge custom values into the data
      const finalData = {
        ...data,
        genderIdentity:
          data.genderIdentity === 'Self-describe' ? genderIdentityCustom : data.genderIdentity,
      };

      console.log('Loved one form data:', finalData);
      onSubmit(finalData);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Error submitting form. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
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
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* Loved One's Demographic Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Your Loved One&apos;s Demographic Information
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
          {/* Gender Identity */}
          <HStack gap={8} w="full" align="start">
            <Box w="50%">
              <FormField label="Gender Identity" error={errors.genderIdentity?.message}>
                <Controller
                  name="genderIdentity"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return 'Gender identity is required';
                      if (value === 'Self-describe' && !genderIdentityCustom.trim()) {
                        return 'Please specify gender identity when selecting Self-describe';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <SingleSelectDropdown
                      options={GENDER_IDENTITY_OPTIONS}
                      selectedValue={field.value || ''}
                      onSelectionChange={field.onChange}
                      placeholder="Gender Identity"
                      error={!!errors.genderIdentity}
                    />
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
                    placeholder="Please specify gender identity"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderRadius="6px"
                    h="40px"
                    px={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </FormField>
              </Box>
            )}
          </HStack>

          {/* Age */}
          <FormField label="Age" error={errors.age?.message}>
            <Controller
              name="age"
              control={control}
              rules={{ required: 'Age is required' }}
              render={({ field }) => (
                <InputGroup>
                  <Input
                    {...field}
                    placeholder="Age"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor={errors.age ? 'red.500' : undefined}
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                  />
                </InputGroup>
              )}
            />
          </FormField>
        </VStack>
      </Box>

      {/* Loved One's Cancer Experience Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Your Loved One&apos;s Cancer Experience
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
            <FormField label="Their Diagnosis" error={errors.diagnosis?.message} flex="1">
              <Controller
                name="diagnosis"
                control={control}
                rules={{ required: 'Diagnosis is required' }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={DIAGNOSIS_OPTIONS}
                    selectedValue={field.value || ''}
                    onSelectionChange={field.onChange}
                    placeholder="Select their diagnosis"
                    error={!!errors.diagnosis}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Their Date of Diagnosis"
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
                      borderColor={errors.dateOfDiagnosis ? 'red.500' : undefined}
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
                Which of the following treatments have they done?
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
          Submit Your Peer Support Request →
        </Button>
      </Box>
    </form>
  );
}
