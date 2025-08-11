import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text, SimpleGrid } from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { COLORS } from '@/constants/form';

interface CaregiverTwoColumnQualitiesFormProps {
  selectedQualities: string[];
  onQualityToggle: (quality: string) => void;
  onNext: () => void;
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
}: CaregiverTwoColumnQualitiesFormProps) {
  const maxSelected = 5;
  const reachedMax = selectedQualities.length >= maxSelected;

  return (
    <Box>
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="28px"
        mb={8}
      >
        Volunteer Matching Preferences
      </Heading>

      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Relevant Qualities in a Volunteer
        </Heading>
        <Text
          color={COLORS.fieldGray}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          You will be ranking these qualities in the next step.
        </Text>
        <Text
          color={COLORS.veniceBlue}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          Note that your volunteer is guaranteed to speak your language and have the same availability.
        </Text>

        <VStack gap={5} align="start">
          <Box w="full">
            <Text
              color={COLORS.veniceBlue}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={1}
            >
              I would prefer that...
            </Text>
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12px"
              mb={4}
            >
              You can select a maximum of 5 across both categories. Please select at least one quality.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full">
              <Box>
                <Text
                  color={COLORS.fieldGray}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="12px"
                  mb={3}
                >
                  The volunteer is/has...
                </Text>
                <VStack align="start" gap={3}>
                  {VOLUNTEER_OPTIONS.map((quality) => (
                    <Checkbox
                      key={`vol-${quality}`}
                      checked={selectedQualities.includes(quality)}
                      onChange={() => onQualityToggle(quality)}
                      disabled={!selectedQualities.includes(quality) && reachedMax}
                    >
                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                      >
                        {quality}
                      </Text>
                    </Checkbox>
                  ))}
                </VStack>
              </Box>

              <Box>
                <Text
                  color={COLORS.fieldGray}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="12px"
                  mb={3}
                >
                  Their loved one is/has...
                </Text>
                <VStack align="start" gap={3}>
                  {LOVED_ONE_OPTIONS.map((quality) => (
                    <Checkbox
                      key={`loved-${quality}`}
                      checked={selectedQualities.includes(quality)}
                      onChange={() => onQualityToggle(quality)}
                      disabled={!selectedQualities.includes(quality) && reachedMax}
                    >
                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
                      >
                        {quality}
                      </Text>
                    </Checkbox>
                  ))}
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>
        </VStack>
      </Box>

      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          onClick={onNext}
          disabled={selectedQualities.length === 0}
          w="auto"
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


