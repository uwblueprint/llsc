import React from 'react';
import { Box, Heading, Button, VStack, Flex, Text, Textarea } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { StepIndicator } from '@/components/ui';
import { getIntakeFormTitle, IntakeFormType } from '@/constants/form';

interface AdditionalInfoFormData {
  additionalInfo: string;
}

interface AdditionalInfoFormProps {
  formType: IntakeFormType;
  onSubmit: (data: AdditionalInfoFormData) => void;
  onBack?: () => void;
}

export function AdditionalInfoForm({ formType, onSubmit, onBack }: AdditionalInfoFormProps) {
  const t = useTranslations('intake');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdditionalInfoFormData>({
    defaultValues: {
      additionalInfo: '',
    },
  });

  const onFormSubmit = (data: AdditionalInfoFormData) => {
    onSubmit(data);
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

      {/* Progress Bar - All segments active on final step */}
      <StepIndicator currentStep={3} />

      {/* Additional Information Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize="20px"
          mb={3}
        >
          {t('additionalInformation')}
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={8}
        >
          {t('additionalInfoDescription')}
        </Text>

        <VStack gap={5} align="stretch">
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              color="brand.navy"
              mb={2}
            >
              {t('experienceNotListed')}
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
                  borderColor={errors.additionalInfo ? 'red.500' : '#d1d5db'}
                  borderRadius="6px"
                  minH="200px"
                  resize="vertical"
                  border="1px solid"
                  px={3}
                  py={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{
                    borderColor: 'brand.primary',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-primary-emphasis)',
                  }}
                />
              )}
            />
            {errors.additionalInfo && (
              <Text color="red.500" fontSize="12px" mt={2}>
                {errors.additionalInfo.message}
              </Text>
            )}
          </Box>
        </VStack>
      </Box>

      {/* Navigation Buttons */}
      <Flex justify="space-between" mt={8}>
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
            _hover={{
              bg: 'brand.primaryLight',
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
          loading={isSubmitting}
          loadingText={t('submitting')}
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          {t('submitForm')}
        </Button>
      </Flex>
    </form>
  );
}
