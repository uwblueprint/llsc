import React, { useState } from 'react';
import { Box, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import { FiHeart } from 'react-icons/fi';
import ProfileTextInput from './ProfileTextInput';
import ProfileHeader from './ProfileHeader';
import ActionButton from './EditButton';
import ReadOnlyDiagnosisField from './ReadOnlyDiagnosisField';
import { Checkbox } from '@/components/ui/checkbox';
import { TREATMENT_OPTIONS, EXPERIENCE_OPTIONS, COLORS } from '@/constants/form';
import { useTranslations } from 'next-intl';

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
  hasBloodCancer?: boolean;
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
  hasBloodCancer = false,
}) => {
  const t = useTranslations('dashboard');
  const tOptions = useTranslations('options');

  // Helper to translate medical terms with fallback to original value
  const translateOption = (category: 'treatments' | 'experiences' | 'diagnoses', value: string) => {
    try {
      return tOptions(`${category}.${value}`);
    } catch {
      return value; // Fallback to original if translation not found
    }
  };

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
      <ProfileHeader>{t('bloodCancerExperienceInfo')}</ProfileHeader>

      <VStack gap={8} mt="32px" align="stretch">
        {/* Only show user's cancer info if they have cancer */}
        {hasBloodCancer && (
          <>
            <Flex gap="6.5%" align="start">
              <ReadOnlyDiagnosisField
                label={t('yourDiagnosis')}
                value={
                  cancerExperience.diagnosis.length > 0 ? cancerExperience.diagnosis.join(', ') : ''
                }
              />
              <ReadOnlyDiagnosisField
                label={t('yourDateOfDiagnosis')}
                value={cancerExperience.dateOfDiagnosis}
                fullWidth
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
                    {t('treatmentsRecommended')}
                  </Box>
                  <ActionButton
                    onClick={async () => {
                      if (isEditingTreatments) {
                        await onEditTreatments();
                      }
                      setIsEditingTreatments(!isEditingTreatments);
                    }}
                  >
                    {isEditingTreatments ? t('save') : t('edit')}
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
                        {t('selectMaximum2')}
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
                              {translateOption('treatments', treatment)}
                            </Text>
                          </HStack>
                          {treatment === 'Other' && isSelected && (
                            <Box ml={6}>
                              <ProfileTextInput
                                label=""
                                value={otherTreatment}
                                onChange={(e) => setOtherTreatment(e.target.value)}
                                placeholder={t('pleaseSpecify')}
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
                        {translateOption('treatments', treatment)}
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
                    {t('experiencesYouHad')}
                  </Box>
                  <ActionButton
                    onClick={async () => {
                      if (isEditingExperiences) {
                        await onEditExperiences();
                      }
                      setIsEditingExperiences(!isEditingExperiences);
                    }}
                  >
                    {isEditingExperiences ? t('save') : t('edit')}
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
                        {t('selectMaximum5')}
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
                              {translateOption('experiences', experience)}
                            </Text>
                          </HStack>
                          {experience === 'Other' && isSelected && (
                            <Box ml={6}>
                              <ProfileTextInput
                                label=""
                                value={otherExperience}
                                onChange={(e) => setOtherExperience(e.target.value)}
                                placeholder={t('pleaseSpecify')}
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
                        {translateOption('experiences', experience)}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>
            </Flex>
          </>
        )}

        {/* Loved One's Blood Cancer Experience */}
        {lovedOneCancerExperience && (
          <VStack gap={8} mt={12} align="stretch">
            <Box borderBottom="1px solid" borderColor="#E5E7EB" />

            <Flex gap="6.5%" align="start">
              <ReadOnlyDiagnosisField
                label={t('lovedOneDiagnosis')}
                value={lovedOneCancerExperience.diagnosis}
                showHeartIcon
              />
              <ReadOnlyDiagnosisField
                label={t('lovedOneDateOfDiagnosis')}
                value={lovedOneCancerExperience.dateOfDiagnosis}
                showHeartIcon
                fullWidth
              />
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
                      {t('lovedOneTreatments')}
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
                    {isEditingLovedOneTreatments ? t('save') : t('edit')}
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
                        {t('selectMaximum2')}
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
                              {translateOption('treatments', treatment)}
                            </Text>
                          </HStack>
                          {treatment === 'Other' && isSelected && (
                            <Box ml={6}>
                              <ProfileTextInput
                                label=""
                                value={otherLovedOneTreatment}
                                onChange={(e) => setOtherLovedOneTreatment(e.target.value)}
                                placeholder={t('pleaseSpecify')}
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
                        {translateOption('treatments', treatment)}
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
                      {t('lovedOneExperiences')}
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
                    {isEditingLovedOneExperiences ? t('save') : t('edit')}
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
                        {t('selectMaximum5')}
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
                            {translateOption('experiences', experience)}
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
                        {translateOption('experiences', experience)}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>
            </Flex>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default BloodCancerExperience;
