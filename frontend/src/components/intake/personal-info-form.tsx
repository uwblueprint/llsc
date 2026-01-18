import React from 'react';
import { Box, Heading, Button, VStack, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '@chakra-ui/react';
import { InputGroup } from '@/components/ui/input-group';
import { FormField } from '@/components/ui/form-field';
import { ExperienceTypeSection } from '@/components/intake/experience-type-section';
import { ResponsiveFieldGroup } from '@/components/layout';
import { StepIndicator } from '@/components/ui';
import {
  PROVINCES,
  VALIDATION,
  ExperienceData,
  PersonalData,
  getIntakeFormTitle,
  IntakeFormType,
} from '@/constants/form';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';

// Province keys (English) - these are stored in database
const PROVINCE_KEYS = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
] as const;

interface PersonalInfoFormData {
  hasBloodCancer: 'yes' | 'no' | '';
  caringForSomeone: 'yes' | 'no' | '';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  postalCode: string;
  city: string;
  province: string;
  eligibilityCriteria: {
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
}

interface PersonalInfoFormProps {
  formType: IntakeFormType;
  onSubmit: (experienceData: ExperienceData, personalData: PersonalData) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

export function PersonalInfoForm({
  formType,
  onSubmit,
  onDropdownOpenChange,
}: PersonalInfoFormProps) {
  const t = useTranslations('intake');
  const tOptions = useTranslations('options');

  // Helper to translate option keys
  const translateOption = (category: string, key: string): string => {
    try {
      return tOptions(`${category}.${key}`);
    } catch {
      return key;
    }
  };

  // Create translated province options for display
  const provinceOptions = PROVINCE_KEYS.map((key) => translateOption('provinces', key));

  // Helpers to convert between display values and keys
  const displayToKey = (options: string[], keys: readonly string[], display: string): string => {
    const index = options.indexOf(display);
    return index >= 0 ? keys[index] : display;
  };

  const keyToDisplay = (options: string[], keys: readonly string[], key: string): string => {
    const index = keys.indexOf(key);
    return index >= 0 ? options[index] : key;
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfoFormData>({
    defaultValues: {
      hasBloodCancer: '',
      caringForSomeone: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phoneNumber: '',
      postalCode: '',
      city: '',
      province: '',
      eligibilityCriteria: {
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
    },
  });

  const isVolunteerFlow = formType === 'volunteer' || formType === 'become_volunteer';

  const onFormSubmit = (data: PersonalInfoFormData) => {
    // Validate required experience fields
    if (!data.hasBloodCancer || !data.caringForSomeone) {
      return; // Form validation will show errors
    }

    // Validate all eligibility criteria are checked (only for volunteers)
    if (isVolunteerFlow) {
      const allChecked = Object.values(data.eligibilityCriteria).every(
        (checked) => checked === true,
      );
      if (!allChecked) {
        return; // Form validation will show errors
      }
    }

    const experienceData: ExperienceData = {
      hasBloodCancer: data.hasBloodCancer as 'yes' | 'no',
      caringForSomeone: data.caringForSomeone as 'yes' | 'no',
    };

    const personalData: PersonalData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      phoneNumber: data.phoneNumber,
      postalCode: data.postalCode,
      city: data.city,
      province: data.province,
    };

    onSubmit(experienceData, personalData);
  };

  const formTitle =
    formType === 'volunteer' || formType === 'become_volunteer'
      ? t('volunteerForm')
      : t('serviceUserForm');

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
      <StepIndicator currentStep={1} />

      {/* Experience Type Section */}
      <ExperienceTypeSection control={control} errors={errors} />

      {/* Personal Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('personalInformation')}
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={8}
        >
          {t('personalInfoDescription')}
        </Text>

        <VStack gap={5} align="stretch">
          {/* Name Fields */}
          <ResponsiveFieldGroup>
            <FormField label={t('firstName')} error={errors.firstName?.message}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: t('validation.firstNameRequired') }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.enterFirstName')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.firstName ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{
                        borderColor: 'brand.primary',
                        boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                      }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>

