import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { PersonalInfoForm } from '@/components/intake/personal-info-form';
import { DemographicCancerForm } from '@/components/intake/demographic-cancer-form';
import { LovedOneForm } from '@/components/intake/loved-one-form';
import { ThankYouScreen } from '@/components/intake/thank-you-screen';
import { useIntakeForm } from '@/hooks/useIntakeForm';
import { COLORS } from '@/constants/form';

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    onSubmit,
  } = useIntakeForm();

  const handlePersonalInfoSubmit = async (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    try {
      // Validate and process the first form
      await handleSubmit(onSubmit)();
      // If no error is thrown, move to next step
      setCurrentStep(2);
    } catch (error) {
      // Form validation failed, stay on current step
      console.error('Form validation failed:', error);
    }
  };

  const handleMoveToLovedOne = () => {
    setCurrentStep(3);
  };

  const handleFinalSubmit = () => {
    // Show thank you screen instead of alert
    setCurrentStep(4);
  };

  // If we're on step 4, show the thank you screen without the form container
  if (currentStep === 4) {
    return <ThankYouScreen />;
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
        {currentStep === 1 && (
          <PersonalInfoForm
            control={control}
            errors={errors}
            onSubmit={handlePersonalInfoSubmit}
            isSubmitting={isSubmitting}
          />
        )}

<<<<<<< HEAD
        {currentStep === 2 && <DemographicCancerForm onNext={handleMoveToLovedOne} />}
=======
        {currentStep === 2 && (
          <DemographicCancerForm onNext={handleMoveToLovedOne} />
        )}
>>>>>>> 556ea5d5f87665ed303085d0bfb8b52051a1984a

        {currentStep === 3 && <LovedOneForm onSubmit={handleFinalSubmit} />}
      </Box>
    </Flex>
  );
}
