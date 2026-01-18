import { UserIcon, WelcomeScreen } from '@/components/ui';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { FormStatus, UserRole } from '@/types/authTypes';
import { FormPageLayout } from '@/components/layout';
import { VolunteerProfileForm } from '@/components/intake/volunteer-profile-form';
import { VolunteerReferencesForm } from '@/components/intake/volunteer-references-form';
import { syncCurrentUser } from '@/APIClients/authAPIClient';
import baseAPIClient from '@/APIClients/baseAPIClient';

export default function SecondaryApplicationPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<{ experience: string }>({ experience: '' });
  const [referencesData, setReferencesData] = useState<{
    reference1: { fullName: string; email: string; phoneNumber: string };
    reference2: { fullName: string; email: string; phoneNumber: string };
    additionalInfo: string;
  }>({
    reference1: { fullName: '', email: '', phoneNumber: '' },
    reference2: { fullName: '', email: '', phoneNumber: '' },
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitSecondaryApplication = async (
    profile: { experience: string },
    references: {
      reference1: { fullName: string; email: string; phoneNumber: string };
      reference2: { fullName: string; email: string; phoneNumber: string };
      additionalInfo: string;
    },
  ) => {
    const payload = {
      experience: profile.experience,
      references_json: JSON.stringify([
        {
          fullName: references.reference1.fullName,
          email: references.reference1.email,
          phoneNumber: references.reference1.phoneNumber,
        },
        {
          fullName: references.reference2.fullName,
          email: references.reference2.email,
          phoneNumber: references.reference2.phoneNumber,
        },
      ]),
      additional_comments: references.additionalInfo,
    };

    await baseAPIClient.post('/volunteer-data/submit', payload);
  };

  const WelcomeScreenStep = () => (
    <WelcomeScreen
      icon={<UserIcon />}
      title={t('letsSetupProfile')}
      description={t('experienceSharedWithMatches')}
      onContinue={() => setCurrentStep(2)}
    />
  );

  const VolunteerProfileStep = () => (
    <FormPageLayout maxW="800px">
      <VolunteerProfileForm
        onNext={(data) => {
          setProfileData(data);
          setCurrentStep(3);
        }}
        onBack={() => setCurrentStep(1)}
      />
    </FormPageLayout>
  );

  const VolunteerReferencesStep = () => (
    <FormPageLayout maxW="800px">
      <VolunteerReferencesForm
        onNext={async (data) => {
          setSubmitError(null);
          setIsSubmitting(true);
          setReferencesData(data);

          try {
            await submitSecondaryApplication(profileData, data);
            await syncCurrentUser();
            await router.replace('/volunteer/secondary-application/thank-you');
          } catch (error) {
            const message =
              (error as any)?.response?.data?.detail ||
              (error instanceof Error ? error.message : t('failedToSubmitVolunteerData'));
            setSubmitError(message);
          } finally {
            setIsSubmitting(false);
          }
        }}
        onBack={() => setCurrentStep(2)}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </FormPageLayout>
  );

  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.SECONDARY_APPLICATION_TODO]}>
        {(() => {
          switch (currentStep) {
            case 1:
              return <WelcomeScreenStep />;
            case 2:
              return <VolunteerProfileStep />;
            case 3:
              return <VolunteerReferencesStep />;
            default:
              return <WelcomeScreenStep />;
          }
        })()}
      </FormStatusGuard>
    </ProtectedPage>
  );
}
