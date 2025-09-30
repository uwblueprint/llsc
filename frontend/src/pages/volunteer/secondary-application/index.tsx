import { UserIcon, WelcomeScreen } from '@/components/ui';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { FormStatus, UserRole } from '@/types/authTypes';
import { Box } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';
import { VolunteerProfileForm } from '@/components/intake/volunteer-profile-form';
import { VolunteerReferencesForm } from '@/components/intake/volunteer-references-form';
import { syncCurrentUser } from '@/APIClients/authAPIClient';

export default function SecondaryApplicationPage() {
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

  const WelcomeScreenStep = () => (
    <WelcomeScreen
      icon={<UserIcon />}
      title="Let's setup your public volunteer profile"
      description="Your experience provided in this form will be shared with potential matches."
      onContinue={() => setCurrentStep(2)}
    />
  );

  const VolunteerProfileStep = () => (
    <Box
      minH="100vh"
      bg={COLORS.lightGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      <Box
        w="full"
        maxW="800px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
      >
        <VolunteerProfileForm
          onNext={(data) => {
            setProfileData(data);
            setCurrentStep(3);
          }}
          onBack={() => setCurrentStep(1)}
        />
      </Box>
    </Box>
  );

  const VolunteerReferencesStep = () => (
    <Box
      minH="100vh"
      bg={COLORS.lightGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      <Box
        w="full"
        maxW="800px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
      >
        <VolunteerReferencesForm
          onNext={async (data) => {
            setReferencesData(data);
            setCurrentStep(4);
            await syncCurrentUser();
            await router.replace('/volunteer/secondary-application/thank-you');
          }}
          onBack={() => setCurrentStep(2)}
        />
      </Box>
    </Box>
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
