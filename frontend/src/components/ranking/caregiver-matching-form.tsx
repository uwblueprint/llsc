import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { CustomRadio } from '@/components/CustomRadio';

interface CaregiverMatchingFormProps {
  volunteerType: string;
  onVolunteerTypeChange: (type: string) => void;
  onNext: (type: string) => void;
}

export function CaregiverMatchingForm({
  volunteerType,
  onVolunteerTypeChange,
  onNext,
}: CaregiverMatchingFormProps) {
  const t = useTranslations('ranking');
  return (
    <Box>
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color="brand.navy"
        fontSize={{ base: '24px', md: '28px' }}
        mb={8}
      >
        {t('volunteerMatchingPreferences')}
      </Heading>

      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg="brand.primary" borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg="gray.300" borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg="gray.300" borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize={{ base: '18px', md: '20px' }}
          mb={3}
        >
          {t('yourVolunteer')}
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          {t('informationUsedNextStep')}
        </Text>
        <Text
          color="brand.navy"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          {t('volunteerGuaranteed')}
        </Text>

        <VStack gap={5}>
          <Box w="full">
            <Text
              color="brand.navy"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={4}
            >
              {t('iWouldLikeVolunteerThat')}
            </Text>

            <VStack align="start" gap={3}>
              <CustomRadio
                name="volunteerType"
                value="similarDiagnosis"
                checked={volunteerType === 'similarDiagnosis'}
                onChange={(value) => onVolunteerTypeChange(value)}
              >
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                >
                  {t('hasSimilarDiagnosis')}
                </Text>
              </CustomRadio>

              <CustomRadio
                name="volunteerType"
                value="caringForLovedOne"
                checked={volunteerType === 'caringForLovedOne'}
                onChange={(value) => onVolunteerTypeChange(value)}
              >
                <Text
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color="brand.navy"
                >
                  {t('isCaringForLovedOne')}
                </Text>
              </CustomRadio>
            </VStack>
          </Box>
        </VStack>
      </Box>

      <Box w="full" display="flex" justifyContent={{ base: 'stretch', sm: 'flex-end' }}>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primaryEmphasis' }}
          _active={{ bg: 'brand.primaryEmphasis' }}
          onClick={() => onNext(volunteerType)}
          disabled={!volunteerType}
          w={{ base: 'full', sm: 'auto' }}
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          {t('nextSection')} →
        </Button>
      </Box>
    </Box>
  );
}
