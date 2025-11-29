import React, { useEffect, useMemo, useState } from 'react';
import { VStack, HStack, Text, Box, Input, Textarea, Spinner } from '@chakra-ui/react';
import {
  IntakeFormData,
  COLORS as FORM_COLORS,
  PROVINCES,
  PRONOUNS_OPTIONS,
  ETHNIC_GROUP_OPTIONS,
  TIMEZONE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HAS_KIDS_OPTIONS,
  CAREGIVER_RELATIONSHIP_OPTIONS,
  DEFAULT_TREATMENTS,
  DEFAULT_EXPERIENCES,
  DIAGNOSIS_OPTIONS,
} from '@/constants/form';
import { CustomRadio } from '@/components/CustomRadio';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { IntakeOptionsResponse } from '@/types/intakeTypes';
import {
  VolunteerFormAnswers,
  normalizeIntakeAnswers,
  DEFAULT_CANCER_EXPERIENCE,
  DEFAULT_LOVED_ONE,
  cloneDefaultLovedOne,
  buildCommaSeparatedDefaults,
  parseCommaSeparated,
  mergeOptionsWithSelections,
  uniqueConcat,
} from '@/utils/adminFormHelpers/intake';
import type { CommaSeparatedFieldKey } from '@/utils/adminFormHelpers/intake';
import { SectionCard } from './SectionCard';
import { INPUT_STYLES, SelectField, TEXTAREA_STYLES } from './shared';
import { GenderIdentityField } from './GenderIdentityField';

interface IntakeFormEditorProps {
  initialAnswers: VolunteerFormAnswers;
  onChange?: (answers: VolunteerFormAnswers, hasChanges: boolean) => void;
}

type DemographicScalarField = Exclude<
  keyof VolunteerFormAnswers['demographics'],
  'pronouns' | 'ethnicGroup'
>;

