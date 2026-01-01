import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text, SimpleGrid } from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';

interface CaregiverTwoColumnQualitiesFormProps {
  selectedQualities: string[];
  onQualityToggle: (key: string) => void;
  onNext: () => void;
  leftOptions?: { key: string; label: string }[];
  rightOptions?: { key: string; label: string }[];
}

// Left column options – The volunteer is/has… ("…as me" phrasing)
const VOLUNTEER_OPTIONS = [
  'the same age as me',
  'the same gender identity as me',
  'the same ethnic or cultural group as me',
  'the same marital status as me',
  'the same parental status as me',
  'the same diagnosis as me',
  'experience with PTSD',
  'experience with Relapse',
  'experience with Anxiety / Depression',
  'experience with Fertility Issues',
];

// Right column options – Their loved one is/has… ("…as my loved one" phrasing)
const LOVED_ONE_OPTIONS = [
  'the same age as my loved one',
  'the same gender identity as my loved one',
  'the same diagnosis as my loved one',
  'experience with Oral Chemotherapy',
  'experience with Radiation Therapy',
  'experience with PTSD',
  'experience with Relapse',
  'experience with Anxiety / Depression',
  'experience with Fertility Issues',
];

export function CaregiverTwoColumnQualitiesForm({
  selectedQualities,
  onQualityToggle,
  onNext,
  leftOptions,
  rightOptions,
}: CaregiverTwoColumnQualitiesFormProps) {
  const maxSelected = 5;
  const reachedMax = selectedQualities.length >= maxSelected;
  const volunteerOptions =
    leftOptions && leftOptions.length > 0
      ? leftOptions
      : VOLUNTEER_OPTIONS.map((label) => ({ key: label, label }));
  const lovedOneOptions =
    rightOptions && rightOptions.length > 0
      ? rightOptions
      : LOVED_ONE_OPTIONS.map((label) => ({ key: label, label }));

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
        Volunteer Matching Preferences
      </Heading>

      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg="gray.300" borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg="brand.primary" borderRadius="full" />
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
          Relevant Qualities in a Volunteer
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          You will be ranking these qualities in the next step.
        </Text>
        <Text
          color="brand.navy"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          Note that your volunteer is guaranteed to speak your language and have the same
          availability.
        </Text>

        <VStack gap={5} align="start">
          <Box w="full">
            <Text
              color="brand.navy"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={1}
            >
              I would prefer that...
            </Text>
            <Text
              color="brand.fieldText"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12px"
              mb={4}
            >
              You can select a maximum of 5 across both categories. Please select at least one
              quality.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full">
              <Box>
                <Text
                  color="brand.fieldText"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="12px"
                  mb={3}
                >
                  The volunteer is/has...
                </Text>
                <VStack align="start" gap={3}>
                  {volunteerOptions.map((opt) => (
                    <Checkbox
                      key={`vol-${opt.key}`}
                      checked={selectedQualities.includes(opt.key)}
                      onChange={() => onQualityToggle(opt.key)}
                      disabled={!selectedQualities.includes(opt.key) && reachedMax}
                    >
                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                      >
                        {opt.label}
                      </Text>
                    </Checkbox>
                  ))}
                </VStack>
              </Box>

              <Box>
                <Text
                  color="brand.fieldText"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="12px"
                  mb={3}
                >
                  Their loved one is/has...
                </Text>
                <VStack align="start" gap={3}>
                  {lovedOneOptions.map((opt) => (
                    <Checkbox
                      key={`loved-${opt.key}`}
                      checked={selectedQualities.includes(opt.key)}
                      onChange={() => onQualityToggle(opt.key)}
                      disabled={!selectedQualities.includes(opt.key) && reachedMax}
                    >
                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                      >
                        {opt.label}
                      </Text>
                    </Checkbox>
                  ))}
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>
        </VStack>
      </Box>

      <Box w="full" display="flex" justifyContent={{ base: 'stretch', sm: 'flex-end' }}>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primaryEmphasis' }}
          _active={{ bg: 'brand.primaryEmphasis' }}
          onClick={onNext}
          disabled={selectedQualities.length === 0}
          w={{ base: 'full', sm: 'auto' }}
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Next Section →
        </Button>
      </Box>
    </Box>
  );
}
