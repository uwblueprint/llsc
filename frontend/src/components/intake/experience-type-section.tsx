import React from 'react';
import { Box, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { CustomRadio } from '@/components/CustomRadio';
import { COLORS } from '@/constants/form';
import { useTranslations } from 'next-intl';

interface ExperienceFields extends FieldValues {
  hasBloodCancer: 'yes' | 'no' | '';
  caringForSomeone: 'yes' | 'no' | '';
}

interface ExperienceTypeSectionProps<T extends ExperienceFields> {
  control: Control<T>;
  errors: Record<string, { message?: string }>;
}

export const ExperienceTypeSection = <T extends ExperienceFields>({
  control,
  errors,
}: ExperienceTypeSectionProps<T>) => {
  const t = useTranslations('intake');

  return (
    <Box mb={12}>
      <Heading
        as="h2"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="20px"
        mb={3}
      >
        {t('experienceType')}
      </Heading>
      <Text
        color={COLORS.fieldGray}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15px"
        mb={8}
      >
        {t('experienceTypeDescription')}
      </Text>

      <VStack align="start" gap={8}>
        {/* Blood Cancer and Caring Questions - Side by Side */}
        <HStack align="start" gap={12} w="full">
          {/* Blood Cancer Question */}
          <Box flex="1">
            <Text
              color={COLORS.veniceBlue}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={4}
            >
              {t('doYouHaveBloodCancer')}
            </Text>
            <Controller
              name={'hasBloodCancer' as Path<T>}
              control={control}
              rules={{ required: t('validation.experienceTypeRequired') }}
              render={({ field }) => (
                <VStack align="start" gap={1}>
                  <CustomRadio
                    name="hasBloodCancer"
                    value="yes"
                    checked={field.value === 'yes'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                    >
                      {t('yes')}
                    </Text>
                  </CustomRadio>
                  <CustomRadio
                    name="hasBloodCancer"
                    value="no"
                    checked={field.value === 'no'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                    >
                      {t('no')}
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
              color={COLORS.veniceBlue}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={4}
            >
              {t('areYouCaringForSomeone')}
            </Text>
            <Controller
              name={'caringForSomeone' as Path<T>}
              control={control}
              rules={{ required: t('validation.experienceTypeRequired') }}
              render={({ field }) => (
                <VStack align="start" gap={1}>
                  <CustomRadio
                    name="caringForSomeone"
                    value="yes"
                    checked={field.value === 'yes'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                    >
                      {t('yes')}
                    </Text>
                  </CustomRadio>
                  <CustomRadio
                    name="caringForSomeone"
                    value="no"
                    checked={field.value === 'no'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={COLORS.veniceBlue}
                    >
                      {t('no')}
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
      </VStack>
    </Box>
  );
};
