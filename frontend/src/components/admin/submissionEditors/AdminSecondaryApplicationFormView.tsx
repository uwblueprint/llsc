/**
 * AdminSecondaryApplicationFormView - Admin-facing secondary application form viewer
 *
 * This component displays the volunteer secondary application form data with all
 * sections stacked vertically on one scrollable page (no pagination).
 */

import React, { useEffect, useState } from 'react';
import { VStack, Text, Textarea, Box, Input } from '@chakra-ui/react';
import { COLORS as FORM_COLORS } from '@/constants/form';
import { COLORS as UI_COLORS } from '@/constants/colors';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import {
  VolunteerFormAnswers,
  VolunteerReference,
  normalizeIntakeAnswers,
} from '@/utils/adminFormHelpers/intake';
import { SectionCard } from './SectionCard';

interface AdminSecondaryApplicationFormViewProps {
  initialAnswers: VolunteerFormAnswers;
  onChange?: (answers: VolunteerFormAnswers, hasChanges: boolean) => void;
}

export const AdminSecondaryApplicationFormView: React.FC<
  AdminSecondaryApplicationFormViewProps
> = ({ initialAnswers, onChange }) => {
  const [formData, setFormData] = useState<VolunteerFormAnswers>(() =>
    normalizeIntakeAnswers(initialAnswers),
  );
  const [baselineData, setBaselineData] = useState<VolunteerFormAnswers>(() =>
    normalizeIntakeAnswers(initialAnswers),
  );

  useEffect(() => {
    const normalized = normalizeIntakeAnswers(initialAnswers);
    setFormData(normalized);
    setBaselineData(normalized);
  }, [initialAnswers]);

  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(baselineData);
    onChange?.(formData, dirty);
  }, [formData, baselineData, onChange]);

  const handleReferenceChange = (
    referenceKey: 'reference1' | 'reference2',
    field: keyof VolunteerReference,
    value: string,
  ) => {
    setFormData((prev) => {
      const existing = prev.volunteerReferences || {
        reference1: {},
        reference2: {},
        additionalInfo: '',
      };
      return {
        ...prev,
        volunteerReferences: {
          ...existing,
          [referenceKey]: {
            ...(existing[referenceKey] || {}),
            [field]: value,
          },
        },
      };
    });
  };

  const handleReferenceNotesChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      volunteerReferences: {
        reference1: { ...(prev.volunteerReferences?.reference1 || {}) },
        reference2: { ...(prev.volunteerReferences?.reference2 || {}) },
        additionalInfo: value,
      },
    }));
  };

  const handleExperienceChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      volunteerExperience: value,
    }));
  };

  const wordCount = (formData.volunteerExperience || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const MAX_WORDS = 300;

  return (
    <VStack align="stretch" gap="10" maxW="900px" mx="auto" width="100%">
      {/* Your Experience Section */}
      <SectionCard title="Your Experience">
        <VStack align="stretch" gap={4}>
          <Text color={FORM_COLORS.fieldGray} fontFamily="'Open Sans', sans-serif" fontSize="15px">
            This information will serve as your biography to be shared with potential matches.
          </Text>
          <FormField label="Tell us your story behind your diagnosis:">
            <Textarea
              bg={UI_COLORS.white}
              border="1px solid"
              borderColor={UI_COLORS.gray300}
              borderRadius="8px"
              minH="240px"
              p={4}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              placeholder="Type here...."
              _placeholder={{ color: FORM_COLORS.fieldGray }}
              _hover={{ borderColor: UI_COLORS.gray300 }}
              _focus={{
                borderColor: FORM_COLORS.teal,
                boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                outline: 'none',
              }}
              value={formData.volunteerExperience || ''}
              onChange={(e) => {
                const newText = e.target.value;
                const newWordCount =
                  newText.trim() === ''
                    ? 0
                    : newText
                        .trim()
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length;

                if (newWordCount <= MAX_WORDS) {
                  handleExperienceChange(newText);
                } else {
                  // If exceeding word limit, trim to exactly MAX_WORDS
                  const words = newText
                    .trim()
                    .split(/\s+/)
                    .filter((word) => word.length > 0);
                  const trimmedText = words.slice(0, MAX_WORDS).join(' ');
                  handleExperienceChange(trimmedText);
                }
              }}
            />
            <Text
              fontSize="14px"
              color={wordCount >= MAX_WORDS ? 'red.500' : FORM_COLORS.fieldGray}
              textAlign="right"
              mt={2}
            >
              {wordCount}/{MAX_WORDS} words
            </Text>
          </FormField>
        </VStack>
      </SectionCard>

      {/* References Section */}
      <SectionCard title="References">
        <VStack align="stretch" gap={6}>
          <Text color={FORM_COLORS.fieldGray} fontFamily="'Open Sans', sans-serif" fontSize="15px">
            These references will be used to confirm your alignment with the program.
          </Text>

          {/* Reference 1 */}
          <Box
            border="1px solid"
            borderColor={UI_COLORS.gray300}
            borderRadius="16px"
            p="24px"
            bg="#f9fafb"
          >
            <Text
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              color={UI_COLORS.veniceBlue}
              fontSize="18px"
              mb={4}
            >
              Reference 1
            </Text>
            <VStack align="stretch" gap={4}>
              <FormField label="Full Name">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    placeholder="Full name"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference1?.fullName || ''}
                    onChange={(e) =>
                      handleReferenceChange('reference1', 'fullName', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
              <FormField label="Email">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    type="email"
                    placeholder="Email"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference1?.email || ''}
                    onChange={(e) => handleReferenceChange('reference1', 'email', e.target.value)}
                  />
                </InputGroup>
              </FormField>
              <FormField label="Phone Number">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    placeholder="Phone number"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference1?.phoneNumber || ''}
                    onChange={(e) =>
                      handleReferenceChange('reference1', 'phoneNumber', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
            </VStack>
          </Box>

          {/* Reference 2 */}
          <Box
            border="1px solid"
            borderColor={UI_COLORS.gray300}
            borderRadius="16px"
            p="24px"
            bg="#f9fafb"
          >
            <Text
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              color={UI_COLORS.veniceBlue}
              fontSize="18px"
              mb={4}
            >
              Reference 2
            </Text>
            <VStack align="stretch" gap={4}>
              <FormField label="Full Name">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    placeholder="Full name"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference2?.fullName || ''}
                    onChange={(e) =>
                      handleReferenceChange('reference2', 'fullName', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
              <FormField label="Email">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    type="email"
                    placeholder="Email"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference2?.email || ''}
                    onChange={(e) => handleReferenceChange('reference2', 'email', e.target.value)}
                  />
                </InputGroup>
              </FormField>
              <FormField label="Phone Number">
                <InputGroup>
                  <Input
                    bg={UI_COLORS.white}
                    border="1px solid"
                    borderColor={UI_COLORS.gray300}
                    borderRadius="8px"
                    h="44px"
                    px={4}
                    fontSize="16px"
                    fontFamily="'Open Sans', sans-serif"
                    placeholder="Phone number"
                    _placeholder={{ color: FORM_COLORS.fieldGray }}
                    _hover={{ borderColor: UI_COLORS.gray300 }}
                    _focus={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                      outline: 'none',
                    }}
                    value={formData.volunteerReferences?.reference2?.phoneNumber || ''}
                    onChange={(e) =>
                      handleReferenceChange('reference2', 'phoneNumber', e.target.value)
                    }
                  />
                </InputGroup>
              </FormField>
            </VStack>
          </Box>

          {/* Additional information about references */}
          <Box mt={2}>
            <FormField label="Anything else to share?">
              <Textarea
                bg={UI_COLORS.white}
                border="1px solid"
                borderColor={UI_COLORS.gray300}
                borderRadius="8px"
                minH="120px"
                p={4}
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                placeholder="Type here...."
                _placeholder={{ color: FORM_COLORS.fieldGray }}
                _hover={{ borderColor: UI_COLORS.gray300 }}
                _focus={{
                  borderColor: FORM_COLORS.teal,
                  boxShadow: `0 0 0 1px ${FORM_COLORS.teal}`,
                  outline: 'none',
                }}
                value={formData.volunteerReferences?.additionalInfo || ''}
                onChange={(e) => handleReferenceNotesChange(e.target.value)}
              />
            </FormField>
          </Box>
        </VStack>
      </SectionCard>
    </VStack>
  );
};

export default AdminSecondaryApplicationFormView;
