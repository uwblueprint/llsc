import React, { useState, useEffect } from 'react';
import { Box, Heading, Button, VStack, Text, Input, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { ResponsiveFieldGroup } from '@/components/layout';
import { StepIndicator } from '@/components/ui';
import { VALIDATION, getIntakeFormTitle, IntakeFormType } from '@/constants/form';
import { IntakeExperience, IntakeTreatment } from '@/types/intakeTypes';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';

// Option keys (English) - these are stored in database
const GENDER_IDENTITY_KEYS = [
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

// Diagnosis keys (English) - these are stored in database
const DIAGNOSIS_KEYS = [
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
  formType?: IntakeFormType;
  onSubmit: (data: LovedOneFormData) => void;
}

export function LovedOneForm({ formType = 'participant', onSubmit }: LovedOneFormProps) {
  const t = useTranslations('intake');
  const tOptions = useTranslations('options');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LovedOneFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  // Helper to translate option keys
  const translateOption = (category: string, key: string): string => {
    try {
      return tOptions(`${category}.${key}`);
    } catch {
      return key;
    }
  };

  // Create translated option arrays for display
  const genderIdentityOptions = GENDER_IDENTITY_KEYS.map((key) => translateOption('genders', key));
  const diagnosisOptions = DIAGNOSIS_KEYS.map((key) => translateOption('diagnoses', key));

  // Helpers to convert between display values and keys
  const displayToKey = (options: string[], keys: string[], display: string): string => {
    const index = options.indexOf(display);
    return index >= 0 ? keys[index] : display;
  };

  const keyToDisplay = (options: string[], keys: string[], key: string): string => {
    const index = keys.indexOf(key);
    return index >= 0 ? options[index] : key;
  };

  // Local state for custom values
  const [genderIdentityCustom, setGenderIdentityCustom] = useState('');
  const [treatmentKeys, setTreatmentKeys] = useState<string[]>([]);
  const [experienceKeys, setExperienceKeys] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      const target = 'patient';

      const options = await getOptions(target);

      setTreatmentKeys(options.treatments.map((treatment: IntakeTreatment) => treatment.name));

      setExperienceKeys(options.experiences.map((experience: IntakeExperience) => experience.name));
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
      alert(t('errorSubmittingForm'));
    }
  };

  const formTitle = formType === 'volunteer' ? t('volunteerForm') : t('serviceUserForm');

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {/* Header */}
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color="brand.navy"
        fontSize="28px"
        mb={8}
      >
        {formTitle}
      </Heading>

      {/* Progress Bar */}
      <StepIndicator currentStep={3} />

      {/* Loved One's Demographic Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('lovedOneDemographicInfo')}
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color="brand.fieldText"
          mb={6}
        >
          {formType === 'volunteer'
            ? t('serviceUserDemographicInfo')
            : t('lovedOneDemographicDescription')}
        </Text>

        <VStack gap={5} align="stretch">
          {/* Gender Identity */}
          <ResponsiveFieldGroup>
            <FormField label={t('genderIdentity')} error={errors.genderIdentity?.message}>
              <Controller
                name="genderIdentity"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return t('validation.genderRequired');
                    if (value === 'Self-describe' && !genderIdentityCustom.trim()) {
                      return t('validation.genderSpecifyRequired');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={genderIdentityOptions}
                    selectedValue={keyToDisplay(
                      genderIdentityOptions,
                      GENDER_IDENTITY_KEYS,
                      field.value || '',
                    )}
                    onSelectionChange={(display) =>
                      field.onChange(
                        displayToKey(genderIdentityOptions, GENDER_IDENTITY_KEYS, display),
                      )
                    }
                    placeholder={t('genderIdentity')}
                    error={!!errors.genderIdentity}
                  />
                )}
              />
            </FormField>

            {genderIdentity === 'Self-describe' && (
              <FormField label={t('placeholders.pleaseSpecify')}>
                <Input
                  value={genderIdentityCustom}
                  onChange={(e) => setGenderIdentityCustom(e.target.value)}
                  placeholder={t('placeholders.pleaseSpecify')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  h="40px"
                  px={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}
          </ResponsiveFieldGroup>

          {/* Age */}
          <FormField label={t('age')} error={errors.age?.message}>
            <Controller
              name="age"
              control={control}
              rules={{ required: t('validation.ageRequired') }}
              render={({ field }) => (
                <InputGroup>
                  <Input
                    {...field}
                    placeholder={t('age')}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                    borderColor={errors.age ? 'red.500' : undefined}
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{
                      borderColor: 'brand.primary',
                      boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                    }}
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
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('lovedOneBloodCancerExperience')}
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color="brand.fieldText"
          mb={6}
        >
          {formType === 'volunteer'
            ? t('serviceUserBloodCancerDescription')
            : t('lovedOneBloodCancerDescription')}
        </Text>

        <VStack gap={6} align="stretch">
          {/* Diagnosis and Date */}
          <ResponsiveFieldGroup>
            <FormField label={t('theirDiagnosis')} error={errors.diagnosis?.message}>
              <Controller
                name="diagnosis"
                control={control}
                rules={{ required: t('validation.diagnosisRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={diagnosisOptions}
                    selectedValue={keyToDisplay(
                      diagnosisOptions,
                      DIAGNOSIS_KEYS,
                      field.value || '',
                    )}
                    onSelectionChange={(display) =>
                      field.onChange(displayToKey(diagnosisOptions, DIAGNOSIS_KEYS, display))
                    }
                    placeholder={t('placeholders.selectTheirDiagnosis')}
                    error={!!errors.diagnosis}
                  />
                )}
              />
            </FormField>

            <FormField label={t('theirDateOfDiagnosis')} error={errors.dateOfDiagnosis?.message}>
              <Controller
                name="dateOfDiagnosis"
                control={control}
                rules={{
                  required: t('validation.dateOfDiagnosisRequired'),
                  pattern: {
                    value: VALIDATION.DATE,
                    message: t('validation.invalidDateFormat'),
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.dateFormat')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.dateOfDiagnosis ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{
                        borderColor: 'brand.primary',
                        boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                      }}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>

          {/* Treatment and Experience Sections Side by Side on Desktop, Stacked on Mobile */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full">
            {/* Treatment Section */}
            <Box>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                color="brand.navy"
                mb={2}
              >
                {t('treatmentsTheyDone')}
              </Text>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12px"
                color="brand.fieldText"
                mb={4}
              >
                {t('selectMaximum2')}
              </Text>

              <Controller
                name="treatments"
                control={control}
                render={({ field }) => {
                  const translatedTreatmentOptions = treatmentKeys.map((key) =>
                    translateOption('treatments', key),
                  );
                  return (
                    <CheckboxGroup
                      options={translatedTreatmentOptions}
                      selectedValues={(field.value || []).map((key: string) =>
                        translateOption('treatments', key),
                      )}
                      onValueChange={(displays) => {
                        const keys = displays.map((d) =>
                          displayToKey(translatedTreatmentOptions, treatmentKeys, d),
                        );
                        field.onChange(keys);
                      }}
                      maxSelections={2}
                    />
                  );
                }}
              />
              {errors.treatments && (
                <Text color="red.500" fontSize="12px" mt={2}>
                  {errors.treatments.message}
                </Text>
              )}
            </Box>

            {/* Experience Section */}
            <Box>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                color="brand.navy"
                mb={2}
              >
                {t('experiencesTheyHad')}
              </Text>
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12px"
                color="brand.fieldText"
                mb={4}
              >
                {t('selectMaximum5')}
              </Text>

              <Controller
                name="experiences"
                control={control}
                render={({ field }) => {
                  const translatedExperienceOptions = experienceKeys.map((key) =>
                    translateOption('experiences', key),
                  );
                  return (
                    <CheckboxGroup
                      options={translatedExperienceOptions}
                      selectedValues={(field.value || []).map((key: string) =>
                        translateOption('experiences', key),
                      )}
                      onValueChange={(displays) => {
                        const keys = displays.map((d) =>
                          displayToKey(translatedExperienceOptions, experienceKeys, d),
                        );
                        field.onChange(keys);
                      }}
                      maxSelections={5}
                    />
                  );
                }}
              />
              {errors.experiences && (
                <Text color="red.500" fontSize="12px" mt={2}>
                  {errors.experiences.message}
                </Text>
              )}
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Submit Button */}
      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primaryEmphasis' }}
          _active={{ bg: 'brand.primaryEmphasis' }}
          loading={isSubmitting}
          loadingText={t('submitting')}
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          {t('submitPeerSupportRequest')}
        </Button>
      </Box>
    </form>
  );
}
