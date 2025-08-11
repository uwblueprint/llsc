import React, { useState } from 'react';
import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { UserIcon, CheckMarkIcon, WelcomeScreen } from '@/components/ui';
import { VolunteerMatchingForm, VolunteerRankingForm, CaregiverMatchingForm, CaregiverQualitiesForm, CaregiverRankingForm, CaregiverTwoColumnQualitiesForm } from '@/components/ranking';
import { COLORS } from '@/constants/form';

const RANKING_STATEMENTS = [
  'I would prefer a volunteer with the same age as me',
  'I would prefer a volunteer with the same diagnosis as me',
  'I would prefer a volunteer with the same marital status as me',
  'I would prefer a volunteer with the same ethnic or cultural group as me',
  'I would prefer a volunteer with the same parental status as me',
];

const CAREGIVER_RANKING_STATEMENTS = [
  'I would prefer a volunteer with the same age as my loved one',
  'I would prefer a volunteer with the same diagnosis as my loved one',
  'I would prefer a volunteer with experience with Relapse',
  'I would prefer a volunteer with experience with Anxiety / Depression',
  'I would prefer a volunteer with experience with returning to school or work during/after treatment',
];

interface RankingFormData {
  selectedQualities: string[];
  rankedPreferences: string[];
  volunteerType?: string;
  isCaregiverVolunteerFlow?: boolean;
}

interface ParticipantRankingPageProps {
  participantType?: 'cancerPatient' | 'caregiver';
  caregiverHasCancer?: boolean;
}

