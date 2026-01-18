import React, { useMemo, useState } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiChevronLeft } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { syncCurrentUser } from '@/APIClients/authAPIClient';
import { PersonalInfoForm } from '@/components/intake/personal-info-form';
import {
  DemographicCancerForm,
  BasicDemographicsForm,
} from '@/components/intake/demographic-cancer-form';
import { LovedOneForm } from '@/components/intake/loved-one-form';
import { AdditionalInfoForm } from '@/components/intake/additional-info-form';
import { FormPageLayout } from '@/components/layout';
import {
  IntakeFormData,
  INITIAL_INTAKE_FORM_DATA,
  ExperienceData,
  PersonalData,
} from '@/constants/form';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatus, UserRole } from '@/types/authTypes';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';

interface DemographicCancerFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  maritalStatus: string;
  hasKids: string;
  timezone: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
  preferredLanguage: string;
}

interface LovedOneFormData {
  genderIdentity: string;
  genderIdentityCustom?: string;
  age: string;
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
}

interface BasicDemographicsFormData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  maritalStatus: string;
  hasKids: string;
  timezone: string;
  preferredLanguage: string;
}

interface AdditionalInfoFormData {
  additionalInfo: string;
}

export default function BecomeVolunteerPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntakeFormData>({
    ...INITIAL_INTAKE_FORM_DATA,
    formType: 'become_volunteer',
  });
  const [, setSubmitting] = useState(false);
  const [hasDropdownOpen, setHasDropdownOpen] = useState(false);

  const computeFlowSteps = (data: IntakeFormData) => {
    const { hasBloodCancer, caringForSomeone } = data;
    if (hasBloodCancer === 'yes' && caringForSomeone === 'no') {
      return ['experience-personal', 'demographics-cancer', 'additional-info', 'thank-you'];
    }
    if (hasBloodCancer === 'no' && caringForSomeone === 'yes') {
      return [
        'experience-personal',
        'demographics-caregiver',
        'loved-one',
        'additional-info',
        'thank-you',
      ];
    }
    if (hasBloodCancer === 'yes' && caringForSomeone === 'yes') {
      return [
        'experience-personal',
        'demographics-cancer',
        'loved-one',
        'additional-info',
        'thank-you',
      ];
    }
    if (hasBloodCancer === 'no' && caringForSomeone === 'no') {
      return ['experience-personal', 'demographics-basic', 'additional-info', 'thank-you'];
    }
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
        await baseAPIClient.post('/intake/submissions', { answers: updated });
        await syncCurrentUser();
        await router.replace('/participant/become-volunteer/thank-you');
        return;
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
        language: data.preferredLanguage as 'en' | 'fr',
        demographics: {
          genderIdentity: data.genderIdentity,
          pronouns: data.pronouns,
          ethnicGroup: data.ethnicGroup,
          preferredLanguage: data.preferredLanguage,
          maritalStatus: data.maritalStatus,
          hasKids: data.hasKids,
          timezone: data.timezone,
        },
        ...(prev.hasBloodCancer === 'yes' && {
          cancerExperience: {
            diagnosis: data.diagnosis,
            dateOfDiagnosis: data.dateOfDiagnosis,
            treatments: data.treatments,
            experiences: data.experiences,
          },
        }),
        ...(prev.hasBloodCancer === 'no' &&
          prev.caringForSomeone === 'yes' && {
            caregiverExperience: {
              experiences: data.experiences,
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
        language: data.preferredLanguage as 'en' | 'fr',
        demographics: {
          genderIdentity: data.genderIdentity,
          pronouns: data.pronouns,
          ethnicGroup: data.ethnicGroup,
          preferredLanguage: data.preferredLanguage,
          maritalStatus: data.maritalStatus,
          hasKids: data.hasKids,
          timezone: data.timezone,
        },
      };
      void advanceAfterUpdate(updated);
      return updated;
    });
  };

  const handleAdditionalInfoNext = (data: AdditionalInfoFormData) => {
    setFormData((prev) => {
      const updated: IntakeFormData = {
        ...prev,
        additionalInfo: data.additionalInfo,
      };
      void advanceAfterUpdate(updated);
      return updated;
    });
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <FormPageLayout hasDropdownOpen={hasDropdownOpen}>
          <Flex
            align="center"
            gap={2}
            cursor="pointer"
            onClick={() => {
              void router.push('/participant/dashboard');
            }}
            alignSelf="flex-start"
            color="brand.navy"
            fontSize="16px"
            fontWeight={600}
            fontFamily="'Open Sans', sans-serif"
            lineHeight="1.25em"
            mb={6}
          >
            <FiChevronLeft size={20} />
            <Text>{t('back')}</Text>
          </Flex>

          {currentStepType === 'experience-personal' && (
            <PersonalInfoForm
              formType="become_volunteer"
              onSubmit={handleExperiencePersonalSubmit}
              onDropdownOpenChange={setHasDropdownOpen}
            />
          )}

          {currentStepType === 'demographics-cancer' && (
            <DemographicCancerForm
              formType="become_volunteer"
              onNext={handleDemographicsNext}
              hasBloodCancer={formData.hasBloodCancer}
              caringForSomeone={formData.caringForSomeone}
            />
          )}

          {currentStepType === 'demographics-caregiver' && (
            <DemographicCancerForm
              formType="become_volunteer"
              onNext={handleDemographicsNext}
              hasBloodCancer={formData.hasBloodCancer}
              caringForSomeone={formData.caringForSomeone}
            />
          )}

          {currentStepType === 'loved-one' && (
            <LovedOneForm formType="become_volunteer" onSubmit={handleLovedOneNext} />
          )}

          {currentStepType === 'demographics-basic' && (
            <BasicDemographicsForm
              formType="become_volunteer"
              onNext={handleBasicDemographicsNext}
            />
          )}

          {currentStepType === 'additional-info' && (
            <AdditionalInfoForm formType="become_volunteer" onSubmit={handleAdditionalInfoNext} />
          )}
        </FormPageLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
