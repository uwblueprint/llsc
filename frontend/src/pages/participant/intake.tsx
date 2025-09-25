import React, { useMemo, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { PersonalInfoForm } from '@/components/intake/personal-info-form';
import {
  DemographicCancerForm,
  BasicDemographicsForm,
} from '@/components/intake/demographic-cancer-form';
import { LovedOneForm } from '@/components/intake/loved-one-form';
import { ThankYouScreen } from '@/components/intake/thank-you-screen';
import {
  COLORS,
  IntakeFormData,
  INITIAL_INTAKE_FORM_DATA,
  ExperienceData,
  PersonalData,
} from '@/constants/form';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';

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
    formType: 'participant',
  });
  const [, setSubmitting] = useState(false);

  const computeFlowSteps = (data: IntakeFormData) => {
    const { hasBloodCancer, caringForSomeone } = data;
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

  const currentFlowSteps = useMemo(() => computeFlowSteps(formData), [formData]);
  const currentStepType = currentFlowSteps[currentStep - 1];

  const advanceAfterUpdate = async (updated: IntakeFormData) => {
    const steps = computeFlowSteps(updated);
    const nextType = steps[currentStep];
    if (nextType === 'thank-you') {
      setSubmitting(true);
      try {
        console.log('[INTAKE][SUBMIT] About to submit answers', {
          currentStep,
          nextType,
          answers: updated,
        });
        await baseAPIClient.post('/intake/submissions', { answers: updated });
      } finally {
        setSubmitting(false);
      }
    }
    setCurrentStep((s) => s + 1);
  };

  const handleExperiencePersonalSubmit = (
    experienceData: ExperienceData,
    personalData: PersonalData,
  ) => {
    setFormData((prev) => ({
      ...prev,
      hasBloodCancer: experienceData.hasBloodCancer,
      caringForSomeone: experienceData.caringForSomeone,
      personalInfo: personalData,
    }));
    setCurrentStep(2);
  };

  const handleDemographicsNext = (data: DemographicCancerFormData) => {
    setFormData((prev) => {
      const updated: IntakeFormData = {
        ...prev,
        demographics: {
          genderIdentity: data.genderIdentity,
          pronouns: data.pronouns,
          ethnicGroup: data.ethnicGroup,
          maritalStatus: data.maritalStatus,
          hasKids: data.hasKids,
        },
        ...(prev.hasBloodCancer === 'yes' && {
          cancerExperience: {
            diagnosis: data.diagnosis,
            dateOfDiagnosis: data.dateOfDiagnosis,
            treatments: data.treatments,
            experiences: data.experiences,
            otherTreatment: data.otherTreatment,
            otherExperience: data.otherExperience,
          },
        }),
        ...(prev.hasBloodCancer === 'no' &&
          prev.caringForSomeone === 'yes' && {
          caregiverExperience: {
            experiences: data.experiences,
            otherExperience: data.otherExperience,
          },
        }),
      } as IntakeFormData;

      void advanceAfterUpdate(updated);
      return updated;
    });
  };

  const handleLovedOneNext = (data: LovedOneFormData) => {
    setFormData((prev) => {
      const updated: IntakeFormData = {
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
          },
        },
      };

      void advanceAfterUpdate(updated);
      return updated;
    });
  };

  const handleBasicDemographicsNext = (data: BasicDemographicsFormData) => {
    setFormData((prev) => {
      const updated: IntakeFormData = {
        ...prev,
        demographics: {
          genderIdentity: data.genderIdentity,
          pronouns: data.pronouns,
          ethnicGroup: data.ethnicGroup,
          maritalStatus: data.maritalStatus,
          hasKids: data.hasKids,
        },
      };
      void advanceAfterUpdate(updated);
      return updated;
    });
  };

  // If we're on thank you step, show the screen with form data
  if (currentStepType === 'thank-you') {
    return (
      <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
        <ThankYouScreen />
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
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
            <PersonalInfoForm formType="participant" onSubmit={handleExperiencePersonalSubmit} />
          )}

          {currentStepType === 'demographics-cancer' && (
            <DemographicCancerForm formType="participant" onNext={handleDemographicsNext} hasBloodCancer={formData.hasBloodCancer} caringForSomeone={formData.caringForSomeone} />
          )}

          {currentStepType === 'demographics-caregiver' && (
            <DemographicCancerForm formType="participant" onNext={handleDemographicsNext} hasBloodCancer={formData.hasBloodCancer} caringForSomeone={formData.caringForSomeone} />
          )}

          {currentStepType === 'loved-one' && (
            <LovedOneForm formType="participant" onSubmit={handleLovedOneNext} hasBloodCancer={formData.hasBloodCancer} caringForSomeone={formData.caringForSomeone} />
          )}

          {currentStepType === 'demographics-basic' && (
            <BasicDemographicsForm formType="participant" onNext={handleBasicDemographicsNext} />
          )}
        </Box>
      </Flex>
    </ProtectedPage>
  );
}
