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

  const formTitle = getIntakeFormTitle(formType);

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
          Personal Information
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={8}
        >
          Please provide your contact details and address.
        </Text>

        <VStack gap={5} align="stretch">
          {/* Name Fields */}
          <ResponsiveFieldGroup>
            <FormField label="First Name" error={errors.firstName?.message}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="Enter your first name"
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

            <FormField label="Last Name" error={errors.lastName?.message}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="Enter your last name"
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
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
              <Controller
                name="dateOfBirth"
                control={control}
                rules={{ required: 'Date of birth is required' }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="DD/MM/YYYY"
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

            <FormField label="Phone Number" error={errors.phoneNumber?.message}>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: 'Phone number is required',
                  pattern: {
                    value: VALIDATION.PHONE,
                    message: 'Please enter a valid phone number',
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="###-###-####"
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
            <FormField label="Postal Code" error={errors.postalCode?.message}>
              <Controller
                name="postalCode"
                control={control}
                rules={{
                  required: 'Postal code is required',
                  pattern: {
                    value: VALIDATION.POSTAL_CODE,
                    message: 'Please enter a valid postal code',
                  },
                }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="ZIP Code"
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

            <FormField label="City" error={errors.city?.message}>
              <Controller
                name="city"
                control={control}
                rules={{ required: 'City is required' }}
                render={({ field }) => (
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="City"
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
          <FormField label="Province" error={errors.province?.message}>
            <Controller
              name="province"
              control={control}
              rules={{ required: 'Province is required' }}
              render={({ field }) => (
                <SingleSelectDropdown
                  options={[...PROVINCES]}
                  selectedValue={field.value || ''}
                  onSelectionChange={field.onChange}
                  placeholder="Province"
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
            Eligibility Criteria
          </Heading>
          <Text
            color="brand.fieldText"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
            mb={6}
          >
            Our volunteers are a valuable part of our organization and vital to this program. Before
            continuing, please ensure you meet the criteria below.{' '}
          </Text>
          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color="brand.navy"
            mb={3}
            fontWeight={600}
          >
            Please review the criteria and check off all that apply. You must agree with all
            statements to become a First Connections volunteer.
          </Text>
          <Controller
            name="eligibilityCriteria"
            control={control}
            rules={{
              validate: (value) => {
                if (isVolunteerFlow) {
                  const allChecked = Object.values(value).every((checked) => checked === true);
                  return allChecked || 'All eligibility criteria must be checked to continue';
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
                    18 years of age or older
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
                    No criminal record
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
                    Reside in Canada
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
                    It has been at least 1 year since yours or your loved one&apos;s blood cancer
                    treatment. For people and their caregivers who are on active surveillance or
                    daily medication, it has been at least 1 year since diagnosis.
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
                    Have had a blood cancer, or is a caregiver of a loved one with a blood cancer
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
                    Willing to participate in a pre-screening intake
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
                    Willing to attend a virtual 3-hour peer support training
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
                    Have access and comfortable using the phone and computer
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
                    Comfortable sharing your personal blood cancer experience with others
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
