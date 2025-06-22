import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '@chakra-ui/react';
import { InputGroup } from '@/components/ui/input-group';
import { FormField } from '@/components/ui/form-field';
import { ExperienceTypeSection } from '@/components/intake/experience-type-section';
import { COLORS, PROVINCES, VALIDATION, ExperienceData, PersonalData } from '@/constants/form';

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
}

interface PersonalInfoFormProps {
  formType: 'participant' | 'volunteer';
  onSubmit: (experienceData: ExperienceData, personalData: PersonalData) => void;
}

export function PersonalInfoForm({
  formType,
  onSubmit,
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
    },
  });

  const onFormSubmit = (data: PersonalInfoFormData) => {
    // Validate required experience fields
    if (!data.hasBloodCancer || !data.caringForSomeone) {
      return; // Form validation will show errors
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

  const formTitle = formType === 'participant' 
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
                      borderColor={errors.firstName ? 'red.500' : '#d1d5db'}
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
                      borderColor={errors.lastName ? 'red.500' : '#d1d5db'}
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
                      borderColor={errors.dateOfBirth ? 'red.500' : '#d1d5db'}
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
                      borderColor={errors.phoneNumber ? 'red.500' : '#d1d5db'}
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
                      borderColor={errors.postalCode ? 'red.500' : '#d1d5db'}
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
                      borderColor={errors.city ? 'red.500' : '#d1d5db'}
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
                  <InputGroup>
                    <Input
                      {...field}
                      placeholder="Province"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                      borderColor={errors.province ? 'red.500' : '#d1d5db'}
                      borderRadius="6px"
                      h="40px"
                      _placeholder={{ color: '#9ca3af' }}
                      _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
                      list="provinces"
                    />
                  </InputGroup>
                )}
              />
              <datalist id="provinces">
                {PROVINCES.map((province) => (
                  <option key={province} value={province} />
                ))}
              </datalist>
            </FormField>
            <Box flex="1" /> {/* Empty box to maintain two-column layout */}
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
