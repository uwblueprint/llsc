import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Stack,
  Flex,
} from '@chakra-ui/react';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';
import ProfileMultiSelectDropdown from './ProfileMultiSelectDropdown';
import ProfileHeader from './ProfileHeader';
import ActionButton from './EditButton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DIAGNOSIS_DROPDOWN_OPTIONS, 
  TREATMENT_OPTIONS, 
  EXPERIENCE_OPTIONS,
  COLORS 
} from '@/constants/form';

interface BloodCancerExperienceProps {
  cancerExperience: {
    diagnosis: string[];
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  };
  setCancerExperience: React.Dispatch<React.SetStateAction<{
    diagnosis: string[];
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  }>>;
  onEditTreatments: () => void;
  onEditExperiences: () => void;
}

const BloodCancerExperience: React.FC<BloodCancerExperienceProps> = ({
  cancerExperience,
  setCancerExperience,
  onEditTreatments,
  onEditExperiences,
}) => {
  const [isEditingTreatments, setIsEditingTreatments] = useState(false);
  const [isEditingExperiences, setIsEditingExperiences] = useState(false);
  const [otherTreatment, setOtherTreatment] = useState('');
  const [otherExperience, setOtherExperience] = useState('');

  const handleTreatmentToggle = (treatment: string) => {
    setCancerExperience(prev => ({
      ...prev,
      treatments: prev.treatments.includes(treatment)
        ? prev.treatments.filter(t => t !== treatment)
        : prev.treatments.length < 2
          ? [...prev.treatments, treatment]
          : prev.treatments
    }));
  };

  const handleExperienceToggle = (experience: string) => {
    setCancerExperience(prev => ({
      ...prev,
      experiences: prev.experiences.includes(experience)
        ? prev.experiences.filter(e => e !== experience)
        : prev.experiences.length < 5
          ? [...prev.experiences, experience]
          : prev.experiences
    }));
  };

  // Use treatment options directly (now includes "Other")
  const treatmentOptionsWithOther = TREATMENT_OPTIONS;
  
  // Create experience options with "Other" option  
  const experienceOptionsWithOther = [...EXPERIENCE_OPTIONS, 'Other'];

  return (
    <Box bg="white" p={0} mt="116px" minH="288px">
      <ProfileHeader>Blood cancer experience information</ProfileHeader>
      
      <VStack gap={8} mt="32px" align="stretch">
        <Flex gap="6.5%" align="start">
          <ProfileMultiSelectDropdown
            label="Your Diagnosis"
            value={cancerExperience.diagnosis}
            onChange={(selectedValues) => setCancerExperience(prev => ({ ...prev, diagnosis: selectedValues }))}
            options={DIAGNOSIS_DROPDOWN_OPTIONS}
            maxSelections={3}
            flex="1"
          />
          
          <ProfileTextInput
            label="Your Date of Diagnosis"
            value={cancerExperience.dateOfDiagnosis}
            onChange={(e) => setCancerExperience(prev => ({ ...prev, dateOfDiagnosis: e.target.value }))}
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
              <ActionButton onClick={async () => {
                if (isEditingTreatments) {
                  await onEditTreatments();
                }
                setIsEditingTreatments(!isEditingTreatments);
              }}>
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
                    You can select a <Text as="span" fontWeight={700}>maximum of 2</Text>.
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
              <ActionButton onClick={async () => {
                if (isEditingExperiences) {
                  await onEditExperiences();
                }
                setIsEditingExperiences(!isEditingExperiences);
              }}>
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
                    You can select a <Text as="span" fontWeight={700}>maximum of 5</Text>.
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
    </Box>
  );
};

export default BloodCancerExperience; 