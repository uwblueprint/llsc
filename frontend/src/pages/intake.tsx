import React from 'react';
import { Box, Flex, Heading, Text, Button, Input, VStack, HStack } from '@chakra-ui/react';
import { useForm, Controller, FieldValues } from 'react-hook-form';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { CustomRadio } from '@/components/CustomRadio';

const veniceBlue = '#1d3448';
const fieldGray = '#6b7280';
const teal = '#0d7377';
const lightTeal = '#e6f7f7';
const lightGray = '#f3f4f6';
const progressTeal = '#5eead4';
const progressGray = '#d1d5db';

// Canadian provinces
const PROVINCES = [
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
  'Yukon'
];

// Validation patterns
const PHONE_REGEX = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

interface FormData extends FieldValues {
  hasBloodCancer: string;
  caringForSomeone: string;
  caringFor: string;
  otherCaringFor: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  postalCode: string;
  city: string;
  province: string;
}

export default function IntakePage() {
  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      hasBloodCancer: 'no',
      caringForSomeone: 'yes',
      caringFor: 'spouse',
      otherCaringFor: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phoneNumber: '',
      postalCode: '',
      city: '',
      province: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // TODO: Add API call to submit form data
      console.log('Form data:', data);
      // Show success message
      alert('Form submitted successfully');
    } catch (err) {
      console.error('Error submitting form:', err);
      // Show error message
      alert('Error submitting form. Please try again later.');
    }
  };

  // Watch caringForSomeone to conditionally show caringFor field
  const caringForSomeone = watch('caringForSomeone');

  return (
    <Flex minH="100vh" bg={lightGray} justify="center" py={12}>
      <Box
        w="full"
        maxW="840px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={10}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize="28px"
            mb={8}
          >
            First Connection Participant Form
          </Heading>

          {/* Progress Bar */}
          <Box mb={10}>
            <HStack gap={3}>
              <Box flex="1">
                <Box h="3px" bg={teal} borderRadius="full" />
              </Box>
              <Box flex="1">
                <Box h="3px" bg={progressGray} borderRadius="full" />
              </Box>
              <Box flex="1">
                <Box h="3px" bg={progressGray} borderRadius="full" />
              </Box>
            </HStack>
          </Box>

          {/* Experience Type Section */}
          <Box mb={12}>
            <Heading
              as="h2"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              color={veniceBlue}
              fontSize="20px"
              mb={3}
            >
              Experience Type
            </Heading>
            <Text color={fieldGray} fontFamily="system-ui, -apple-system, sans-serif" fontSize="15px" mb={8}>
              Help us learn more about your experience with cancer.
            </Text>

            <VStack align="start" gap={8}>
              {/* Blood Cancer and Caring Questions - Side by Side */}
              <HStack align="start" gap={12} w="full">
                {/* Blood Cancer Question */}
                <Box flex="1">
                  <Text
                    color={veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={4}
                  >
                    Do you have blood cancer?
                  </Text>
                  <Controller
                    name="hasBloodCancer"
                    control={control}
                    rules={{ required: 'This field is required' }}
                    render={({ field }) => (
                      <VStack align="start" gap={1}>
                        <CustomRadio
                          name="hasBloodCancer"
                          value="yes"
                          checked={field.value === 'yes'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            Yes
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="hasBloodCancer"
                          value="no"
                          checked={field.value === 'no'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            No
                          </Text>
                        </CustomRadio>
                        {errors.hasBloodCancer && (
                          <Text color="red.500" fontSize="12px" mt={1}>
                            {errors.hasBloodCancer.message}
                          </Text>
                        )}
                      </VStack>
                    )}
                  />
                </Box>

                {/* Caring for Someone Question */}
                <Box flex="1">
                  <Text
                    color={veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={4}
                  >
                    Are you caring for anyone with blood cancer?
                  </Text>
                  <Controller
                    name="caringForSomeone"
                    control={control}
                    rules={{ required: 'This field is required' }}
                    render={({ field }) => (
                      <VStack align="start" gap={1}>
                        <CustomRadio
                          name="caringForSomeone"
                          value="yes"
                          checked={field.value === 'yes'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            Yes
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringForSomeone"
                          value="no"
                          checked={field.value === 'no'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            No
                          </Text>
                        </CustomRadio>
                        {errors.caringForSomeone && (
                          <Text color="red.500" fontSize="12px" mt={1}>
                            {errors.caringForSomeone.message}
                          </Text>
                        )}
                      </VStack>
                    )}
                  />
                </Box>
              </HStack>

              {/* Who are you caring for - Only show if caringForSomeone is 'yes' */}
              {caringForSomeone === 'yes' && (
                <Box w="full">
                  <Text
                    color={veniceBlue}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={500}
                    fontSize="14px"
                    mb={4}
                  >
                    Who are you caring for?
                  </Text>
                  <Controller
                    name="caringFor"
                    control={control}
                    rules={{ required: 'This field is required' }}
                    render={({ field }) => (
                      <VStack align="start" gap={1}>
                        <CustomRadio
                          name="caringFor"
                          value="parent"
                          checked={field.value === 'parent'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            A parent
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringFor"
                          value="sibling"
                          checked={field.value === 'sibling'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            A sibling
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringFor"
                          value="child"
                          checked={field.value === 'child'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            A child
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringFor"
                          value="spouse"
                          checked={field.value === 'spouse'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            A spouse
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringFor"
                          value="friend"
                          checked={field.value === 'friend'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                            A friend
                          </Text>
                        </CustomRadio>
                        <CustomRadio
                          name="caringFor"
                          value="other"
                          checked={field.value === 'other'}
                          onChange={(value) => field.onChange(value)}
                        >
                          <HStack align="center" gap={2}>
                            <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                              Other:
                            </Text>
                            {field.value === 'other' && (
                              <Box w="280px">
                                <Controller
                                  name="otherCaringFor"
                                  control={control}
                                  rules={{ 
                                    required: 'Please specify who you are caring for',
                                    validate: value => value.trimStart().trimEnd() !== '' || 'Please specify who you are caring for'
                                  }}
                                  render={({ field }) => (
                                    <InputGroup>
                                      <Input
                                        {...field}
                                        onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                                        placeholder="Please specify"
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                        fontSize="14px"
                                        color={veniceBlue}
                                        borderColor={errors.otherCaringFor ? 'red.500' : '#d1d5db'}
                                        borderRadius="6px"
                                        h="36px"
                                        _placeholder={{ color: '#9ca3af' }}
                                        _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                                      />
                                    </InputGroup>
                                  )}
                                />
                                {errors.otherCaringFor && (
                                  <Text color="red.500" fontSize="12px" mt={1}>
                                    {errors.otherCaringFor.message}
                                  </Text>
                                )}
                              </Box>
                            )}
                          </HStack>
                        </CustomRadio>
                        {errors.caringFor && (
                          <Text color="red.500" fontSize="12px" mt={1}>
                            {errors.caringFor.message}
                          </Text>
                        )}
                      </VStack>
                    )}
                  />
                </Box>
              )}
            </VStack>
          </Box>

          {/* Personal Information Section */}
          <Box mb={10}>
            <Heading
              as="h2"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              color={veniceBlue}
              fontSize="20px"
              mb={3}
            >
              Personal Information
            </Heading>
            <Text color={fieldGray} fontFamily="system-ui, -apple-system, sans-serif" fontSize="15px" mb={8}>
              Please provide your contact details and address.
            </Text>

            <VStack gap={5}>
              {/* Name Fields */}
              <HStack gap={4} w="full">
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      First Name
                    </Text>
                  }
                  flex="1"
                  errorText={errors.firstName?.message}
                >
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ 
                      required: 'First name is required',
                      validate: value => value.trimStart().trimEnd() !== '' || 'First name is required'
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                          placeholder="John"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.firstName ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      Last Name
                    </Text>
                  }
                  flex="1"
                  errorText={errors.lastName?.message}
                >
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ 
                      required: 'Last name is required',
                      validate: value => value.trimStart().trimEnd() !== '' || 'Last name is required'
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                          placeholder="Doe"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.lastName ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
              </HStack>

              {/* Date of Birth and Phone */}
              <HStack gap={4} w="full">
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      Date of Birth
                    </Text>
                  }
                  flex="1"
                  errorText={errors.dateOfBirth?.message}
                >
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    rules={{
                      required: 'Date of birth is required',
                      pattern: {
                        value: DATE_REGEX,
                        message: 'Please use DD/MM/YYYY format'
                      }
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="DD/MM/YYYY"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.dateOfBirth ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      Phone Number
                    </Text>
                  }
                  flex="1"
                  errorText={errors.phoneNumber?.message}
                >
                  <Controller
                    name="phoneNumber"
                    control={control}
                    rules={{
                      required: 'Phone number is required',
                      pattern: {
                        value: PHONE_REGEX,
                        message: 'Please enter a valid phone number'
                      }
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="###-###-####"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.phoneNumber ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
              </HStack>

              {/* Postal Code and City */}
              <HStack gap={4} w="full">
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      Postal Code
                    </Text>
                  }
                  flex="1"
                  errorText={errors.postalCode?.message}
                >
                  <Controller
                    name="postalCode"
                    control={control}
                    rules={{
                      required: 'Postal code is required',
                      pattern: {
                        value: POSTAL_CODE_REGEX,
                        message: 'Please enter a valid Canadian postal code'
                      }
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          placeholder="A1A 1A1"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.postalCode ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
                <Field
                  label={
                    <Text
                      color={veniceBlue}
                      fontWeight={500}
                      fontSize="14px"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      mb={1}
                    >
                      City
                    </Text>
                  }
                  flex="1"
                  errorText={errors.city?.message}
                >
                  <Controller
                    name="city"
                    control={control}
                    rules={{ 
                      required: 'City is required',
                      validate: value => value.trimStart().trimEnd() !== '' || 'City is required'
                    }}
                    render={({ field }) => (
                      <InputGroup>
                        <Input
                          {...field}
                          onBlur={(e) => field.onChange(e.target.value.trimStart().trimEnd())}
                          placeholder="City"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor={errors.city ? 'red.500' : '#d1d5db'}
                          borderRadius="6px"
                          h="40px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    )}
                  />
                </Field>
              </HStack>

              {/* Province Dropdown */}
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    Province
                  </Text>
                }
                w="full"
                errorText={errors.province?.message}
              >
                <Controller
                  name="province"
                  control={control}
                  rules={{ required: 'Province is required' }}
                  render={({ field }) => (
                    <InputGroup>
                      <select
                        {...field}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontSize: '14px',
                          color: veniceBlue,
                          border: `1px solid ${errors.province ? '#E53E3E' : '#d1d5db'}`,
                          borderRadius: '6px',
                          backgroundColor: 'white',
                        }}
                      >
                        <option value="">Select a province</option>
                        {PROVINCES.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </InputGroup>
                  )}
                />
              </Field>
            </VStack>
          </Box>

          {/* Next Section Button */}
          <Flex justify="flex-end" mt={10}>
            <Button
              type="submit"
              bg={teal}
              color="white"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              px={5}
              py={2.5}
              h="40px"
              borderRadius="6px"
              _hover={{ bg: '#0a5d61' }}
              transition="background-color 0.2s"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : (
                <>
                  Next Section
                  <Box as="span" fontSize="16px" ml={2}>
                    →
                  </Box>
                </>
              )}
            </Button>
          </Flex>
        </form>
      </Box>
    </Flex>
  );
}