export default function ParticipantRankingPage({ 
  participantType = 'caregiver',
  caregiverHasCancer = true,
}: ParticipantRankingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RankingFormData>({
    selectedQualities: [],
    rankedPreferences: participantType === 'caregiver' ? [...CAREGIVER_RANKING_STATEMENTS] : [...RANKING_STATEMENTS],
    volunteerType: participantType === 'caregiver' ? '' : undefined,
    isCaregiverVolunteerFlow: undefined,
  });

  const WelcomeScreenStep = () => (
    <WelcomeScreen
      icon={<UserIcon />}
      title="Welcome to the Peer Support Program!"
      description="Let's begin by selecting<br />your preferences in a volunteer."
      onContinue={() => setCurrentStep(2)}
    />
  );

  const QualitiesScreen = () => {
    const toggleQuality = (quality: string) => {
      setFormData(prev => ({
        ...prev,
        selectedQualities: prev.selectedQualities.includes(quality)
          ? prev.selectedQualities.filter(q => q !== quality)
          : prev.selectedQualities.length < 5 
            ? [...prev.selectedQualities, quality]
            : prev.selectedQualities
      }));
    };

    const handleVolunteerTypeChange = (type: string) => {
      setFormData(prev => ({
        ...prev,
        volunteerType: type,
        // Derive explicit flow flag to avoid any async state timing issues
        isCaregiverVolunteerFlow: type === 'caringForLovedOne',
      }));
    };

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
          {participantType === 'caregiver' ? (
            <CaregiverMatchingForm
              volunteerType={formData.volunteerType || ''}
              onVolunteerTypeChange={handleVolunteerTypeChange}
              onNext={(type) => {
                // Ensure state is set before navigating
                setFormData(prev => ({
                  ...prev,
                  volunteerType: type,
                  isCaregiverVolunteerFlow: type === 'caringForLovedOne',
                }));
                setCurrentStep(3);
              }}
            />
          ) : (
            <VolunteerMatchingForm
              selectedQualities={formData.selectedQualities}
              onQualityToggle={toggleQuality}
              onNext={() => {
                // Build ranking list from selected qualities
                setFormData(prev => ({ ...prev, rankedPreferences: [...prev.selectedQualities] }));
                setCurrentStep(3);
              }}
            />
          )}
        </Box>
      </Flex>
    );
  };

  const CaregiverQualitiesScreen = () => {
    const toggleQuality = (quality: string) => {
      setFormData(prev => ({
        ...prev,
        selectedQualities: prev.selectedQualities.includes(quality)
          ? prev.selectedQualities.filter(q => q !== quality)
          : prev.selectedQualities.length < 5 
            ? [...prev.selectedQualities, quality]
            : prev.selectedQualities
      }));
    };

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
          {(
            // Prefer explicit flag; otherwise infer from value
            (formData.isCaregiverVolunteerFlow ?? false) ||
            (formData.volunteerType === 'caringForLovedOne') ||
            // Fallback: any non-similarDiagnosis value implies the loved-one flow
            (!!formData.volunteerType && formData.volunteerType !== 'similarDiagnosis')
          ) ? (
            <CaregiverTwoColumnQualitiesForm
              selectedQualities={formData.selectedQualities}
              onQualityToggle={toggleQuality}
              onNext={() => {
                setFormData(prev => ({ ...prev, rankedPreferences: [...prev.selectedQualities] }));
                setCurrentStep(4);
              }}
            />
          ) : caregiverHasCancer ? (
            formData.volunteerType === 'similarDiagnosis' ? (
              <CaregiverQualitiesForm
                selectedQualities={formData.selectedQualities}
                onQualityToggle={toggleQuality}
                onNext={() => {
                  setFormData(prev => ({ ...prev, rankedPreferences: [...prev.selectedQualities] }));
                  setCurrentStep(4);
                }}
              />
            ) : (
              <VolunteerMatchingForm
                selectedQualities={formData.selectedQualities}
                onQualityToggle={toggleQuality}
                onNext={() => {
                  setFormData(prev => ({ ...prev, rankedPreferences: [...prev.selectedQualities] }));
                  setCurrentStep(4);
                }}
              />
            )
          ) : (
            <CaregiverQualitiesForm
              selectedQualities={formData.selectedQualities}
              onQualityToggle={toggleQuality}
              onNext={() => {
                setFormData(prev => ({ ...prev, rankedPreferences: [...prev.selectedQualities] }));
                setCurrentStep(4);
              }}
            />
          )}
        </Box>
      </Flex>
    );
  };

  const RankingScreen = () => {
    const moveItem = (fromIndex: number, toIndex: number) => {
      setFormData(prev => {
        const newRanked = [...prev.rankedPreferences];
        const [movedItem] = newRanked.splice(fromIndex, 1);
        newRanked.splice(toIndex, 0, movedItem);
        return { ...prev, rankedPreferences: newRanked };
      });
    };

    const nextStep = (participantType === 'caregiver') ? 5 : 4;

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
          {participantType === 'caregiver' ? (
            <CaregiverRankingForm
              rankedPreferences={formData.rankedPreferences}
              onMoveItem={moveItem}
              onSubmit={() => setCurrentStep(nextStep)}
            />
          ) : (
            <VolunteerRankingForm
              rankedPreferences={formData.rankedPreferences}
              onMoveItem={moveItem}
              onSubmit={() => setCurrentStep(nextStep)}
            />
          )}
        </Box>
      </Flex>
    );
  };

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
            Thank you for sharing your experience and
          </Heading>
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={4}
          >
            preferences with us.
          </Heading>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
            maxW="600px"
            textAlign="center"
          >
            We are reviewing which volunteers would best fit those preferences. You will receive an email from us in the next 1-2 business days with the next steps. If you would like to connect with a LLSC staff before then, please reach out to{' '}
            <Text as="span" color={COLORS.teal} fontWeight={500}>
              FirstConnections@lls.org
            </Text>
            .
          </Text>
        </VStack>
      </Box>
    </Box>
  );

  if (participantType === 'caregiver') {
    switch (currentStep) {
      case 1:
        return <WelcomeScreenStep />;
      case 2:
        return <QualitiesScreen />;
      case 3:
        return <CaregiverQualitiesScreen />;
      case 4:
        return <RankingScreen />;
      case 5:
        return <ThankYouScreen />;
      default:
        return <WelcomeScreenStep />;
    }
  } else {
    switch (currentStep) {
      case 1:
        return <WelcomeScreenStep />;
      case 2:
        return <QualitiesScreen />;
      case 3:
        return <RankingScreen />;
      case 4:
        return <ThankYouScreen />;
      default:
        return <WelcomeScreenStep />;
    }
  }
}
