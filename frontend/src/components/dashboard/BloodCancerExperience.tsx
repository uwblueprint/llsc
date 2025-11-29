import React, { useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Button, Stack, Flex } from '@chakra-ui/react';
import { FiHeart, FiInfo } from 'react-icons/fi';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';
import ProfileMultiSelectDropdown from './ProfileMultiSelectDropdown';
import ProfileHeader from './ProfileHeader';
import ActionButton from './EditButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/ui/tooltip';
import {
  DIAGNOSIS_DROPDOWN_OPTIONS,
  TREATMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  COLORS,
} from '@/constants/form';

interface BloodCancerExperienceProps {
  cancerExperience: {
    diagnosis: string[];
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  };
  setCancerExperience: React.Dispatch<
    React.SetStateAction<{
      diagnosis: string[];
      dateOfDiagnosis: string;
      treatments: string[];
      experiences: string[];
    }>
  >;
  lovedOneCancerExperience?: {
    diagnosis: string;
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  } | null;
  setLovedOneCancerExperience?: React.Dispatch<
    React.SetStateAction<{
      diagnosis: string;
      dateOfDiagnosis: string;
      treatments: string[];
      experiences: string[];
    } | null>
  >;
  onEditTreatments: () => void;
  onEditExperiences: () => void;
  onEditLovedOneTreatments?: () => void;
  onEditLovedOneExperiences?: () => void;
}

