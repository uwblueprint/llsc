import React, { useEffect, useState } from 'react';
import { VStack, Text, Textarea, Box, Input } from '@chakra-ui/react';
import { COLORS as FORM_COLORS } from '@/constants/form';
import { FormField } from '@/components/ui/form-field';
import { InputGroup } from '@/components/ui/input-group';
import {
  VolunteerFormAnswers,
  VolunteerReference,
  normalizeIntakeAnswers,
} from '@/utils/adminFormHelpers/intake';
import { SectionCard } from './SectionCard';
import { INPUT_STYLES, SelectField, TEXTAREA_STYLES } from './shared';

interface SecondaryApplicationFormEditorProps {
  initialAnswers: VolunteerFormAnswers;
  onChange?: (answers: VolunteerFormAnswers, hasChanges: boolean) => void;
}

export const SecondaryApplicationFormEditor: React.FC<SecondaryApplicationFormEditorProps> = ({
  initialAnswers,
  onChange,
}) => {
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

  return (
    <VStack align="stretch" gap="10" maxW="780px" mx="auto" width="100%">
      <SectionCard
        title="Volunteer Biography"
        description="This is copied directly from the volunteer profile form."
      >
        <VStack align="stretch" gap={4}>
          <Text
            color={FORM_COLORS.fieldGray}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15px"
          >
            Encourage volunteers to include their age, diagnosis, treatments, family details, the
            challenges they faced, and how they are doing now.
          </Text>
          <FormField label="Share your story">
            <Textarea
              {...TEXTAREA_STYLES}
              minH="240px"
              placeholder="Tell us about your journey..."
              value={formData.volunteerExperience || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  volunteerExperience: e.target.value,
                }))
              }
            />
          </FormField>
        </VStack>
      </SectionCard>

      <SectionCard
        title="References"
        description="Confirm that both references have been contacted before approving the volunteer."
      >
        <Text
          color={FORM_COLORS.fieldGray}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={4}
        >
          This mirrors the secondary application form fields. Each volunteer must provide two
          references who can speak to their ability to support others.
        </Text>
        <VStack align="stretch" gap={6}>
          {(['reference1', 'reference2'] as const).map((key, index) => (
            <Box key={key} border="1px solid #d1d5db" borderRadius="16px" p="24px" bg="#f9fafb">
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color={FORM_COLORS.veniceBlue}
                mb={4}
              >
                {index === 0 ? 'Reference 1' : 'Reference 2'}
              </Text>
              <VStack align="stretch" gap={4}>
                <FormField label="Full Name">
                  <InputGroup>
                    <Input
                      {...INPUT_STYLES}
                      placeholder="Full name"
                      value={formData.volunteerReferences?.[key]?.fullName || ''}
                      onChange={(e) => handleReferenceChange(key, 'fullName', e.target.value)}
                    />
                  </InputGroup>
                </FormField>
                <FormField label="Email">
                  <InputGroup>
                    <Input
                      {...INPUT_STYLES}
                      placeholder="Email"
                      type="email"
                      value={formData.volunteerReferences?.[key]?.email || ''}
                      onChange={(e) => handleReferenceChange(key, 'email', e.target.value)}
                    />
                  </InputGroup>
                </FormField>
                <FormField label="Phone Number">
                  <InputGroup>
                    <Input
                      {...INPUT_STYLES}
                      placeholder="Phone number"
                      value={formData.volunteerReferences?.[key]?.phoneNumber || ''}
                      onChange={(e) => handleReferenceChange(key, 'phoneNumber', e.target.value)}
                    />
                  </InputGroup>
                </FormField>
              </VStack>
            </Box>
          ))}
        </VStack>
        <Box mt={6}>
          <FormField label="Additional information about your references">
            <Textarea
              {...TEXTAREA_STYLES}
              minH="120px"
              placeholder="Notes about reference outreach or context for the reviewer."
              value={formData.volunteerReferences?.additionalInfo || ''}
              onChange={(e) => handleReferenceNotesChange(e.target.value)}
            />
          </FormField>
        </Box>
      </SectionCard>

      <SectionCard title="Admin Notes">
        <FormField label="Internal comments">
          <Textarea
            {...TEXTAREA_STYLES}
            minH="160px"
            placeholder="Internal comments, onboarding notes, or next steps."
            value={formData.volunteerAdditionalComments || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                volunteerAdditionalComments: e.target.value,
              }))
            }
          />
        </FormField>
      </SectionCard>

      <SectionCard title="Form Status">
        <SelectField
          value={formData.status || 'pending-approval'}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          style={{ maxWidth: '320px' }}
        >
          <option value="pending-approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </SelectField>
      </SectionCard>
    </VStack>
  );
};

export default SecondaryApplicationFormEditor;
