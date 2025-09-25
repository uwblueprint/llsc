import { UserIcon, WelcomeScreen, CheckMarkIcon } from '@/components/ui';
import { useState } from 'react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';
import { VolunteerProfileForm } from '@/components/intake/volunteer-profile-form';
import { VolunteerReferencesForm } from '@/components/intake/volunteer-references-form';

export default function SecondaryApplicationPage() {
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
          onNext={(data) => {
            setReferencesData(data);
            setCurrentStep(4);
          }}
          onBack={() => setCurrentStep(2)}
        />
      </Box>
    </Box>
  );

  const ThankYouScreen = () => (
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
        textAlign="center"
      >
        <VStack gap={6}>
          <CheckMarkIcon />

          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={2}
          >
            Success!
          </Heading>
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={4}
          >
            Thank you for sharing your references and experiences with us.
          </Heading>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
            maxW="600px"
            textAlign="center"
          >
            We will reach out in the next 5-7 business days with the next steps. For immediate help,
            please reach us at{' '}
            <Text as="span" color={COLORS.teal} fontWeight={500}>
              FirstConnections@lls.org
            </Text>
            . Please note LLSC&apos;s working days are Monday-Thursday.
          </Text>
        </VStack>
      </Box>
    </Box>
  );

  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      {(() => {
        switch (currentStep) {
          case 1:
            return <WelcomeScreenStep />;
          case 2:
            return <VolunteerProfileStep />;
          case 3:
            return <VolunteerReferencesStep />;
          case 4:
            return <ThankYouScreen />;
          default:
            return <WelcomeScreenStep />;
        }
      })()}
    </ProtectedPage>
  );
}