export const IntakeFormEditor: React.FC<IntakeFormEditorProps> = ({ initialAnswers, onChange }) => {
  const experienceDescription =
    'Help us learn more about your experience with cancer so we can make informed matches.';
  const demographicDescription =
    'This information can be taken into account when matching you with the right support.';
  const additionalInfoHelper =
    'Use this space for any extra context you think would be helpful for the reviewer.';

  const normalizedInitialAnswers = useMemo(
    () => normalizeIntakeAnswers(initialAnswers),
    [initialAnswers],
  );

  const [formData, setFormData] = useState<VolunteerFormAnswers>(normalizedInitialAnswers);
  const [baselineData, setBaselineData] = useState<VolunteerFormAnswers>(normalizedInitialAnswers);
  const [commaSeparatedValues, setCommaSeparatedValues] = useState<
    Record<CommaSeparatedFieldKey, string>
  >(() => buildCommaSeparatedDefaults(normalizedInitialAnswers));
  const [selfTreatmentOptions, setSelfTreatmentOptions] = useState<string[]>([]);
  const [selfExperienceOptions, setSelfExperienceOptions] = useState<string[]>([]);
  const [lovedOneTreatmentOptions, setLovedOneTreatmentOptions] = useState<string[]>([]);
  const [lovedOneExperienceOptions, setLovedOneExperienceOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const isCaregiver = formData.caringForSomeone === 'yes';
  const shouldShowCaregiverSection = isCaregiver;
  const shouldShowLovedOneSection = isCaregiver;
  const lovedOneTitle = 'Loved One Information';
  const lovedOneDescription =
    'If you are caring for someone with blood cancer, tell us about them so we can match you with the right support.';
  const caregiverDescription =
    'Only shown if you are supporting someone. Share anything that would help us understand the caregiver experience.';

  useEffect(() => {
    setFormData(normalizedInitialAnswers);
    setBaselineData(normalizedInitialAnswers);
    setCommaSeparatedValues(buildCommaSeparatedDefaults(normalizedInitialAnswers));
  }, [normalizedInitialAnswers]);

  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(baselineData);
    onChange?.(formData, dirty);
  }, [formData, baselineData, onChange]);

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const hasCancer = formData.hasBloodCancer === 'yes';
        const selfTarget =
          hasCancer && isCaregiver
            ? 'both'
            : hasCancer
            ? 'patient'
            : isCaregiver
            ? 'caregiver'
            : 'patient';
        const requests: Promise<{ data: IntakeOptionsResponse }>[] = [
          baseAPIClient.get<IntakeOptionsResponse>(`/intake/options?target=${selfTarget}`),
        ];
        if (isCaregiver) {
          requests.push(baseAPIClient.get<IntakeOptionsResponse>('/intake/options?target=patient'));
        }
        const [selfResponse, lovedOneResponse] = await Promise.all(requests);
        if (!isMounted) return;
        setSelfTreatmentOptions(selfResponse.data.treatments.map((treatment) => treatment.name));
        setSelfExperienceOptions(
          selfResponse.data.experiences.map((experience) => experience.name),
        );
        if (isCaregiver && lovedOneResponse) {
          setLovedOneTreatmentOptions(
            lovedOneResponse.data.treatments.map((treatment) => treatment.name),
          );
          setLovedOneExperienceOptions(
            lovedOneResponse.data.experiences.map((experience) => experience.name),
          );
        } else {
          setLovedOneTreatmentOptions([]);
          setLovedOneExperienceOptions([]);
        }
      } catch {
        if (isMounted) {
          setOptionsError('Unable to load treatment and experience options.');
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    void fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [formData.hasBloodCancer, isCaregiver]);

  const handleExperienceChange = (
    field: 'hasBloodCancer' | 'caringForSomeone' | 'hasCriminalRecord',
    value: string,
  ) => {
    setFormData((prev) => {
      const next: VolunteerFormAnswers = {
        ...prev,
        [field]: value as 'yes' | 'no' | '',
      };
      if (field === 'caringForSomeone') {
        if (value !== 'yes') {
          next.caregiverExperience = { experiences: [] };
          next.caregiverRelationship = '';
          next.lovedOne = cloneDefaultLovedOne();
        } else {
          next.lovedOne = next.lovedOne || cloneDefaultLovedOne();
        }
      }
      return next;
    });
  };

  const handlePersonalChange = (field: keyof IntakeFormData['personalInfo'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const handleDemographicsScalarChange = (field: DemographicScalarField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value,
      },
    }));
  };

  const handleCaregiverRelationshipChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      caregiverRelationship: value,
    }));
  };

  const handlePronounSelectionChange = (values: string[]) => {
    setFormData((prev) => {
      const customValues = prev.demographics.pronouns.filter(
        (val) => !PRONOUNS_OPTIONS.includes(val as (typeof PRONOUNS_OPTIONS)[number]),
      );
      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          pronouns: [...values, ...customValues],
        },
      };
    });
  };

  const handlePronounCustomChange = (value: string) => {
    const parsed = parseCommaSeparated(value);
    setFormData((prev) => {
      const baseValues = prev.demographics.pronouns.filter((val) =>
        PRONOUNS_OPTIONS.includes(val as (typeof PRONOUNS_OPTIONS)[number]),
      );
      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          pronouns: [...baseValues, ...parsed],
        },
      };
    });
  };

  const handleEthnicSelectionChange = (values: string[]) => {
    setFormData((prev) => {
      const customValues = prev.demographics.ethnicGroup.filter(
        (val) => !ETHNIC_GROUP_OPTIONS.includes(val as (typeof ETHNIC_GROUP_OPTIONS)[number]),
      );
      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          ethnicGroup: [...values, ...customValues],
        },
      };
    });
  };

  const handleEthnicCustomChange = (value: string) => {
    const parsed = parseCommaSeparated(value);
    setFormData((prev) => {
      const baseValues = prev.demographics.ethnicGroup.filter((val) =>
        ETHNIC_GROUP_OPTIONS.includes(val as (typeof ETHNIC_GROUP_OPTIONS)[number]),
      );
      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          ethnicGroup: [...baseValues, ...parsed],
        },
      };
    });
  };

  const handleCancerExperienceChange = (field: 'diagnosis' | 'dateOfDiagnosis', value: string) => {
    setFormData((prev) => ({
      ...prev,
      cancerExperience: {
        ...DEFAULT_CANCER_EXPERIENCE,
        ...(prev.cancerExperience || {}),
        [field]: value,
      },
    }));
  };

  const handleCancerSelectionsChange = (field: 'treatments' | 'experiences', values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      cancerExperience: {
        ...prev.cancerExperience,
        [field]: values,
      },
    }));
  };

  const handleCaregiverExperienceChange = (value: string) => {
    setCommaSeparatedValues((prev) => ({
      ...prev,
      caregiverExperiences: value,
    }));
    const parsed = parseCommaSeparated(value);
    setFormData((prev) => ({
      ...prev,
      caregiverExperience: {
        experiences: parsed,
      },
    }));
  };

  const handleLovedOneDemographicsChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lovedOne: {
        ...DEFAULT_LOVED_ONE,
        ...(prev.lovedOne || {}),
        demographics: {
          ...DEFAULT_LOVED_ONE.demographics,
          ...(prev.lovedOne?.demographics || {}),
          [field]: value,
        },
        cancerExperience: {
          ...DEFAULT_LOVED_ONE.cancerExperience,
          ...(prev.lovedOne?.cancerExperience || {}),
        },
      },
    }));
  };

  const handleLovedOneCancerChange = (field: 'diagnosis' | 'dateOfDiagnosis', value: string) => {
    setFormData((prev) => ({
      ...prev,
      lovedOne: {
        ...DEFAULT_LOVED_ONE,
        ...(prev.lovedOne || {}),
        cancerExperience: {
          ...DEFAULT_LOVED_ONE.cancerExperience,
          ...(prev.lovedOne?.cancerExperience || {}),
          [field]: value,
        },
        demographics: {
          ...DEFAULT_LOVED_ONE.demographics,
          ...(prev.lovedOne?.demographics || {}),
        },
      },
    }));
  };

  const handleLovedOneSelectionsChange = (
    field: 'treatments' | 'experiences',
    values: string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      lovedOne: {
        ...prev.lovedOne,
        cancerExperience: {
          ...prev.lovedOne.cancerExperience,
          [field]: values,
        },
      },
    }));
  };

  const pronounBaseValues = useMemo(
    () =>
      formData.demographics.pronouns.filter((value) =>
        PRONOUNS_OPTIONS.includes(value as (typeof PRONOUNS_OPTIONS)[number]),
      ),
    [formData.demographics.pronouns],
  );

  const pronounCustomValue = useMemo(
    () =>
      formData.demographics.pronouns
        .filter((value) => !PRONOUNS_OPTIONS.includes(value as (typeof PRONOUNS_OPTIONS)[number]))
        .join(', '),
    [formData.demographics.pronouns],
  );

  const ethnicBaseValues = useMemo(
    () =>
      formData.demographics.ethnicGroup.filter((value) =>
        ETHNIC_GROUP_OPTIONS.includes(value as (typeof ETHNIC_GROUP_OPTIONS)[number]),
      ),
    [formData.demographics.ethnicGroup],
  );

  const ethnicCustomValue = useMemo(
    () =>
      formData.demographics.ethnicGroup
        .filter(
          (value) => !ETHNIC_GROUP_OPTIONS.includes(value as (typeof ETHNIC_GROUP_OPTIONS)[number]),
        )
        .join(', '),
    [formData.demographics.ethnicGroup],
  );

  const baseSelfTreatmentOptions = useMemo(
    () => uniqueConcat(DEFAULT_TREATMENTS, selfTreatmentOptions),
    [selfTreatmentOptions],
  );
  const baseSelfExperienceOptions = useMemo(
    () => uniqueConcat(DEFAULT_EXPERIENCES, selfExperienceOptions),
    [selfExperienceOptions],
  );
  const baseLovedOneTreatmentOptions = useMemo(
    () => uniqueConcat(DEFAULT_TREATMENTS, lovedOneTreatmentOptions),
    [lovedOneTreatmentOptions],
  );
  const baseLovedOneExperienceOptions = useMemo(
    () => uniqueConcat(DEFAULT_EXPERIENCES, lovedOneExperienceOptions),
    [lovedOneExperienceOptions],
  );

  const mergedSelfTreatmentOptions = useMemo(
    () =>
      mergeOptionsWithSelections(
        baseSelfTreatmentOptions,
        formData.cancerExperience.treatments || [],
      ),
    [baseSelfTreatmentOptions, formData.cancerExperience.treatments],
  );

  const mergedSelfExperienceOptions = useMemo(
    () =>
      mergeOptionsWithSelections(
        baseSelfExperienceOptions,
        formData.cancerExperience.experiences || [],
      ),
    [baseSelfExperienceOptions, formData.cancerExperience.experiences],
  );

  const mergedLovedOneTreatmentOptions = useMemo(
    () =>
      mergeOptionsWithSelections(
        baseLovedOneTreatmentOptions,
        formData.lovedOne.cancerExperience.treatments || [],
      ),
    [baseLovedOneTreatmentOptions, formData.lovedOne.cancerExperience.treatments],
  );

  const mergedLovedOneExperienceOptions = useMemo(
    () =>
      mergeOptionsWithSelections(
        baseLovedOneExperienceOptions,
        formData.lovedOne.cancerExperience.experiences || [],
      ),
    [baseLovedOneExperienceOptions, formData.lovedOne.cancerExperience.experiences],
  );

  return (
    <VStack align="stretch" gap="10" maxW="980px" mx="auto" width="100%">
      <SectionCard title="Experience Type" description={experienceDescription}>
        <VStack align="stretch" gap={8}>
          <HStack gap={10} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <Text
                color={FORM_COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={3}
              >
                Do you have blood cancer?
              </Text>
              <VStack align="stretch" gap={1}>
                <CustomRadio
                  name="hasBloodCancer"
                  value="yes"
                  checked={formData.hasBloodCancer === 'yes'}
                  onChange={(value) => handleExperienceChange('hasBloodCancer', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                    Yes
                  </Text>
                </CustomRadio>
                <CustomRadio
                  name="hasBloodCancer"
                  value="no"
                  checked={formData.hasBloodCancer === 'no'}
                  onChange={(value) => handleExperienceChange('hasBloodCancer', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                    No
                  </Text>
                </CustomRadio>
              </VStack>
            </Box>
            <Box flex="1" minW="260px">
              <Text
                color={FORM_COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={3}
              >
                Are you caring for anyone with blood cancer?
              </Text>
              <VStack align="stretch" gap={1}>
                <CustomRadio
                  name="caringForSomeone"
                  value="yes"
                  checked={formData.caringForSomeone === 'yes'}
                  onChange={(value) => handleExperienceChange('caringForSomeone', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                    Yes
                  </Text>
                </CustomRadio>
                <CustomRadio
                  name="caringForSomeone"
                  value="no"
                  checked={formData.caringForSomeone === 'no'}
                  onChange={(value) => handleExperienceChange('caringForSomeone', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                    No
                  </Text>
                </CustomRadio>
              </VStack>
            </Box>
          </HStack>
          {isCaregiver && (
            <Box>
              <Text
                color={FORM_COLORS.veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={3}
              >
                Who are you caring for?
              </Text>
              <VStack align="stretch" gap={1}>
                {CAREGIVER_RELATIONSHIP_OPTIONS.map((option) => (
                  <CustomRadio
                    key={option}
                    name="caregiverRelationship"
                    value={option}
                    checked={formData.caregiverRelationship === option}
                    onChange={(value) => handleCaregiverRelationshipChange(value)}
                  >
                    <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                      {option}
                    </Text>
                  </CustomRadio>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </SectionCard>

      <SectionCard
        title="Personal Information"
        description="Please provide your contact details and address."
      >
        <VStack align="stretch" gap={6}>
          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="First Name">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="Enter your first name"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Last Name">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="Enter your last name"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Date of Birth">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="YYYY-MM-DD"
                    value={formData.personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalChange('dateOfBirth', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Phone Number">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="###-###-####"
                    value={formData.personalInfo.phoneNumber}
                    onChange={(e) => handlePersonalChange('phoneNumber', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Postal Code">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="ZIP Code"
                    value={formData.personalInfo.postalCode}
                    onChange={(e) => handlePersonalChange('postalCode', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="City">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="City"
                    value={formData.personalInfo.city}
                    onChange={(e) => handlePersonalChange('city', e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Province">
                <SingleSelectDropdown
                  options={[...PROVINCES]}
                  selectedValue={formData.personalInfo.province || ''}
                  onSelectionChange={(value) => handlePersonalChange('province', value)}
                  placeholder="Province"
                />
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Email">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    type="email"
                    placeholder="name@email.com"
                    value={formData.personalInfo.email || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          email: e.target.value,
                        },
                      }))
                    }
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <Box>
            <Text
              color={FORM_COLORS.veniceBlue}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={3}
            >
              Do you have a criminal record?
            </Text>
            <HStack gap={6} flexWrap="wrap">
              <CustomRadio
                name="hasCriminalRecord"
                value="yes"
                checked={formData.hasCriminalRecord === 'yes'}
                onChange={(value) => handleExperienceChange('hasCriminalRecord', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                  Yes
                </Text>
              </CustomRadio>
              <CustomRadio
                name="hasCriminalRecord"
                value="no"
                checked={formData.hasCriminalRecord === 'no'}
                onChange={(value) => handleExperienceChange('hasCriminalRecord', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px">
                  No
                </Text>
              </CustomRadio>
            </HStack>
          </Box>
        </VStack>
      </SectionCard>

      <SectionCard title="Your Demographic Information" description={demographicDescription}>
        <VStack align="stretch" gap={6}>
          <HStack gap={6} flexWrap="wrap">
            <GenderIdentityField
              value={formData.demographics.genderIdentity}
              onChange={(value) => handleDemographicsScalarChange('genderIdentity', value)}
            />
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Pronouns">
                <MultiSelectDropdown
                  options={[...PRONOUNS_OPTIONS]}
                  selectedValues={pronounBaseValues}
                  onSelectionChange={handlePronounSelectionChange}
                  placeholder="Select pronouns"
                />
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Custom pronouns (comma separated)">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="Add any custom pronouns"
                    value={pronounCustomValue}
                    onChange={(e) => handlePronounCustomChange(e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Ethnic or Cultural Group">
                <MultiSelectDropdown
                  options={[...ETHNIC_GROUP_OPTIONS]}
                  selectedValues={ethnicBaseValues}
                  onSelectionChange={handleEthnicSelectionChange}
                  placeholder="Select groups"
                />
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Custom groups (comma separated)">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="Add any custom groups"
                    value={ethnicCustomValue}
                    onChange={(e) => handleEthnicCustomChange(e.target.value)}
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Preferred Language">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="Preferred language"
                    value={formData.demographics.preferredLanguage || ''}
                    onChange={(e) =>
                      handleDemographicsScalarChange('preferredLanguage', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Timezone">
                <SingleSelectDropdown
                  options={[...TIMEZONE_OPTIONS]}
                  selectedValue={formData.demographics.timezone || ''}
                  onSelectionChange={(value) => handleDemographicsScalarChange('timezone', value)}
                  placeholder="Timezone"
                />
              </FormField>
            </Box>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Marital Status">
                <SingleSelectDropdown
                  options={[...MARITAL_STATUS_OPTIONS]}
                  selectedValue={formData.demographics.maritalStatus}
                  onSelectionChange={(value) =>
                    handleDemographicsScalarChange('maritalStatus', value)
                  }
                  placeholder="Marital status"
                />
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Do you have kids?">
                <SingleSelectDropdown
                  options={[...HAS_KIDS_OPTIONS]}
                  selectedValue={formData.demographics.hasKids}
                  onSelectionChange={(value) => handleDemographicsScalarChange('hasKids', value)}
                  placeholder="Select an option"
                />
              </FormField>
            </Box>
          </HStack>
        </VStack>
      </SectionCard>

      <SectionCard
        title="Your Cancer Experience"
        description="This information can also be taken into account when matching you with a service user."
      >
        <VStack align="stretch" gap={6}>
          {optionsError && (
            <Text color="red.500" fontSize="12px">
              {optionsError}
            </Text>
          )}
          <HStack gap={6} flexWrap="wrap">
            <Box flex="1" minW="260px">
              <FormField label="Diagnosis">
                <SingleSelectDropdown
                  options={[...DIAGNOSIS_OPTIONS]}
                  selectedValue={formData.cancerExperience.diagnosis || ''}
                  allowClear={false}
                  onSelectionChange={(value) => handleCancerExperienceChange('diagnosis', value)}
                  placeholder="Select diagnosis"
                />
              </FormField>
            </Box>
            <Box flex="1" minW="260px">
              <FormField label="Date of Diagnosis">
                <InputGroup>
                  <Input
                    {...INPUT_STYLES}
                    placeholder="YYYY-MM-DD"
                    value={formData.cancerExperience.dateOfDiagnosis || ''}
                    onChange={(e) =>
                      handleCancerExperienceChange('dateOfDiagnosis', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
            </Box>
          </HStack>

          {optionsLoading ? (
            <HStack gap={3}>
              <Spinner size="sm" />
              <Text color={FORM_COLORS.fieldGray} fontSize="13px">
                Loading treatment and experience options...
              </Text>
            </HStack>
          ) : (
            <HStack gap={6} flexWrap="wrap">
              <Box flex="1" minW="260px">
                <Text
                  color={FORM_COLORS.veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={2}
                >
                  Which treatments have you done?
                </Text>
                <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={4}>
                  You can select a maximum of 2.
                </Text>
                {mergedSelfTreatmentOptions.length ? (
                  <CheckboxGroup
                    options={mergedSelfTreatmentOptions}
                    selectedValues={formData.cancerExperience.treatments || []}
                    onValueChange={(values) => handleCancerSelectionsChange('treatments', values)}
                    maxSelections={2}
                  />
                ) : (
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px">
                    No treatment options available.
                  </Text>
                )}
              </Box>
              <Box flex="1" minW="260px">
                <Text
                  color={FORM_COLORS.veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={2}
                >
                  Which experiences do you have?
                </Text>
                <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={4}>
                  You can select a maximum of 5.
                </Text>
                {mergedSelfExperienceOptions.length ? (
                  <CheckboxGroup
                    options={mergedSelfExperienceOptions}
                    selectedValues={formData.cancerExperience.experiences || []}
                    onValueChange={(values) => handleCancerSelectionsChange('experiences', values)}
                    maxSelections={5}
                  />
                ) : (
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px">
                    No experience options available.
                  </Text>
                )}
              </Box>
            </HStack>
          )}
        </VStack>
      </SectionCard>

      {shouldShowCaregiverSection && (
        <SectionCard title="Caregiver Experience" description={caregiverDescription}>
          <FormField label="Experiences (comma separated)">
            <Textarea
              {...TEXTAREA_STYLES}
              minH="100px"
              placeholder="Share the experiences you've had while caring for someone"
              value={commaSeparatedValues.caregiverExperiences}
              onChange={(e) => handleCaregiverExperienceChange(e.target.value)}
            />
          </FormField>
        </SectionCard>
      )}

      {shouldShowLovedOneSection && (
        <SectionCard title={lovedOneTitle} description={lovedOneDescription}>
          <VStack align="stretch" gap={6}>
            {optionsError && (
              <Text color="red.500" fontSize="12px">
                {optionsError}
              </Text>
            )}
            <HStack gap={6} flexWrap="wrap">
              <GenderIdentityField
                value={formData.lovedOne.demographics.genderIdentity}
                onChange={(value) => handleLovedOneDemographicsChange('genderIdentity', value)}
              />
              <Box flex="1" minW="260px">
                <FormField label="Age">
                  <InputGroup>
                    <Input
                      {...INPUT_STYLES}
                      placeholder="Age"
                      value={formData.lovedOne.demographics.age || ''}
                      onChange={(e) => handleLovedOneDemographicsChange('age', e.target.value)}
                    />
                  </InputGroup>
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6} flexWrap="wrap">
              <Box flex="1" minW="260px">
                <FormField label="Diagnosis">
                  <SingleSelectDropdown
                    options={[...DIAGNOSIS_OPTIONS]}
                    selectedValue={formData.lovedOne.cancerExperience.diagnosis || ''}
                    allowClear={false}
                    onSelectionChange={(value) => handleLovedOneCancerChange('diagnosis', value)}
                    placeholder="Select diagnosis"
                  />
                </FormField>
              </Box>
              <Box flex="1" minW="260px">
                <FormField label="Date of Diagnosis">
                  <InputGroup>
                    <Input
                      {...INPUT_STYLES}
                      placeholder="YYYY-MM-DD"
                      value={formData.lovedOne.cancerExperience.dateOfDiagnosis || ''}
                      onChange={(e) =>
                        handleLovedOneCancerChange('dateOfDiagnosis', e.target.value)
                      }
                    />
                  </InputGroup>
                </FormField>
              </Box>
            </HStack>

            <HStack gap={6} flexWrap="wrap">
              <Box flex="1" minW="260px">
                <Text
                  color={FORM_COLORS.veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={2}
                >
                  Which treatments has your loved one done?
                </Text>
                <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={4}>
                  You can select a maximum of 2.
                </Text>
                {optionsLoading ? (
                  <HStack gap={2}>
                    <Spinner size="sm" />
                    <Text color={FORM_COLORS.fieldGray} fontSize="13px">
                      Loading treatment options...
                    </Text>
                  </HStack>
                ) : mergedLovedOneTreatmentOptions.length ? (
                  <CheckboxGroup
                    options={mergedLovedOneTreatmentOptions}
                    selectedValues={formData.lovedOne.cancerExperience.treatments || []}
                    onValueChange={(values) => handleLovedOneSelectionsChange('treatments', values)}
                    maxSelections={2}
                  />
                ) : (
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px">
                    No treatment options available.
                  </Text>
                )}
              </Box>
              <Box flex="1" minW="260px">
                <Text
                  color={FORM_COLORS.veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={2}
                >
                  Which experiences do they have?
                </Text>
                <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={4}>
                  You can select a maximum of 5.
                </Text>
                {optionsLoading ? (
                  <HStack gap={2}>
                    <Spinner size="sm" />
                    <Text color={FORM_COLORS.fieldGray} fontSize="13px">
                      Loading experience options...
                    </Text>
                  </HStack>
                ) : mergedLovedOneExperienceOptions.length ? (
                  <CheckboxGroup
                    options={mergedLovedOneExperienceOptions}
                    selectedValues={formData.lovedOne.cancerExperience.experiences || []}
                    onValueChange={(values) =>
                      handleLovedOneSelectionsChange('experiences', values)
                    }
                    maxSelections={5}
                  />
                ) : (
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px">
                    No experience options available.
                  </Text>
                )}
              </Box>
            </HStack>
          </VStack>
        </SectionCard>
      )}

      <SectionCard
        title="Additional Information"
        description="Is there anything else you'd like to share with us?"
      >
        <VStack align="stretch" gap={4}>
          <Text
            color={FORM_COLORS.fieldGray}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
          >
            {additionalInfoHelper}
          </Text>
          <FormField label="Additional information (optional)">
            <Textarea
              {...TEXTAREA_STYLES}
              minH="180px"
              placeholder="Please share any additional information that might be helpful..."
              value={formData.additionalInfo || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalInfo: e.target.value,
                }))
              }
            />
          </FormField>
        </VStack>
      </SectionCard>

      <SectionCard title="Admin Notes">
        <FormField label="Internal comments">
          <Textarea
            {...TEXTAREA_STYLES}
            minH="140px"
            placeholder="Admin-only notes about this submission"
            value={formData.volunteerAdditionalComments || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                volunteerAdditionalComments: e.target.value,
              }))
            }
          />
        </FormField>
      </SectionCard>

      <SectionCard title="Form Status">
        <SelectField
          value={formData.status || 'pending-approval'}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          style={{ maxWidth: '320px' }}
        >
          <option value="pending-approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </SelectField>
      </SectionCard>
    </VStack>
  );
};

export default IntakeFormEditor;
