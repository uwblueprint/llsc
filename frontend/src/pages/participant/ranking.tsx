import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react';
import { UserIcon, CheckMarkIcon, DragIcon, WelcomeScreen } from '@/components/ui';
import { VolunteerMatchingForm, VolunteerRankingForm } from '@/components/ranking';
import { COLORS } from '@/constants/form';

const RANKING_STATEMENTS = [
  'I would prefer a volunteer with the same age as me',
  'I would prefer a volunteer with the same diagnosis as me',
  'I would prefer a volunteer with the same marital status as me',
  'I would prefer a volunteer with the same ethnic or cultural group as me',
  'I would prefer a volunteer with the same parental status as me',
];

interface RankingFormData {
  selectedQualities: string[];
  rankedPreferences: string[];
}

export default function ParticipantRankingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RankingFormData>({
    selectedQualities: [],
    rankedPreferences: [...RANKING_STATEMENTS],
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
          <VolunteerMatchingForm
            selectedQualities={formData.selectedQualities}
            onQualityToggle={toggleQuality}
            onNext={() => setCurrentStep(3)}
          />
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
          <VolunteerRankingForm
            rankedPreferences={formData.rankedPreferences}
            onMoveItem={moveItem}
            onSubmit={() => setCurrentStep(4)}
          />
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
