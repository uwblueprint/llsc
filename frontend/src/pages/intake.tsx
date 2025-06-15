import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { PersonalInfoForm } from '@/components/intake/personal-info-form';
import { DemographicCancerForm } from '@/components/intake/demographic-cancer-form';
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

  const handleBackToPersonalInfo = () => {
    setCurrentStep(1);
  };

  const handleFinalSubmit = () => {
    alert('All forms completed successfully!');
    // Handle final submission or navigation
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
        {currentStep === 1 && (
          <PersonalInfoForm
            control={control}
            errors={errors}
            onSubmit={handlePersonalInfoSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === 2 && (
          <DemographicCancerForm onBack={handleBackToPersonalInfo} onNext={handleFinalSubmit} />
        )}
      </Box>
    </Flex>
  );
}
