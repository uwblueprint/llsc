import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '@chakra-ui/react';
import { InputGroup } from '@/components/ui/input-group';
import { FormField } from '@/components/ui/form-field';
import { ExperienceTypeSection } from '@/components/intake/experience-type-section';
import { COLORS, PROVINCES, VALIDATION, ExperienceData, PersonalData } from '@/constants/form';
// import { CustomRadio } from '@/components/CustomRadio';
import { useRouter } from 'next/router';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { Checkbox } from '@/components/ui/checkbox';

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
  formType: 'participant' | 'volunteer';
  onSubmit: (experienceData: ExperienceData, personalData: PersonalData) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

export function PersonalInfoForm({
  formType,
  onSubmit,
  onDropdownOpenChange,
}: PersonalInfoFormProps) {
  const router = useRouter();
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

  const onFormSubmit = (data: PersonalInfoFormData) => {
    // Validate required experience fields
    if (!data.hasBloodCancer || !data.caringForSomeone) {
      return; // Form validation will show errors
    }

    // Validate all eligibility criteria are checked (only for volunteers)
    if (formType === 'volunteer') {
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
    formType === 'participant'
      ? 'First Connection Participant Form'
      : 'First Connection Volunteer Form';

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
        {formTitle}
      </Heading>

      {/* Progress Bar */}
      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* Experience Type Section */}
      <ExperienceTypeSection control={control} errors={errors} />

      {/* Personal Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Personal Information
        </Heading>
        <Text
          color={COLORS.fieldGray}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={8}
        >
          Please provide your contact details and address.
        </Text>

        <VStack gap={5}>
          {/* Name Fields */}
          <HStack gap={4} w="full">
            <FormField label="First Name" error={errors.firstName?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.firstName ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>

            <FormField label="Last Name" error={errors.lastName?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.lastName ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </HStack>

          {/* Date of Birth and Phone Number */}
          <HStack gap={4} w="full">
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.dateOfBirth ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </InputGroup>
                )}
              />
            </FormField>

            <FormField label="Phone Number" error={errors.phoneNumber?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.phoneNumber ? 'red.500' : undefined}
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

          {/* Postal Code and City */}
          <HStack gap={4} w="full">
            <FormField label="Postal Code" error={errors.postalCode?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.postalCode ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                    />
                  </InputGroup>
                )}
              />
            </FormField>

            <FormField label="City" error={errors.city?.message} flex="1">
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
                      color={COLORS.veniceBlue}
                      borderColor={errors.city ? 'red.500' : undefined}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                    />
                  </InputGroup>
                )}
              />
            </FormField>
          </HStack>

          {/* Province */}
          <HStack gap={4} w="full">
            <FormField label="Province" error={errors.province?.message} flex="1">
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
            <Box flex="1" /> {/* Empty box to maintain two-column layout */}
          </HStack>
        </VStack>
      </Box>

      {/* Eligibility Criteria Section */}
      {formType === 'volunteer' && (
        <Box mb={10}>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Eligibility Criteria
          </Heading>
          <Text
            color={COLORS.fieldGray}
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
            color={COLORS.veniceBlue}
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
                if (formType === 'volunteer') {
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
                    color={COLORS.veniceBlue}
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
