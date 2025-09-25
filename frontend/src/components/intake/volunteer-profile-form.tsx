import React, { useState } from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Textarea } from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { COLORS } from '@/constants/form';

interface VolunteerProfileFormData {
  experience: string;
}

interface VolunteerProfileFormProps {
  onNext: (data: VolunteerProfileFormData) => void;
  onBack?: () => void;
}

export function VolunteerProfileForm({ onNext, onBack }: VolunteerProfileFormProps) {
  const [wordCount, setWordCount] = useState(0);
  const maxWords = 300;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<VolunteerProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      experience: '',
    },
  });

  const experienceValue = watch('experience');

  // Count words in real-time with more accurate word counting
  React.useEffect(() => {
    if (!experienceValue || experienceValue.trim() === '') {
      setWordCount(0);
      return;
    }

    // More accurate word counting: split on whitespace and filter out empty strings
    const words = experienceValue
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0 && word.match(/\S/));

    setWordCount(words.length);
  }, [experienceValue]);

  const onSubmit = (data: VolunteerProfileFormData) => {
    onNext(data);
  };

  const isOverLimit = wordCount > maxWords;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontSize="28px"
        mb={8}
      >
        Volunteer Profile Form
      </Heading>

      {/* Progress Bar */}
      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      {/* Your Experience Section */}
      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Your Experience
        </Heading>

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14px"
          color={COLORS.fieldGray}
          mb={6}
        >
          This information will serve as your biography and will encourage potential matches to
          speak with you.
        </Text>

        <VStack gap={5} align="stretch">
          <Box>
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              fontSize="14px"
              color={COLORS.veniceBlue}
              mb={2}
            >
              Tell us about yourself: include your age, diagnosis and treatments. Include personal
              details like if you're married or have kids, what you struggled with at diagnosis
              and/or treatment, and how you are doing now.
            </Text>

            <Controller
              name="experience"
              control={control}
              rules={{
                required: 'Please tell us about your experience',
                validate: (value) => {
                  if (!value || value.trim() === '') {
                    return 'Please tell us about your experience';
                  }

                  // Use the same accurate word counting logic as the display
                  const words = value
                    .trim()
                    .split(/\s+/)
                    .filter((word) => word.length > 0 && word.match(/\S/));

                  if (words.length > maxWords) {
                    return `Please limit your response to ${maxWords} words`;
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <Box position="relative">
                  <Textarea
                    {...field}
                    placeholder="Type here...."
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={COLORS.veniceBlue}
                    borderColor={errors.experience ? 'red.500' : '#d1d5db'}
                    borderRadius="6px"
                    minH="200px"
                    resize="vertical"
                    border="1px solid"
                    px={3}
                    py={3}
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{
                      borderColor: COLORS.teal,
                      boxShadow: `0 0 0 3px ${COLORS.teal}20`,
                    }}
                  />
                  <Text
                    position="absolute"
                    bottom="8px"
                    right="12px"
                    fontSize="12px"
                    color={isOverLimit ? 'red.500' : COLORS.fieldGray}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    pointerEvents="none"
                  >
                    {wordCount}/{maxWords} words
                  </Text>
                </Box>
              )}
            />
            {errors.experience && (
              <Text color="red.500" fontSize="12px" mt={2}>
                {errors.experience.message}
              </Text>
            )}
          </Box>
        </VStack>
      </Box>

      {/* Navigation Buttons */}
      <HStack justify="space-between" mt={8}>
        {onBack ? (
          <Button
            onClick={onBack}
            variant="outline"
            borderColor={COLORS.teal}
            color={COLORS.teal}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            fontSize="14px"
            h="40px"
            px={6}
            _hover={{
              bg: `${COLORS.teal}10`,
            }}
          >
            Back
          </Button>
        ) : (
          <Box />
        )}

        <Button
          type="submit"
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          disabled={!isValid || isOverLimit}
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Next Section →
        </Button>
      </HStack>
    </form>
  );
}
