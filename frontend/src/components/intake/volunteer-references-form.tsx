import React from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Input, Textarea } from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, VALIDATION } from '@/constants/form';

interface VolunteerReferencesFormData {
  reference1: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  reference2: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  additionalInfo: string;
}

interface VolunteerReferencesFormProps {
  onNext: (data: VolunteerReferencesFormData) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const DEFAULT_VALUES: VolunteerReferencesFormData = {
  reference1: {
    fullName: '',
    email: '',
    phoneNumber: '',
  },
  reference2: {
    fullName: '',
    email: '',
    phoneNumber: '',
  },
  additionalInfo: '',
};

export function VolunteerReferencesForm({
  onNext,
  onBack,
  isSubmitting = false,
  submitError,
}: VolunteerReferencesFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<VolunteerReferencesFormData>({
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = (data: VolunteerReferencesFormData) => {
    onNext(data);
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
        Volunteer Profile Form
      </Heading>

      {/* Progress Bar */}
      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* References Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          References
        </Heading>

        <VStack gap={6} align="stretch">
          {/* Reference 1 */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="16px"
              color={COLORS.veniceBlue}
              mb={4}
            >
              Reference 1:
            </Text>

            <VStack gap={4} align="stretch">
              {/* Reference 1 - Name, Email, Phone Row */}
              <HStack gap={4} w="full">
                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Full Name
                  </Text>
                  <Controller
                    name="reference1.fullName"
                    control={control}
                    rules={{ required: 'Full name is required' }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="John Doe"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference1?.fullName ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference1?.fullName && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference1.fullName.message}
                    </Text>
                  )}
                </Box>

                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Email
                  </Text>
                  <Controller
                    name="reference1.email"
                    control={control}
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="john.doe@gmail.com"
                        type="email"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference1?.email ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference1?.email && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference1.email.message}
                    </Text>
                  )}
                </Box>

                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Phone Number
                  </Text>
                  <Controller
                    name="reference1.phoneNumber"
                    control={control}
                    rules={{
                      required: 'Phone number is required',
                      pattern: {
                        value: VALIDATION.PHONE,
                        message: 'Please enter a valid phone number',
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="###-###-####"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference1?.phoneNumber ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference1?.phoneNumber && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference1.phoneNumber.message}
                    </Text>
                  )}
                </Box>
              </HStack>
            </VStack>
          </Box>

          {/* Reference 2 */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="16px"
              color={COLORS.veniceBlue}
              mb={4}
            >
              Reference 2:
            </Text>

            <VStack gap={4} align="stretch">
              {/* Reference 2 - Name, Email, Phone Row */}
              <HStack gap={4} w="full">
                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Full Name
                  </Text>
                  <Controller
                    name="reference2.fullName"
                    control={control}
                    rules={{ required: 'Full name is required' }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="John Doe"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference2?.fullName ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference2?.fullName && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference2.fullName.message}
                    </Text>
                  )}
                </Box>

                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Email
                  </Text>
                  <Controller
                    name="reference2.email"
                    control={control}
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="john.doe@gmail.com"
                        type="email"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference2?.email ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference2?.email && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference2.email.message}
                    </Text>
                  )}
                </Box>

                <Box flex="1">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={400}
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    mb={2}
                  >
                    Phone Number
                  </Text>
                  <Controller
                    name="reference2.phoneNumber"
                    control={control}
                    rules={{
                      required: 'Phone number is required',
                      pattern: {
                        value: VALIDATION.PHONE,
                        message: 'Please enter a valid phone number',
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="###-###-####"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                        borderColor={errors.reference2?.phoneNumber ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{
                          borderColor: COLORS.teal,
                          boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                        }}
                      />
                    )}
                  />
                  {errors.reference2?.phoneNumber && (
                    <Text color="red.500" fontSize="12px" mt={2}>
                      {errors.reference2.phoneNumber.message}
                    </Text>
                  )}
                </Box>
              </HStack>
            </VStack>
          </Box>

          {/* Additional Information */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              color={COLORS.veniceBlue}
              mb={2}
            >
              Anything else to share?
            </Text>

            <Controller
              name="additionalInfo"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Type here...."
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color={COLORS.veniceBlue}
                  borderRadius="6px"
                  minH="120px"
                  resize="vertical"
                  px={3}
                  py={3}
                  border="1px solid"
                  borderColor="#d1d5db"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: COLORS.teal,
                    boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                  }}
                />
              )}
            />
          </Box>
        </VStack>
      </Box>

      {submitError ? (
        <Text color="red.500" fontSize="14px" mb={4}>
          {submitError}
        </Text>
      ) : null}

      {/* Navigation Buttons */}
      <HStack justify="space-between" mt={8}>
        {onBack ? (
          <Button
            onClick={onBack}
            variant="outline"
            borderColor={COLORS.teal}
            color={COLORS.teal}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            fontSize="14px"
            h="40px"
            px={6}
            _hover={{
              bg: `${COLORS.teal}10`,
            }}
          >
            Back
          </Button>
        ) : (
          <Box />
        )}

        <Button
          type="submit"
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Submit Volunteer Profile Form →
        </Button>
      </HStack>
    </form>
  );
}
