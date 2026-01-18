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
import baseAPIClient from '@/APIClients/baseAPIClient';
import { IntakeExperience, IntakeTreatment } from '@/types/intakeTypes';
import { detectCanadianTimezone } from '@/utils/timezoneUtils';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';

interface DemographicCancerFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  preferredLanguage: string;
  maritalStatus: string;
  hasKids: string;
  timezone: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
}

const getDefaultValues = (): DemographicCancerFormData => ({
  genderIdentity: '',
  pronouns: [],
  ethnicGroup: [],
  preferredLanguage: '',
  maritalStatus: '',
  hasKids: '',
  timezone: detectCanadianTimezone(),
  diagnosis: '',
  dateOfDiagnosis: '',
  treatments: [],
  experiences: [],
});

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

interface DemographicCancerFormProps {
  formType?: IntakeFormType;
  onNext: (data: DemographicCancerFormData) => void;
  hasBloodCancer?: 'yes' | 'no' | '';
  caringForSomeone?: 'yes' | 'no' | '';
}

// Option keys (English) - these are stored in database
const GENDER_IDENTITY_KEYS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe',
];

const PRONOUNS_KEYS = [
  'He/Him',
  'She/Her',
  'They/Them',
  'Ze/Zir',
  'Prefer not to answer',
  'Self-describe',
];

const TIMEZONE_OPTIONS = ['NST', 'AST', 'EST', 'CST', 'MST', 'PST'];

const MARITAL_STATUS_KEYS = ['Single', 'Married/Common Law', 'Divorced', 'Widowed'];

const HAS_KIDS_KEYS = ['Yes', 'No', 'Prefer not to answer'];

const ETHNIC_KEYS = [
  'Black (including African and Caribbean descent)',
  'Middle Eastern, Western or Central Asian',
  'East Asian',
  'South Asian',
  'Southeast Asian',
  'Indigenous person from Canada',
  'Latin American',
  'White',
  'Mixed Ethnicity (Individuals who identify with more than one racial/ethnic or cultural group)',
  'Prefer not to answer',
  'Another background/Prefer to self-describe (please specify):',
];

const LANGUAGE_OPTIONS = ['English', 'Français'];

// Helper to convert between display names and language codes
const languageToCode = (language: string): string => {
  return language === 'English' ? 'en' : language === 'Français' ? 'fr' : '';
};

const codeToLanguage = (code: string): string => {
  return code === 'en' ? 'English' : code === 'fr' ? 'Français' : '';
};

