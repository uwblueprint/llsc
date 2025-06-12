import React from 'react';
import { Box, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { Control, Controller } from 'react-hook-form';
import { CustomRadio } from '@/components/CustomRadio';
import { FormData } from '@/constants/form';
import { COLORS } from '@/constants/form';

interface ExperienceTypeSectionProps {
  control: Control<FormData>;
  errors: Record<string, { message?: string }>;
}

export const ExperienceTypeSection: React.FC<ExperienceTypeSectionProps> = ({ control, errors }) => {
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
        Experience Type
      </Heading>
      <Text color={COLORS.fieldGray} fontFamily="system-ui, -apple-system, sans-serif" fontSize="15px" mb={8}>
        Help us learn more about your experience with cancer.
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
                    <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={COLORS.veniceBlue}>
                      Yes
                    </Text>
                  </CustomRadio>
                  <CustomRadio
                    name="hasBloodCancer"
                    value="no"
                    checked={field.value === 'no'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={COLORS.veniceBlue}>
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
              color={COLORS.veniceBlue}
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
                    <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={COLORS.veniceBlue}>
                      Yes
                    </Text>
                  </CustomRadio>
                  <CustomRadio
                    name="caringForSomeone"
                    value="no"
                    checked={field.value === 'no'}
                    onChange={(value) => field.onChange(value)}
                  >
                    <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={COLORS.veniceBlue}>
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
      </VStack>
    </Box>
  );
}; 
