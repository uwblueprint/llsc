import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';

import { CustomRadio } from '@/components/CustomRadio';
import { COLORS } from '@/constants/form';

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

      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Your volunteer
        </Heading>
        <Text
          color={COLORS.fieldGray}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          This information will be used in the next step.
        </Text>
        <Text
          color={COLORS.veniceBlue}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          Note that your volunteer is guaranteed to speak your language and have the same
          availability.
        </Text>

        <VStack gap={5}>
          <Box w="full">
            <Text
              color={COLORS.veniceBlue}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={4}
            >
              I would like a volunteer that...
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
                  color={COLORS.veniceBlue}
                >
                  has a similar diagnosis
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
                  color={COLORS.veniceBlue}
                >
                  is caring for a loved one with blood cancer
                </Text>
              </CustomRadio>
            </VStack>
          </Box>
        </VStack>
      </Box>

      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          onClick={() => onNext(volunteerType)}
          disabled={!volunteerType}
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
