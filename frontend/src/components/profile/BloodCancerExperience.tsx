import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Stack,
} from '@chakra-ui/react';
import ProfileTextInput from './ProfileTextInput';
import ProfileDropdown from './ProfileDropdown';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

interface BloodCancerExperienceProps {
  cancerExperience: {
    diagnosis: string;
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  };
  setCancerExperience: React.Dispatch<React.SetStateAction<{
    diagnosis: string;
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
  const diagnosisOptions = [
    { value: 'Acute Myeloid Leukemia', label: 'Acute Myeloid Leukemia' },
    { value: 'Acute Lymphoid Leukemia', label: 'Acute Lymphoid Leukemia' },
    { value: 'Chronic Myeloid Leukemia', label: 'Chronic Myeloid Leukemia' },
    { value: 'Chronic Lymphoid Leukemia', label: 'Chronic Lymphoid Leukemia' },
    { value: 'Hodgkin Lymphoma', label: 'Hodgkin Lymphoma' },
    { value: 'Non-Hodgkin Lymphoma', label: 'Non-Hodgkin Lymphoma' },
    { value: 'Multiple Myeloma', label: 'Multiple Myeloma' },
  ];

  return (
    <Box bg="white" p={6}>
      <Heading 
        size="md" 
        mb={6} 
        color={veniceBlue} 
        fontFamily="'Open Sans', sans-serif"
        fontWeight={600}
      >
        Blood cancer experience information
      </Heading>
      
      <Stack gap={6}>
        <HStack gap={6} align="start">
          <ProfileDropdown
            label="Your Diagnosis"
            value={cancerExperience.diagnosis}
            onChange={(e) => setCancerExperience(prev => ({ ...prev, diagnosis: e.target.value }))}
            options={diagnosisOptions}
          />
          
          <ProfileTextInput
            label="Your Date of Diagnosis"
            value={cancerExperience.dateOfDiagnosis}
            onChange={(e) => setCancerExperience(prev => ({ ...prev, dateOfDiagnosis: e.target.value }))}
            placeholder="DD/MM/YYYY"
          />
        </HStack>

        <HStack gap={6} align="start">
          <Box flex="1">
            <Box
              w="580px"
              h="30px"
              fontSize="1rem"
              fontWeight={600}
              lineHeight="30px"
              letterSpacing="0%"
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              mb={4}
            >
              Treatments you have done
            </Box>
            <HStack>
              <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
                Chemotherapy
              </Text>
              <Button 
                size="sm" 
                bg={teal} 
                color="white" 
                onClick={onEditTreatments}
                fontFamily="'Open Sans', sans-serif"
                _hover={{ bg: "#044d4d" }}
              >
                Edit
              </Button>
            </HStack>
          </Box>
          
          <Box flex="1">
            <Box
              w="580px"
              h="30px"
              fontSize="1rem"
              fontWeight={600}
              lineHeight="30px"
              letterSpacing="0%"
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              mb={4}
            >
              Experiences you had
            </Box>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
                Brain Fog
              </Text>
              <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
                Fertility Issues
              </Text>
              <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
                Speaking to your family or friends about the diagnosis
              </Text>
              <Button 
                size="sm" 
                bg={teal} 
                color="white" 
                onClick={onEditExperiences}
                fontFamily="'Open Sans', sans-serif"
                _hover={{ bg: "#044d4d" }}
              >
                Edit
              </Button>
            </VStack>
          </Box>
        </HStack>
      </Stack>
    </Box>
  );
};

export default BloodCancerExperience; 