import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Flex,
  Input,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { InputGroup } from '@/components/ui/input-group';
import { StepIndicator } from '@/components/ui';
import { VALIDATION } from '@/constants/form';

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
  const t = useTranslations('intake');
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
        color="brand.navy"
        fontSize={{ base: '24px', md: '28px' }}
        mb={8}
      >
        {t('volunteerProfileForm')}
      </Heading>

      {/* Progress Bar */}
      <StepIndicator currentStep={2} totalSteps={2} />

      {/* References Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize={{ base: '18px', md: '20px' }}
          mb={3}
        >
          {t('references')}
        </Heading>

        <VStack gap={6} align="stretch">
          {/* Reference 1 */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="16px"
              color="brand.navy"
              mb={4}
            >
              {t('reference1')}
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('fullName')}
                </Text>
                <Controller
                  name="reference1.fullName"
                  control={control}
                  rules={{ required: t('referenceFullNameRequired') }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterFullName')}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference1?.fullName ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference1?.fullName && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference1.fullName.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('email')}
                </Text>
                <Controller
                  name="reference1.email"
                  control={control}
                  rules={{
                    required: t('referenceEmailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('invalidEmail'),
                    },
                  }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterEmail')}
                        type="email"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference1?.email ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference1?.email && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference1.email.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('phoneNumber')}
                </Text>
                <Controller
                  name="reference1.phoneNumber"
                  control={control}
                  rules={{
                    required: t('referencePhoneRequired'),
                    pattern: {
                      value: VALIDATION.PHONE,
                      message: t('validation.invalidPhoneNumber'),
                    },
                  }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterPhoneNumber')}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference1?.phoneNumber ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference1?.phoneNumber && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference1.phoneNumber.message}
                  </Text>
                )}
              </Box>
            </SimpleGrid>
          </Box>

          {/* Reference 2 */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="16px"
              color="brand.navy"
              mb={4}
            >
              {t('reference2')}
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('fullName')}
                </Text>
                <Controller
                  name="reference2.fullName"
                  control={control}
                  rules={{ required: t('referenceFullNameRequired') }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterFullName')}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference2?.fullName ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference2?.fullName && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference2.fullName.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('email')}
                </Text>
                <Controller
                  name="reference2.email"
                  control={control}
                  rules={{
                    required: t('referenceEmailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('invalidEmail'),
                    },
                  }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterEmail')}
                        type="email"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference2?.email ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference2?.email && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference2.email.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={400}
                  fontSize="14px"
                  color="brand.navy"
                  mb={2}
                >
                  {t('phoneNumber')}
                </Text>
                <Controller
                  name="reference2.phoneNumber"
                  control={control}
                  rules={{
                    required: t('referencePhoneRequired'),
                    pattern: {
                      value: VALIDATION.PHONE,
                      message: t('validation.invalidPhoneNumber'),
                    },
                  }}
                  render={({ field }) => (
                    <InputGroup>
                      <Input
                        {...field}
                        placeholder={t('enterPhoneNumber')}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        borderColor={errors.reference2?.phoneNumber ? 'red.500' : undefined}
                        borderRadius="6px"
                        h="40px"
                        px={3}
                        _placeholder={{ color: 'gray.400' }}
                        _focus={{
                          borderColor: 'brand.primary',
                          boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
                        }}
                      />
                    </InputGroup>
                  )}
                />
                {errors.reference2?.phoneNumber && (
                  <Text color="red.500" fontSize="12px" mt={2}>
                    {errors.reference2.phoneNumber.message}
                  </Text>
                )}
              </Box>
            </SimpleGrid>
          </Box>

          {/* Additional Information */}
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              color="brand.navy"
              mb={2}
            >
              {t('anythingElseToShare')}
            </Text>

            <Controller
              name="additionalInfo"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder={t('typeHere')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                  borderRadius="6px"
                  minH="120px"
                  resize="vertical"
                  px={3}
                  py={3}
                  border="1px solid"
                  borderColor="gray.300"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-alpha)',
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
      <Flex justify="space-between" mt={8} gap={4} direction={{ base: 'column', sm: 'row' }}>
        {onBack ? (
          <Button
            onClick={onBack}
            variant="outline"
            borderColor="brand.primary"
            color="brand.primary"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            fontSize="14px"
            h="40px"
            px={6}
            w={{ base: 'full', sm: 'auto' }}
            _hover={{
              bg: 'brand.primaryAlpha',
            }}
          >
            {t('back')}
          </Button>
        ) : (
          <Box />
        )}

        <Button
          type="submit"
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primaryEmphasis' }}
          _active={{ bg: 'brand.primaryEmphasis' }}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          w={{ base: 'full', sm: 'auto' }}
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          {t('submitVolunteerProfileForm')}
        </Button>
      </Flex>
    </form>
  );
}