const BloodCancerExperience: React.FC<BloodCancerExperienceProps> = ({
  cancerExperience,
  setCancerExperience,
  lovedOneCancerExperience,
  setLovedOneCancerExperience,
  onEditTreatments,
  onEditExperiences,
  onEditLovedOneTreatments,
  onEditLovedOneExperiences,
}) => {
  const [isEditingTreatments, setIsEditingTreatments] = useState(false);
  const [isEditingExperiences, setIsEditingExperiences] = useState(false);
  const [isEditingLovedOneTreatments, setIsEditingLovedOneTreatments] = useState(false);
  const [isEditingLovedOneExperiences, setIsEditingLovedOneExperiences] = useState(false);
  const [otherTreatment, setOtherTreatment] = useState('');
  const [otherExperience, setOtherExperience] = useState('');
  const [otherLovedOneTreatment, setOtherLovedOneTreatment] = useState('');

  const handleTreatmentToggle = (treatment: string) => {
    setCancerExperience((prev) => ({
      ...prev,
      treatments: prev.treatments.includes(treatment)
        ? prev.treatments.filter((t) => t !== treatment)
        : prev.treatments.length < 2
          ? [...prev.treatments, treatment]
          : prev.treatments,
    }));
  };

  const handleExperienceToggle = (experience: string) => {
    setCancerExperience((prev) => ({
      ...prev,
      experiences: prev.experiences.includes(experience)
        ? prev.experiences.filter((e) => e !== experience)
        : prev.experiences.length < 5
          ? [...prev.experiences, experience]
          : prev.experiences,
    }));
  };

  const handleLovedOneTreatmentToggle = (treatment: string) => {
    if (!lovedOneCancerExperience || !setLovedOneCancerExperience) return;

    setLovedOneCancerExperience((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        treatments: prev.treatments.includes(treatment)
          ? prev.treatments.filter((t) => t !== treatment)
          : prev.treatments.length < 2
            ? [...prev.treatments, treatment]
            : prev.treatments,
      };
    });
  };

  const handleLovedOneExperienceToggle = (experience: string) => {
    if (!lovedOneCancerExperience || !setLovedOneCancerExperience) return;

    setLovedOneCancerExperience((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experiences: prev.experiences.includes(experience)
          ? prev.experiences.filter((e) => e !== experience)
          : prev.experiences.length < 5
            ? [...prev.experiences, experience]
            : prev.experiences,
      };
    });
  };

  // Use treatment options directly (now includes "Other")
  const treatmentOptionsWithOther = TREATMENT_OPTIONS;

  // Create experience options with "Other" option for user's own experiences
  const experienceOptionsWithOther = [...EXPERIENCE_OPTIONS, 'Other'];

  // For loved one experiences, use only the options from the database (no "Other")
  const lovedOneExperienceOptions = [...EXPERIENCE_OPTIONS];

  return (
    <Box bg="white" p={0} mt="116px" minH="288px">
      <ProfileHeader>Blood cancer experience information</ProfileHeader>

      <VStack gap={8} mt="32px" align="stretch">
        <Flex gap="6.5%" align="start">
          <ProfileMultiSelectDropdown
            label="Your Diagnosis"
            value={cancerExperience.diagnosis}
            onChange={(selectedValues) =>
              setCancerExperience((prev) => ({ ...prev, diagnosis: selectedValues }))
            }
            options={DIAGNOSIS_DROPDOWN_OPTIONS}
            maxSelections={3}
            flex="1"
          />

          <ProfileTextInput
            label="Your Date of Diagnosis"
            value={cancerExperience.dateOfDiagnosis}
            onChange={(e) =>
              setCancerExperience((prev) => ({ ...prev, dateOfDiagnosis: e.target.value }))
            }
            placeholder="DD/MM/YYYY"
            flex="1"
          />
        </Flex>

        <Flex gap="6.5%" align="start">
          <Box flex="1">
            <HStack justify="space-between" align="center" mb={4}>
              <Box
                fontSize="1rem"
                fontWeight={600}
                lineHeight="30px"
                letterSpacing="0%"
                color={COLORS.veniceBlue}
                fontFamily="'Open Sans', sans-serif"
              >
                Treatments you have done
              </Box>
              <ActionButton
                onClick={async () => {
                  if (isEditingTreatments) {
                    await onEditTreatments();
                  }
                  setIsEditingTreatments(!isEditingTreatments);
                }}
              >
                {isEditingTreatments ? 'Save' : 'Edit'}
              </ActionButton>
            </HStack>

            {isEditingTreatments ? (
              <VStack align="start" gap={3}>
                <Box mb={3}>
                  <Text
                    fontSize="14px"
                    color="#495D6C"
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                  >
                    You can select a{' '}
                    <Text as="span" fontWeight={700}>
                      maximum of 2
                    </Text>
                    .
                  </Text>
                </Box>
                {treatmentOptionsWithOther.map((treatment) => {
                  const isSelected = cancerExperience.treatments.includes(treatment);
                  const isDisabled = !isSelected && cancerExperience.treatments.length >= 2;

                  return (
                    <VStack key={treatment} align="start" gap={2}>
                      <HStack
                        align="center"
                        gap={2}
                        cursor={isDisabled ? 'not-allowed' : 'pointer'}
                        opacity={isDisabled ? 0.5 : 1}
                        onClick={() => !isDisabled && handleTreatmentToggle(treatment)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => handleTreatmentToggle(treatment)}
                        />
                        <Text
                          fontSize="16px"
                          fontWeight={400}
                          lineHeight="100%"
                          letterSpacing="0%"
                          color="#495D6C"
                          fontFamily="'Open Sans', sans-serif"
                        >
                          {treatment}
                        </Text>
                      </HStack>
                      {treatment === 'Other' && isSelected && (
                        <Box ml={6}>
                          <ProfileTextInput
                            label=""
                            value={otherTreatment}
                            onChange={(e) => setOtherTreatment(e.target.value)}
                            placeholder="Please specify..."
                          />
                        </Box>
                      )}
                    </VStack>
                  );
                })}
              </VStack>
            ) : (
              <VStack align="start" gap={2}>
                {cancerExperience.treatments.map((treatment, index) => (
                  <Text
                    key={index}
                    fontSize="16px"
                    fontWeight={400}
                    lineHeight="100%"
                    letterSpacing="0%"
                    color="#495D6C"
                    fontFamily="'Open Sans', sans-serif"
                  >
                    {treatment}
                  </Text>
                ))}
              </VStack>
            )}
          </Box>

          <Box flex="1">
            <HStack justify="space-between" align="center" mb={4}>
              <Box
                fontSize="1rem"
                fontWeight={600}
                lineHeight="30px"
                letterSpacing="0%"
                color={COLORS.veniceBlue}
                fontFamily="'Open Sans', sans-serif"
              >
                Experiences you had
              </Box>
              <ActionButton
                onClick={async () => {
                  if (isEditingExperiences) {
                    await onEditExperiences();
                  }
                  setIsEditingExperiences(!isEditingExperiences);
                }}
              >
                {isEditingExperiences ? 'Save' : 'Edit'}
              </ActionButton>
            </HStack>

            {isEditingExperiences ? (
              <VStack align="start" gap={3}>
                <Box mb={3}>
                  <Text
                    fontSize="14px"
                    color="#495D6C"
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                  >
                    You can select a{' '}
                    <Text as="span" fontWeight={700}>
                      maximum of 5
                    </Text>
                    .
                  </Text>
                </Box>
                {experienceOptionsWithOther.map((experience) => {
                  const isSelected = cancerExperience.experiences.includes(experience);
                  const isDisabled = !isSelected && cancerExperience.experiences.length >= 5;

                  return (
                    <VStack key={experience} align="start" gap={2}>
                      <HStack
                        align="center"
                        gap={2}
                        cursor={isDisabled ? 'not-allowed' : 'pointer'}
                        opacity={isDisabled ? 0.5 : 1}
                        onClick={() => !isDisabled && handleExperienceToggle(experience)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => handleExperienceToggle(experience)}
                        />
                        <Text
                          fontSize="16px"
                          fontWeight={400}
                          lineHeight="100%"
                          letterSpacing="0%"
                          color="#495D6C"
                          fontFamily="'Open Sans', sans-serif"
                        >
                          {experience}
                        </Text>
                      </HStack>
                      {experience === 'Other' && isSelected && (
                        <Box ml={6}>
                          <ProfileTextInput
                            label=""
                            value={otherExperience}
                            onChange={(e) => setOtherExperience(e.target.value)}
                            placeholder="Please specify..."
                          />
                        </Box>
                      )}
                    </VStack>
                  );
                })}
              </VStack>
            ) : (
              <VStack align="start" gap={2}>
                {cancerExperience.experiences.map((experience, index) => (
                  <Text
                    key={index}
                    fontSize="16px"
                    fontWeight={400}
                    lineHeight="100%"
                    letterSpacing="0%"
                    color="#495D6C"
                    fontFamily="'Open Sans', sans-serif"
                  >
                    {experience}
                  </Text>
                ))}
              </VStack>
            )}
          </Box>
        </Flex>
      </VStack>

      {/* Loved One's Blood Cancer Experience */}
      {lovedOneCancerExperience && (
        <VStack gap={8} mt={12} align="stretch">
          <Box borderBottom="1px solid" borderColor="#E5E7EB" />

          <Flex gap="6.5%" align="start">
            <Box flex="1">
              <Flex align="center" gap={2} mb={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontSize="1rem"
                  fontWeight={600}
                  lineHeight="30px"
                  color={COLORS.veniceBlue}
                  fontFamily="'Open Sans', sans-serif"
                >
                  Loved One's Diagnosis
                </Text>
                <Tooltip content="This field cannot be edited" showArrow>
                  <Box display="flex" alignItems="center" cursor="pointer">
                    <FiInfo size={16} color={COLORS.veniceBlue} />
                  </Box>
                </Tooltip>
              </Flex>
              <Box position="relative">
                <Box
                  as="div"
                  bg="white"
                  borderColor="#D5D7DA"
                  border="1px solid #D5D7DA"
                  borderRadius="8px"
                  height="44px"
                  paddingLeft="14px"
                  paddingRight="40px"
                  display="flex"
                  alignItems="center"
                  fontSize="1rem"
                  fontWeight={400}
                  lineHeight="24px"
                  color="#181D27"
                  fontFamily="'Open Sans', sans-serif"
                  opacity={0.6}
                  cursor="not-allowed"
                >
                  {lovedOneCancerExperience.diagnosis || 'Not provided'}
                </Box>
                <Tooltip content="This field cannot be edited" showArrow>
                  <Box
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    display="flex"
                    alignItems="center"
                    cursor="pointer"
                  >
                    <FiInfo size={20} color="#495D6C" />
                  </Box>
                </Tooltip>
              </Box>
            </Box>

            <Box flex="1">
              <Flex align="center" gap={2} mb={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontSize="1rem"
                  fontWeight={600}
                  lineHeight="30px"
                  color={COLORS.veniceBlue}
                  fontFamily="'Open Sans', sans-serif"
                >
                  Loved One's Date of Diagnosis
                </Text>
                <Tooltip content="This field cannot be edited" showArrow>
                  <Box display="flex" alignItems="center" cursor="pointer">
                    <FiInfo size={16} color={COLORS.veniceBlue} />
                  </Box>
                </Tooltip>
              </Flex>
              <Box position="relative">
                <Box
                  as="input"
                  type="text"
                  value={lovedOneCancerExperience.dateOfDiagnosis || 'Not provided'}
                  readOnly
                  bg="white"
                  borderColor="#D5D7DA"
                  border="1px solid #D5D7DA"
                  borderRadius="8px"
                  height="44px"
                  paddingLeft="14px"
                  paddingRight="40px"
                  fontSize="1rem"
                  fontWeight={400}
                  lineHeight="24px"
                  color="#181D27"
                  fontFamily="'Open Sans', sans-serif"
                  width="100%"
                  opacity={0.6}
                  cursor="not-allowed"
                  outline="none"
                  _focus={{
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
                <Tooltip content="This field cannot be edited" showArrow>
                  <Box
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    display="flex"
                    alignItems="center"
                    cursor="pointer"
                  >
                    <FiInfo size={20} color="#495D6C" />
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          </Flex>

          <Flex gap="6.5%" align="start">
            <Box flex="1">
              <HStack justify="space-between" align="center" mb={4}>
                <Flex align="center" gap={2}>
                  <FiHeart size={14} color={COLORS.veniceBlue} />
                  <Box
                    fontSize="1rem"
                    fontWeight={600}
                    lineHeight="30px"
                    letterSpacing="0%"
                    color={COLORS.veniceBlue}
                    fontFamily="'Open Sans', sans-serif"
                  >
                    Treatments Loved One Has Done
                  </Box>
                </Flex>
                <ActionButton
                  onClick={async () => {
                    if (isEditingLovedOneTreatments && onEditLovedOneTreatments) {
                      await onEditLovedOneTreatments();
                    }
                    setIsEditingLovedOneTreatments(!isEditingLovedOneTreatments);
                  }}
                >
                  {isEditingLovedOneTreatments ? 'Save' : 'Edit'}
                </ActionButton>
              </HStack>

              {isEditingLovedOneTreatments ? (
                <VStack align="start" gap={3}>
                  <Box mb={3}>
                    <Text
                      fontSize="14px"
                      color="#495D6C"
                      fontFamily="'Open Sans', sans-serif"
                      fontWeight={400}
                    >
                      You can select a{' '}
                      <Text as="span" fontWeight={700}>
                        maximum of 2
                      </Text>
                      .
                    </Text>
                  </Box>
                  {treatmentOptionsWithOther.map((treatment) => {
                    const isSelected = lovedOneCancerExperience.treatments.includes(treatment);
                    const isDisabled =
                      !isSelected && lovedOneCancerExperience.treatments.length >= 2;

                    return (
                      <VStack key={treatment} align="start" gap={2}>
                        <HStack
                          align="center"
                          gap={2}
                          cursor={isDisabled ? 'not-allowed' : 'pointer'}
                          opacity={isDisabled ? 0.5 : 1}
                          onClick={() => !isDisabled && handleLovedOneTreatmentToggle(treatment)}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleLovedOneTreatmentToggle(treatment)}
                          />
                          <Text
                            fontSize="16px"
                            fontWeight={400}
                            lineHeight="100%"
                            letterSpacing="0%"
                            color="#495D6C"
                            fontFamily="'Open Sans', sans-serif"
                          >
                            {treatment}
                          </Text>
                        </HStack>
                        {treatment === 'Other' && isSelected && (
                          <Box ml={6}>
                            <ProfileTextInput
                              label=""
                              value={otherLovedOneTreatment}
                              onChange={(e) => setOtherLovedOneTreatment(e.target.value)}
                              placeholder="Please specify..."
                            />
                          </Box>
                        )}
                      </VStack>
                    );
                  })}
                </VStack>
              ) : (
                <VStack align="start" gap={2}>
                  {lovedOneCancerExperience.treatments.map((treatment, index) => (
                    <Text
                      key={index}
                      fontSize="16px"
                      fontWeight={400}
                      lineHeight="100%"
                      letterSpacing="0%"
                      color="#495D6C"
                      fontFamily="'Open Sans', sans-serif"
                    >
                      {treatment}
                    </Text>
                  ))}
                </VStack>
              )}
            </Box>

            <Box flex="1">
              <HStack justify="space-between" align="center" mb={4}>
                <Flex align="center" gap={2}>
                  <FiHeart size={14} color={COLORS.veniceBlue} />
                  <Box
                    fontSize="1rem"
                    fontWeight={600}
                    lineHeight="30px"
                    letterSpacing="0%"
                    color={COLORS.veniceBlue}
                    fontFamily="'Open Sans', sans-serif"
                  >
                    Experiences Loved One Had
                  </Box>
                </Flex>
                <ActionButton
                  onClick={async () => {
                    if (isEditingLovedOneExperiences && onEditLovedOneExperiences) {
                      await onEditLovedOneExperiences();
                    }
                    setIsEditingLovedOneExperiences(!isEditingLovedOneExperiences);
                  }}
                >
                  {isEditingLovedOneExperiences ? 'Save' : 'Edit'}
                </ActionButton>
              </HStack>

              {isEditingLovedOneExperiences ? (
                <VStack align="start" gap={3}>
                  <Box mb={3}>
                    <Text
                      fontSize="14px"
                      color="#495D6C"
                      fontFamily="'Open Sans', sans-serif"
                      fontWeight={400}
                    >
                      You can select a{' '}
                      <Text as="span" fontWeight={700}>
                        maximum of 5
                      </Text>
                      .
                    </Text>
                  </Box>
                  {lovedOneExperienceOptions.map((experience) => {
                    const isSelected = lovedOneCancerExperience.experiences.includes(experience);
                    const isDisabled =
                      !isSelected && lovedOneCancerExperience.experiences.length >= 5;

                    return (
                      <HStack
                        key={experience}
                        align="center"
                        gap={2}
                        cursor={isDisabled ? 'not-allowed' : 'pointer'}
                        opacity={isDisabled ? 0.5 : 1}
                        onClick={() => !isDisabled && handleLovedOneExperienceToggle(experience)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => handleLovedOneExperienceToggle(experience)}
                        />
                        <Text
                          fontSize="16px"
                          fontWeight={400}
                          lineHeight="100%"
                          letterSpacing="0%"
                          color="#495D6C"
                          fontFamily="'Open Sans', sans-serif"
                        >
                          {experience}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                <VStack align="start" gap={2}>
                  {lovedOneCancerExperience.experiences.map((experience, index) => (
                    <Text
                      key={index}
                      fontSize="16px"
                      fontWeight={400}
                      lineHeight="100%"
                      letterSpacing="0%"
                      color="#495D6C"
                      fontFamily="'Open Sans', sans-serif"
                    >
                      {experience}
                    </Text>
                  ))}
                </VStack>
              )}
            </Box>
          </Flex>
        </VStack>
      )}
    </Box>
  );
};

export default BloodCancerExperience;