export function DemographicCancerForm({
  formType,
  onNext,
  hasBloodCancer,
  caringForSomeone,
}: DemographicCancerFormProps) {
  const t = useTranslations('intake');
  const tOptions = useTranslations('options');
  const { control, handleSubmit, formState, watch } = useForm<DemographicCancerFormData>({
    defaultValues: getDefaultValues(),
  });
  const { errors, isSubmitting } = formState;

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
  const pronounsOptions = PRONOUNS_KEYS.map((key) => translateOption('pronouns', key));
  const maritalStatusOptions = MARITAL_STATUS_KEYS.map((key) =>
    translateOption('maritalStatus', key),
  );
  const hasKidsOptions = HAS_KIDS_KEYS.map((key) => translateOption('yesNoOptions', key));
  const ethnicOptions = ETHNIC_KEYS.map((key) => translateOption('ethnicGroups', key));
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
  const [pronounsCustom, setPronounsCustom] = useState('');
  const [ethnicGroupCustom, setEthnicGroupCustom] = useState('');
  const [treatmentKeys, setTreatmentKeys] = useState<string[]>([]);
  const [experienceKeys, setExperienceKeys] = useState<string[]>([]);

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
        alert(t('unexpectedStateError'));
        return;
      }

      const options = await getOptions(target);
      console.log(options);

      setTreatmentKeys(options.treatments.map((treatment: IntakeTreatment) => treatment.name));

      setExperienceKeys(options.experiences.map((experience: IntakeExperience) => experience.name));
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
        ethnicGroup: data.ethnicGroup.includes(
          'Another background/Prefer to self-describe (please specify):',
        )
          ? data.ethnicGroup.map((e) =>
              e === 'Another background/Prefer to self-describe (please specify):'
                ? ethnicGroupCustom
                : e,
            )
          : data.ethnicGroup,
      };

      console.log('Demographic cancer form data:', finalData);
      onNext(finalData);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(t('errorSubmittingForm'));
    }
  };

  const formTitle = formType === 'volunteer' ? t('volunteerForm') : t('serviceUserForm');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
      <StepIndicator currentStep={2} />

      {/* Demographic Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('yourDemographicInformation')}
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color="brand.fieldText"
          mb={6}
        >
          {formType === 'volunteer'
            ? t('serviceUserDemographicInfo')
            : t('demographicCanBeTakenIntoAccount')}
        </Text>

        <VStack gap={5} align="stretch">
          {/* Gender Identity with conditional Self-describe */}
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
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}
          </ResponsiveFieldGroup>

          {/* Pronouns with conditional Self-describe */}
          <ResponsiveFieldGroup>
            <FormField label={t('pronouns')} error={errors.pronouns?.message}>
              <Controller
                name="pronouns"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return t('validation.pronounsRequired');
                    }
                    if (value.includes('Self-describe') && !pronounsCustom.trim()) {
                      return t('validation.pronounsSpecifyRequired');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <MultiSelectDropdown
                    options={pronounsOptions}
                    selectedValues={(field.value || []).map((key) =>
                      keyToDisplay(pronounsOptions, PRONOUNS_KEYS, key),
                    )}
                    onSelectionChange={(displays) =>
                      field.onChange(
                        displays.map((d) => displayToKey(pronounsOptions, PRONOUNS_KEYS, d)),
                      )
                    }
                    placeholder={t('pronouns')}
                    error={!!errors.pronouns}
                  />
                )}
              />
            </FormField>

            {pronouns.includes('Self-describe') && (
              <FormField label={t('placeholders.pleaseSpecify')}>
                <Input
                  value={pronounsCustom}
                  onChange={(e) => setPronounsCustom(e.target.value)}
                  placeholder={t('placeholders.pleaseSpecify')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  h="40px"
                  px={3}
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}
          </ResponsiveFieldGroup>

          {/* Time Zone */}
          <FormField label={t('timeZone')} error={errors.timezone?.message}>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: t('validation.timeZoneRequired') }}
              render={({ field }) => (
                <SingleSelectDropdown
                  options={TIMEZONE_OPTIONS}
                  selectedValue={field.value || ''}
                  onSelectionChange={field.onChange}
                  placeholder={t('timeZone')}
                  error={!!errors.timezone}
                />
              )}
            />
          </FormField>

          {/* Ethnic Group + Preferred Language */}
          <ResponsiveFieldGroup>
            <FormField label={t('ethnicGroup')} error={errors.ethnicGroup?.message}>
              <Controller
                name="ethnicGroup"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return t('validation.ethnicGroupRequired');
                    }
                    if (
                      value.includes(
                        'Another background/Prefer to self-describe (please specify):',
                      ) &&
                      !ethnicGroupCustom.trim()
                    ) {
                      return t('validation.ethnicGroupRequired');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <MultiSelectDropdown
                    options={ethnicOptions}
                    selectedValues={(field.value || []).map((key) =>
                      keyToDisplay(ethnicOptions, ETHNIC_KEYS, key),
                    )}
                    onSelectionChange={(displays) =>
                      field.onChange(
                        displays.map((d) => displayToKey(ethnicOptions, ETHNIC_KEYS, d)),
                      )
                    }
                    placeholder={t('ethnicGroup')}
                    error={!!errors.ethnicGroup}
                  />
                )}
              />
            </FormField>

            {ethnicGroup.includes(
              'Another background/Prefer to self-describe (please specify):',
            ) && (
              <FormField label={t('placeholders.pleaseSpecify')}>
                <Input
                  value={ethnicGroupCustom}
                  onChange={(e) => setEthnicGroupCustom(e.target.value)}
                  placeholder={t('placeholders.pleaseSpecify')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  h="40px"
                  px={3}
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}

            <FormField label={t('preferredLanguage')} error={errors.preferredLanguage?.message}>
              <Controller
                name="preferredLanguage"
                control={control}
                rules={{ required: t('validation.languageRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={LANGUAGE_OPTIONS}
                    selectedValue={codeToLanguage(field.value || '')}
                    onSelectionChange={(language) => field.onChange(languageToCode(language))}
                    placeholder={t('preferredLanguage')}
                    error={!!errors.preferredLanguage}
                  />
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>

          {/* Self-describe input for Ethnic Group (conditional, full width) */}
          {ethnicGroup.includes('Self-describe') && (
            <FormField label={t('placeholders.pleaseSpecify')}>
              <Input
                value={ethnicGroupCustom}
                onChange={(e) => setEthnicGroupCustom(e.target.value)}
                placeholder={t('placeholders.pleaseSpecify')}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14px"
                color="brand.navy"
                borderColor="#d1d5db"
                borderRadius="6px"
                h="40px"
                border="1px solid"
                px={3}
                _placeholder={{ color: '#9ca3af' }}
                _focus={{
                  borderColor: 'brand.primary',
                  boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                }}
              />
            </FormField>
          )}

          {/* Marital Status and Kids */}
          <ResponsiveFieldGroup>
            <FormField label={t('maritalStatus')} error={errors.maritalStatus?.message}>
              <Controller
                name="maritalStatus"
                control={control}
                rules={{ required: t('validation.maritalStatusRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={maritalStatusOptions}
                    selectedValue={keyToDisplay(
                      maritalStatusOptions,
                      MARITAL_STATUS_KEYS,
                      field.value || '',
                    )}
                    onSelectionChange={(display) =>
                      field.onChange(
                        displayToKey(maritalStatusOptions, MARITAL_STATUS_KEYS, display),
                      )
                    }
                    placeholder={t('maritalStatus')}
                    error={!!errors.maritalStatus}
                  />
                )}
              />
            </FormField>

            <FormField label={t('doYouHaveKids')} error={errors.hasKids?.message}>
              <Controller
                name="hasKids"
                control={control}
                rules={{ required: t('validation.hasKidsRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={hasKidsOptions}
                    selectedValue={keyToDisplay(hasKidsOptions, HAS_KIDS_KEYS, field.value || '')}
                    onSelectionChange={(display) =>
                      field.onChange(displayToKey(hasKidsOptions, HAS_KIDS_KEYS, display))
                    }
                    placeholder={t('doYouHaveKids')}
                    error={!!errors.hasKids}
                  />
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>
        </VStack>
      </Box>

      {/* Cancer Experience Section - Only show if user has blood cancer */}
      {hasBloodCancer === 'yes' && (
        <Box mb={10}>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color="brand.navy"
            fontSize="20px"
            mb={3}
          >
            {t('yourCancerExperience')}
          </Heading>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color="brand.fieldText"
            mb={6}
          >
            {formType === 'volunteer'
              ? t('serviceUserBloodCancerDescription')
              : t('demographicCanAlsoBeTakenIntoAccount')}
          </Text>

          <VStack gap={6} align="stretch">
            {/* Diagnosis and Date */}
            <ResponsiveFieldGroup>
              <FormField label={t('yourDiagnosis')} error={errors.diagnosis?.message}>
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
                      placeholder={t('yourDiagnosis')}
                      error={!!errors.diagnosis}
                    />
                  )}
                />
              </FormField>

              <FormField label={t('yourDateOfDiagnosis')} error={errors.dateOfDiagnosis?.message}>
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
                  {t('treatmentsDone')}
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
                  {t('experiencesYouHad')}
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
      )}

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
          {t('nextSection')}
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
  timezone: string;
}

const getBasicDefaultValues = (): BasicDemographicsFormData => ({
  genderIdentity: '',
  pronouns: [],
  ethnicGroup: [],
  preferredLanguage: '',
  maritalStatus: '',
  hasKids: '',
  timezone: detectCanadianTimezone(),
});

interface BasicDemographicsFormProps {
  formType?: IntakeFormType;
  onNext: (data: BasicDemographicsFormData) => void;
}

export function BasicDemographicsForm({ formType, onNext }: BasicDemographicsFormProps) {
  const t = useTranslations('intake');
  const tOptions = useTranslations('options');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<BasicDemographicsFormData>({
    defaultValues: getBasicDefaultValues(),
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
  const pronounsOptions = PRONOUNS_KEYS.map((key) => translateOption('pronouns', key));
  const maritalStatusOptions = MARITAL_STATUS_KEYS.map((key) =>
    translateOption('maritalStatus', key),
  );
  const hasKidsOptions = HAS_KIDS_KEYS.map((key) => translateOption('yesNoOptions', key));
  const ethnicOptions = ETHNIC_KEYS.map((key) => translateOption('ethnicGroups', key));

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
        ethnicGroup: data.ethnicGroup.includes(
          'Another background/Prefer to self-describe (please specify):',
        )
          ? data.ethnicGroup.map((e) =>
              e === 'Another background/Prefer to self-describe (please specify):'
                ? ethnicGroupCustom
                : e,
            )
          : data.ethnicGroup,
      };

      console.log('Basic demographics form data:', finalData);
      onNext(finalData);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(t('errorSubmittingForm'));
    }
  };

  const formTitle = formType === 'volunteer' ? t('volunteerForm') : t('serviceUserForm');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
      <StepIndicator currentStep={2} />

      {/* Demographic Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('yourDemographicInformation')}
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color="brand.fieldText"
          mb={6}
        >
          {formType === 'volunteer'
            ? t('serviceUserDemographicInfo')
            : t('demographicCanBeTakenIntoAccount')}
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
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}
          </ResponsiveFieldGroup>

          {/* Pronouns */}
          <ResponsiveFieldGroup>
            <FormField label={t('pronouns')} error={errors.pronouns?.message}>
              <Controller
                name="pronouns"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return t('validation.pronounsRequired');
                    }
                    if (value.includes('Self-describe') && !pronounsCustom.trim()) {
                      return t('validation.pronounsSpecifyRequired');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <MultiSelectDropdown
                    options={pronounsOptions}
                    selectedValues={(field.value || []).map((key) =>
                      keyToDisplay(pronounsOptions, PRONOUNS_KEYS, key),
                    )}
                    onSelectionChange={(displays) =>
                      field.onChange(
                        displays.map((d) => displayToKey(pronounsOptions, PRONOUNS_KEYS, d)),
                      )
                    }
                    placeholder={t('pronouns')}
                    error={!!errors.pronouns}
                  />
                )}
              />
            </FormField>

            {pronouns.includes('Self-describe') && (
              <FormField label={t('placeholders.pleaseSpecify')}>
                <Input
                  value={pronounsCustom}
                  onChange={(e) => setPronounsCustom(e.target.value)}
                  placeholder={t('placeholders.pleaseSpecify')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  h="40px"
                  px={3}
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}
          </ResponsiveFieldGroup>

          {/* Time Zone */}
          <FormField label={t('timeZone')} error={errors.timezone?.message}>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: t('validation.timeZoneRequired') }}
              render={({ field }) => (
                <SingleSelectDropdown
                  options={TIMEZONE_OPTIONS}
                  selectedValue={field.value || ''}
                  onSelectionChange={field.onChange}
                  placeholder={t('timeZone')}
                  error={!!errors.timezone}
                />
              )}
            />
          </FormField>

          {/* Ethnic or Cultural Group (Left) and Preferred Language (Right) */}
          <ResponsiveFieldGroup>
            <FormField label={t('ethnicGroup')} error={errors.ethnicGroup?.message}>
              <Controller
                name="ethnicGroup"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return t('validation.ethnicGroupRequired');
                    }
                    if (
                      value.includes(
                        'Another background/Prefer to self-describe (please specify):',
                      ) &&
                      !ethnicGroupCustom.trim()
                    ) {
                      return t('validation.ethnicGroupRequired');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <MultiSelectDropdown
                    options={ethnicOptions}
                    selectedValues={(field.value || []).map((key) =>
                      keyToDisplay(ethnicOptions, ETHNIC_KEYS, key),
                    )}
                    onSelectionChange={(displays) =>
                      field.onChange(
                        displays.map((d) => displayToKey(ethnicOptions, ETHNIC_KEYS, d)),
                      )
                    }
                    placeholder={t('ethnicGroup')}
                    error={!!errors.ethnicGroup}
                  />
                )}
              />
            </FormField>

            {ethnicGroup.includes(
              'Another background/Prefer to self-describe (please specify):',
            ) && (
              <FormField label={t('placeholders.pleaseSpecify')}>
                <Input
                  value={ethnicGroupCustom}
                  onChange={(e) => setEthnicGroupCustom(e.target.value)}
                  placeholder={t('placeholders.pleaseSpecify')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  h="40px"
                  px={3}
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              </FormField>
            )}

            <FormField label={t('preferredLanguage')} error={errors.preferredLanguage?.message}>
              <Controller
                name="preferredLanguage"
                control={control}
                rules={{ required: t('validation.languageRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={LANGUAGE_OPTIONS}
                    selectedValue={codeToLanguage(field.value || '')}
                    onSelectionChange={(language) => field.onChange(languageToCode(language))}
                    placeholder={t('preferredLanguage')}
                    error={!!errors.preferredLanguage}
                  />
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>

          {/* Self-describe input for Ethnic Group (conditional, full width) */}
          {ethnicGroup.includes('Self-describe') && (
            <FormField label={t('placeholders.pleaseSpecify')}>
              <Input
                value={ethnicGroupCustom}
                onChange={(e) => setEthnicGroupCustom(e.target.value)}
                placeholder={t('placeholders.pleaseSpecify')}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14px"
                color="brand.navy"
                borderColor="#d1d5db"
                borderRadius="6px"
                h="40px"
                border="1px solid"
                px={3}
                _placeholder={{ color: '#9ca3af' }}
                _focus={{
                  borderColor: 'brand.primary',
                  boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                }}
              />
            </FormField>
          )}

          {/* Marital Status and Kids */}
          <ResponsiveFieldGroup>
            <FormField label={t('maritalStatus')} error={errors.maritalStatus?.message}>
              <Controller
                name="maritalStatus"
                control={control}
                rules={{ required: t('validation.maritalStatusRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={maritalStatusOptions}
                    selectedValue={keyToDisplay(
                      maritalStatusOptions,
                      MARITAL_STATUS_KEYS,
                      field.value || '',
                    )}
                    onSelectionChange={(display) =>
                      field.onChange(
                        displayToKey(maritalStatusOptions, MARITAL_STATUS_KEYS, display),
                      )
                    }
                    placeholder={t('maritalStatus')}
                    error={!!errors.maritalStatus}
                  />
                )}
              />
            </FormField>

            <FormField label={t('doYouHaveKids')} error={errors.hasKids?.message}>
              <Controller
                name="hasKids"
                control={control}
                rules={{ required: t('validation.hasKidsRequired') }}
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={hasKidsOptions}
                    selectedValue={keyToDisplay(hasKidsOptions, HAS_KIDS_KEYS, field.value || '')}
                    onSelectionChange={(display) =>
                      field.onChange(displayToKey(hasKidsOptions, HAS_KIDS_KEYS, display))
                    }
                    placeholder={t('doYouHaveKids')}
                    error={!!errors.hasKids}
                  />
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>
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
          {t('completeRegistration')}
        </Button>
      </Box>
    </form>
  );
}
