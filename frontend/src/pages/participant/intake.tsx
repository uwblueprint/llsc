import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { PersonalInfoForm } from '@/components/intake/personal-info-form';
import { DemographicCancerForm, BasicDemographicsForm } from '@/components/intake/demographic-cancer-form';
import { LovedOneForm } from '@/components/intake/loved-one-form';
import { ThankYouScreen } from '@/components/intake/thank-you-screen';
import { 
  COLORS, 
  IntakeFormData, 
  INITIAL_INTAKE_FORM_DATA,
  ExperienceData,
  PersonalData
} from '@/constants/form';

// Import the component data types
interface DemographicCancerFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  maritalStatus: string;
  hasKids: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  otherTreatment: string;
  experiences: string[];
  otherExperience: string;
}

interface LovedOneFormData {
  genderIdentity: string;
  genderIdentityCustom?: string;
  age: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  otherTreatment: string;
  experiences: string[];
  otherExperience: string;
}

interface BasicDemographicsFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  maritalStatus: string;
  hasKids: string;
}

export default function ParticipantIntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntakeFormData>({
    ...INITIAL_INTAKE_FORM_DATA,
    formType: 'participant'
  });

  // Determine flow based on experience type selections
  const getFlowSteps = () => {
    const { hasBloodCancer, caringForSomeone } = formData;
    
    if (hasBloodCancer === 'yes' && caringForSomeone === 'no') {
      // Flow 1: Participant - Cancer Patient
      return ['experience-personal', 'demographics-cancer', 'thank-you'];
    } else if (hasBloodCancer === 'no' && caringForSomeone === 'yes') {
      // Flow 2: Participant - Caregiver Without Cancer  
      return ['experience-personal', 'demographics-caregiver', 'loved-one', 'thank-you'];
    } else if (hasBloodCancer === 'yes' && caringForSomeone === 'yes') {
      // Flow 5: Participant - Caregiver with Cancer
      return ['experience-personal', 'demographics-cancer', 'loved-one', 'thank-you'];
    } else if (hasBloodCancer === 'no' && caringForSomeone === 'no') {
      // Flow 7: Participant - No Cancer Experience
      return ['experience-personal', 'demographics-basic', 'thank-you'];
    }
    
    // Default to first step if selections not made yet
    return ['experience-personal'];
  };

  const currentFlowSteps = getFlowSteps();
  const currentStepType = currentFlowSteps[currentStep - 1];

  const handleExperiencePersonalSubmit = (experienceData: ExperienceData, personalData: PersonalData) => {
    setFormData(prev => ({
      ...prev,
      hasBloodCancer: experienceData.hasBloodCancer,
      caringForSomeone: experienceData.caringForSomeone,
      personalInfo: personalData
    }));
    setCurrentStep(2);
  };

  const handleDemographicsNext = (data: DemographicCancerFormData) => {
    setFormData(prev => ({
      ...prev,
      demographics: {
        genderIdentity: data.genderIdentity,
        pronouns: data.pronouns,
        ethnicGroup: data.ethnicGroup,
        maritalStatus: data.maritalStatus,
        hasKids: data.hasKids,
      },
      // Add cancer experience if they have cancer
      ...(prev.hasBloodCancer === 'yes' && {
        cancerExperience: {
          diagnosis: data.diagnosis,
          dateOfDiagnosis: data.dateOfDiagnosis,
          treatments: data.treatments,
          experiences: data.experiences,
          otherTreatment: data.otherTreatment,
          otherExperience: data.otherExperience,
        }
      }),
      // Add caregiver experience if they're a caregiver without cancer
      ...(prev.hasBloodCancer === 'no' && prev.caringForSomeone === 'yes' && {
        caregiverExperience: {
          experiences: data.experiences,
          otherExperience: data.otherExperience,
        }
      })
    }));
    setCurrentStep(currentStep + 1);
  };

  const handleLovedOneNext = (data: LovedOneFormData) => {
    setFormData(prev => ({
      ...prev,
      lovedOne: {
        demographics: {
          genderIdentity: data.genderIdentity,
          genderIdentityCustom: data.genderIdentityCustom,
          age: data.age,
        },
        cancerExperience: {
          diagnosis: data.diagnosis,
          dateOfDiagnosis: data.dateOfDiagnosis,
          treatments: data.treatments,
          experiences: data.experiences,
          otherTreatment: data.otherTreatment,
          otherExperience: data.otherExperience,
        }
      }
    }));
    setCurrentStep(currentStep + 1);
  };

  const handleBasicDemographicsNext = (data: BasicDemographicsFormData) => {
    setFormData(prev => ({
      ...prev,
      demographics: {
        genderIdentity: data.genderIdentity,
        pronouns: data.pronouns,
        ethnicGroup: data.ethnicGroup,
        maritalStatus: data.maritalStatus,
        hasKids: data.hasKids,
      },
    }));
    setCurrentStep(currentStep + 1);
  };

  // If we're on thank you step, show the screen with form data
  if (currentStepType === 'thank-you') {
    return <ThankYouScreen formData={formData} />;
  }

  return (
    <Flex minH="100vh" bg={COLORS.lightGray} justify="center" py={12}>
      <Box
        w="full"
        maxW="1200px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={10}
      >
        {currentStepType === 'experience-personal' && (
          <PersonalInfoForm
            formType="participant"
            onSubmit={handleExperiencePersonalSubmit}
          />
        )}

        {currentStepType === 'demographics-cancer' && (
          <DemographicCancerForm 
            formType="participant"
            onNext={handleDemographicsNext} 
          />
        )}

        {currentStepType === 'demographics-caregiver' && (
          <DemographicCancerForm 
            formType="participant"
            onNext={handleDemographicsNext} 
          />
        )}

        {currentStepType === 'loved-one' && (
          <LovedOneForm 
            formType="participant"
            onSubmit={handleLovedOneNext} 
          />
        )}

        {currentStepType === 'demographics-basic' && (
          <BasicDemographicsForm 
            formType="participant"
            onNext={handleBasicDemographicsNext} 
          />
        )}
      </Box>
    </Flex>
  );
} 