            <FormField label={t('lastName')} error={errors.lastName?.message}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: t('validation.lastNameRequired') }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.enterLastName')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.lastName ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{
                        borderColor: 'brand.primary',
                        boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                      }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>

          {/* Date of Birth and Phone Number */}
          <ResponsiveFieldGroup>
            <FormField label={t('dateOfBirth')} error={errors.dateOfBirth?.message}>
              <Controller
                name="dateOfBirth"
                control={control}
                rules={{ required: t('validation.dateOfBirthRequired') }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.dateFormat')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.dateOfBirth ? 'red.500' : undefined}
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

            <FormField label={t('phoneNumber')} error={errors.phoneNumber?.message}>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: t('validation.phoneNumberRequired'),
                  pattern: {
                    value: VALIDATION.PHONE,
                    message: t('validation.invalidPhoneNumber'),
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.phoneFormat')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.phoneNumber ? 'red.500' : undefined}
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

          {/* Postal Code and City */}
          <ResponsiveFieldGroup>
            <FormField label={t('postalCode')} error={errors.postalCode?.message}>
              <Controller
                name="postalCode"
                control={control}
                rules={{
                  required: t('validation.postalCodeRequired'),
                  pattern: {
                    value: VALIDATION.POSTAL_CODE,
                    message: t('validation.invalidPostalCode'),
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.postalCode')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.postalCode ? 'red.500' : undefined}
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

            <FormField label={t('city')} error={errors.city?.message}>
              <Controller
                name="city"
                control={control}
                rules={{ required: t('validation.cityRequired') }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder={t('placeholders.city')}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color="brand.navy"
                      borderColor={errors.city ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{
                        borderColor: 'brand.primary',
                        boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                      }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </ResponsiveFieldGroup>

          {/* Province */}
          <FormField label={t('province')} error={errors.province?.message}>
            <Controller
              name="province"
              control={control}
              rules={{ required: t('validation.provinceRequired') }}
              render={({ field }) => (
                <SingleSelectDropdown
                  options={provinceOptions}
                  selectedValue={keyToDisplay(provinceOptions, PROVINCE_KEYS, field.value || '')}
                  onSelectionChange={(display) =>
                    field.onChange(displayToKey(provinceOptions, PROVINCE_KEYS, display))
                  }
                  placeholder={t('placeholders.selectProvince')}
                  error={!!errors.province}
                  onOpenChange={onDropdownOpenChange}
                />
              )}
            />
          </FormField>
        </VStack>
      </Box>

      {/* Eligibility Criteria Section */}
      {isVolunteerFlow && (
        <Box mb={10}>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color="brand.navy"
            fontSize="20px"
            mb={3}
          >
            {t('eligibilityCriteria')}
          </Heading>
          <Text
            color="brand.fieldText"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
            mb={6}
          >
            {t('eligibilityIntro')}
          </Text>
          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color="brand.navy"
            mb={3}
            fontWeight={600}
          >
            {t('eligibilityDescription')}
          </Text>
          <Controller
            name="eligibilityCriteria"
            control={control}
            rules={{
              validate: (value) => {
                if (isVolunteerFlow) {
                  const allChecked = Object.values(value).every((checked) => checked === true);
                  return allChecked || t('validation.allEligibilityRequired');
                }
                return true;
              },
            }}
            render={({ field }) => (
              <VStack align="start" gap={3}>
                <Checkbox
                  checked={field.value.age18OrOlder}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, age18OrOlder: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.18OrOlder')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.noCriminalRecord}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, noCriminalRecord: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.noCriminalRecord')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.resideInCanada}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, resideInCanada: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.resideInCanada')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.oneYearSinceTreatment}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, oneYearSinceTreatment: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.oneYearSinceTreatment')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.hasBloodCancerOrCaregiver}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, hasBloodCancerOrCaregiver: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.hadBloodCancer')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.willingToParticipateIntake}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, willingToParticipateIntake: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.willingToPrescreen')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.willingToAttendTraining}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, willingToAttendTraining: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.willingToTraining')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.accessToPhoneAndComputer}
                  onCheckedChange={(details) =>
                    field.onChange({ ...field.value, accessToPhoneAndComputer: details.checked })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.haveAccessToPhone')}
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={field.value.comfortableSharingExperience}
                  onCheckedChange={(details) =>
                    field.onChange({
                      ...field.value,
                      comfortableSharingExperience: details.checked,
                    })
                  }
                >
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color="brand.navy"
                  >
                    {t('eligibility.comfortableSharingExperience')}
                  </Text>
                </Checkbox>
                {errors.eligibilityCriteria && (
                  <Text color="red.500" fontSize="12px" mt={1}>
                    {errors.eligibilityCriteria.message}
                  </Text>
                )}
              </VStack>
            )}
          />
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
