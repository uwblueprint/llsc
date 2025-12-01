import React, { useMemo } from 'react';
import { Box, Flex, VStack, Text as ChakraText } from '@chakra-ui/react';
import { FormSubmission } from '@/APIClients/intakeAPIClient';
import { AdminUserDataResponse } from '@/APIClients/userDataAPIClient';
import { VolunteerDataResponse } from '@/APIClients/volunteerDataAPIClient';
import { COLORS } from '@/constants/colors';
import { FormField } from '@/components/ui/form-field';

type VolunteerReference = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
};

type VolunteerReferences = {
  reference1?: VolunteerReference;
  reference2?: VolunteerReference;
  additionalInfo?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

type PersonalInfoAnswers = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  postalCode?: string;
  city?: string;
  province?: string;
};

type DemographicsAnswers = {
  genderIdentity?: string;
  pronouns?: string[];
  ethnicGroup?: string[];
  preferredLanguage?: string;
  maritalStatus?: string;
  hasKids?: string;
};

type CancerExperienceAnswers = {
  diagnosis?: string;
  dateOfDiagnosis?: string;
  treatments?: string[];
  experiences?: string[];
};

type CaregiverExperienceAnswers = {
  experiences?: string[];
};

type LovedOneAnswers = {
  demographics?: {
    genderIdentity?: string;
    age?: string;
  };
  cancerExperience?: CancerExperienceAnswers;
};

type SubmissionAnswers = {
  formType?: string;
  personalInfo?: PersonalInfoAnswers;
  demographics?: DemographicsAnswers;
  cancerExperience?: CancerExperienceAnswers;
  caregiverExperience?: CaregiverExperienceAnswers;
  lovedOne?: LovedOneAnswers;
  hasBloodCancer?: string;
  caringForSomeone?: string;
  hasCriminalRecord?: string;
  volunteerExperience?: string;
  volunteerReferences?: unknown;
  volunteerAdditionalComments?: string;
};

interface FormViewerProps {
  submission: FormSubmission;
  userData?: AdminUserDataResponse | null;
  volunteerData?: VolunteerDataResponse | null;
}

const parseVolunteerReferences = (raw: unknown): VolunteerReferences | null => {
  if (!raw) return null;

  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!isRecord(data)) return null;

    const normalizeReference = (reference: unknown): VolunteerReference | undefined => {
      if (!isRecord(reference)) return undefined;

      const fullNameValue = reference.fullName ?? reference.full_name;
      const phoneNumberValue = reference.phoneNumber ?? reference.phone_number;

      return {
        fullName: typeof fullNameValue === 'string' ? fullNameValue : '',
        email: typeof reference.email === 'string' ? reference.email : '',
        phoneNumber: typeof phoneNumberValue === 'string' ? phoneNumberValue : '',
      };
    };

    const reference1 = normalizeReference(data.reference1 ?? data.reference_1);
    const reference2 = normalizeReference(data.reference2 ?? data.reference_2);
    const additionalInfoValue =
      data.additionalInfo ?? data.additional_info ?? data.additionalComments;

    return {
      reference1,
      reference2,
      additionalInfo: typeof additionalInfoValue === 'string' ? additionalInfoValue : '',
    };
  } catch (error) {
    console.error('Failed to parse volunteer references', error);
    return null;
  }
};

export function FormViewer({ submission, userData, volunteerData }: FormViewerProps) {
  const answers = useMemo<SubmissionAnswers>(
    () => (submission.answers || {}) as SubmissionAnswers,
    [submission.answers],
  );

  const formType = useMemo(() => {
    if (answers.formType) {
      return answers.formType;
    }
    const fallbackName = submission.form?.name?.toLowerCase() ?? '';
    if (fallbackName.includes('volunteer')) {
      return 'volunteer';
    }
    if (fallbackName.includes('participant')) {
      return 'participant';
    }
    return 'participant';
  }, [answers.formType, submission.form?.name]);

  const isVolunteerForm = formType === 'volunteer';

  const mergedData = useMemo(() => {
    const personalInfo = answers.personalInfo || {};
    const demographics = answers.demographics || {};
    const cancerExperience = answers.cancerExperience || {};
    const caregiverExperience = answers.caregiverExperience?.experiences || [];
    const lovedOneAnswers = answers.lovedOne || {};
    const lovedOneDemographics = lovedOneAnswers.demographics || {};
    const lovedOneCancerExperience = lovedOneAnswers.cancerExperience || {};

    const volunteerReferences =
      parseVolunteerReferences(volunteerData?.referencesJson) ||
      parseVolunteerReferences(answers.volunteerReferences);

    const volunteerAdditionalComments =
      volunteerData?.additionalComments ||
      answers.volunteerAdditionalComments ||
      volunteerReferences?.additionalInfo ||
      '';

    return {
      hasBloodCancer: userData?.hasBloodCancer || answers.hasBloodCancer || '',
      caringForSomeone: userData?.caringForSomeone || answers.caringForSomeone || '',
      personalInfo: {
        firstName: userData?.firstName || personalInfo.firstName || '',
        lastName: userData?.lastName || personalInfo.lastName || '',
        dateOfBirth: userData?.dateOfBirth
          ? new Date(userData.dateOfBirth).toLocaleDateString('en-GB')
          : personalInfo.dateOfBirth || '',
        phoneNumber: userData?.phone || personalInfo.phoneNumber || '',
        email: userData?.email || personalInfo.email || '',
        postalCode: userData?.postalCode || personalInfo.postalCode || '',
        city: userData?.city || personalInfo.city || '',
        province: userData?.province || personalInfo.province || '',
      },
      demographics: {
        genderIdentity:
          userData?.genderIdentityCustom ||
          userData?.genderIdentity ||
          demographics.genderIdentity ||
          '',
        pronouns: userData?.pronouns || demographics.pronouns || [],
        ethnicGroup: userData?.otherEthnicGroup
          ? [...(userData.ethnicGroup || []), userData.otherEthnicGroup]
          : userData?.ethnicGroup || demographics.ethnicGroup || [],
        maritalStatus: userData?.maritalStatus || demographics.maritalStatus || '',
        hasKids: userData?.hasKids || demographics.hasKids || '',
        preferredLanguage: demographics.preferredLanguage || '',
      },
      cancerExperience: {
        diagnosis: userData?.diagnosis || cancerExperience.diagnosis || '',
        dateOfDiagnosis: userData?.dateOfDiagnosis
          ? new Date(userData.dateOfDiagnosis).toLocaleDateString('en-GB')
          : cancerExperience.dateOfDiagnosis || '',
        treatments: userData?.treatments?.map((t) => t.name) || cancerExperience.treatments || [],
        experiences:
          userData?.experiences?.map((e) => e.name) || cancerExperience.experiences || [],
      },
      caregiverExperience,
      lovedOne: {
        demographics: {
          genderIdentity:
            userData?.lovedOneGenderIdentity || lovedOneDemographics.genderIdentity || '',
          age: userData?.lovedOneAge || lovedOneDemographics.age || '',
        },
        cancerExperience: {
          diagnosis: userData?.lovedOneDiagnosis || lovedOneCancerExperience.diagnosis || '',
          dateOfDiagnosis: userData?.lovedOneDateOfDiagnosis
            ? new Date(userData.lovedOneDateOfDiagnosis).toLocaleDateString('en-GB')
            : lovedOneCancerExperience.dateOfDiagnosis || '',
          treatments:
            userData?.lovedOneTreatments?.map((t) => t.name) ||
            lovedOneCancerExperience.treatments ||
            [],
          experiences:
            userData?.lovedOneExperiences?.map((e) => e.name) ||
            lovedOneCancerExperience.experiences ||
            [],
        },
      },
      hasCriminalRecord: answers.hasCriminalRecord || '',
      volunteerExperience: volunteerData?.experience || answers.volunteerExperience || '',
      volunteerReferences,
      volunteerAdditionalComments,
    };
  }, [answers, userData, volunteerData]);

  if (!isVolunteerForm) {
    return (
      <Box>
        <ChakraText fontSize="18px" color={COLORS.gray700} fontFamily="'Open Sans', sans-serif">
          Detailed volunteer form rendering is currently available only for volunteer submissions.
          This submission ({submission.form?.name || 'Unknown form'}) will be supported in a
          follow-up update.
        </ChakraText>
      </Box>
    );
  }

  const {
    hasBloodCancer,
    caringForSomeone,
    personalInfo,
    demographics,
    cancerExperience,
    caregiverExperience,
    lovedOne,
    hasCriminalRecord,
    volunteerExperience,
    volunteerReferences,
    volunteerAdditionalComments,
  } = mergedData;

  const renderDivider = () => <Box h="1px" bg={COLORS.gray300} />;

  return (
    <VStack align="stretch" gap="48px">
      <Box>
        <ChakraText
          fontSize="26px"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontFamily="'Open Sans', sans-serif"
          mb="24px"
        >
          Experience Type
        </ChakraText>
        <Flex gap="48px" flexWrap="wrap">
          <Box>
            <ChakraText fontSize="16px" fontWeight={600} color={COLORS.veniceBlue} mb="12px">
              Do you have blood cancer?
            </ChakraText>
            <ChakraText fontSize="16px" fontWeight={600} color={COLORS.gray700}>
              {hasBloodCancer === 'yes' ? 'Yes' : hasBloodCancer === 'no' ? 'No' : 'Not answered'}
            </ChakraText>
          </Box>
          <Box>
            <ChakraText fontSize="16px" fontWeight={600} color={COLORS.veniceBlue} mb="12px">
              Are you caring for anyone with blood cancer?
            </ChakraText>
            <ChakraText fontSize="16px" fontWeight={600} color={COLORS.gray700}>
              {caringForSomeone === 'yes'
                ? 'Yes'
                : caringForSomeone === 'no'
                  ? 'No'
                  : 'Not answered'}
            </ChakraText>
          </Box>
        </Flex>
      </Box>

      {renderDivider()}

      <Box>
        <ChakraText
          fontSize="26px"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontFamily="'Open Sans', sans-serif"
          mb="24px"
        >
          Personal Information
        </ChakraText>
        <VStack align="stretch" gap="24px">
          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="First Name">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.firstName || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Last Name">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.lastName || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="Date of Birth">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.dateOfBirth || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Email">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.email || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="Phone Number">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.phoneNumber || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Postal Code">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.postalCode || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="City">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.city || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Province">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {personalInfo.province || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          {hasCriminalRecord && (
            <Box>
              <ChakraText fontSize="16px" fontWeight={600} color={COLORS.veniceBlue} mb="12px">
                Do you have a criminal record?
              </ChakraText>
              <ChakraText fontSize="16px" fontWeight={600} color={COLORS.gray700}>
                {hasCriminalRecord === 'yes'
                  ? 'Yes'
                  : hasCriminalRecord === 'no'
                    ? 'No'
                    : 'Not answered'}
              </ChakraText>
            </Box>
          )}
        </VStack>
      </Box>

      {renderDivider()}

      <Box>
        <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
          Your Demographic Information
        </ChakraText>
        <ChakraText fontSize="18px" color={COLORS.veniceBlue} mb="24px">
          This information can be taken into account when matching you with a service user.
        </ChakraText>

        <VStack align="stretch" gap="24px">
          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="Gender Identity">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {demographics.genderIdentity || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Pronouns">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {Array.isArray(demographics.pronouns) && demographics.pronouns.length
                    ? demographics.pronouns.join(', ')
                    : 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="Ethnic or Cultural Group">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {Array.isArray(demographics.ethnicGroup) && demographics.ethnicGroup.length
                    ? demographics.ethnicGroup.join(', ')
                    : 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Preferred Language">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {demographics.preferredLanguage || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>

          <Flex gap="48px" flexWrap="wrap">
            <Box flex="1" minW="240px">
              <FormField label="Marital Status">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {demographics.maritalStatus || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
            <Box flex="1" minW="240px">
              <FormField label="Do you have kids?">
                <ChakraText fontSize="16px" color={COLORS.gray500}>
                  {demographics.hasKids || 'Not provided'}
                </ChakraText>
              </FormField>
            </Box>
          </Flex>
        </VStack>
      </Box>

      {(hasBloodCancer === 'yes' ||
        cancerExperience.diagnosis ||
        (Array.isArray(cancerExperience.treatments) && cancerExperience.treatments.length) ||
        (Array.isArray(cancerExperience.experiences) && cancerExperience.experiences.length)) && (
        <>
          {renderDivider()}
          <Box>
            <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
              Your Cancer Experience
            </ChakraText>
            <ChakraText fontSize="18px" color={COLORS.veniceBlue} mb="24px">
              This information can also be taken into account when matching you with a service user.
            </ChakraText>

            <VStack align="stretch" gap="24px">
              <Flex gap="48px" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <FormField label="Your Diagnosis">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {cancerExperience.diagnosis || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
                <Box flex="1" minW="240px">
                  <FormField label="Your Date of Diagnosis">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {cancerExperience.dateOfDiagnosis || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
              </Flex>

              <Flex gap="48px" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <ChakraText fontSize="14px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
                    Which treatments have you done?
                  </ChakraText>
                  <ChakraText fontSize="12px" color={COLORS.gray700} mb="12px">
                    You can select a maximum of 2.
                  </ChakraText>
                  {Array.isArray(cancerExperience.treatments) &&
                  cancerExperience.treatments.length ? (
                    <VStack align="start" gap="8px">
                      {cancerExperience.treatments.map((treatment: string, idx: number) => (
                        <ChakraText key={treatment + idx} fontSize="14px" color={COLORS.gray700}>
                          {treatment}
                        </ChakraText>
                      ))}
                    </VStack>
                  ) : (
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      Not provided
                    </ChakraText>
                  )}
                </Box>
                <Box flex="1" minW="240px">
                  <ChakraText fontSize="14px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
                    Which experiences do you have?
                  </ChakraText>
                  <ChakraText fontSize="12px" color={COLORS.gray700} mb="12px">
                    You can select a maximum of 5.
                  </ChakraText>
                  {Array.isArray(cancerExperience.experiences) &&
                  cancerExperience.experiences.length ? (
                    <VStack align="start" gap="8px">
                      {cancerExperience.experiences.map((experience: string, idx: number) => (
                        <ChakraText key={experience + idx} fontSize="14px" color={COLORS.gray700}>
                          {experience}
                        </ChakraText>
                      ))}
                    </VStack>
                  ) : (
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      Not provided
                    </ChakraText>
                  )}
                </Box>
              </Flex>
            </VStack>
          </Box>
        </>
      )}

      {(caringForSomeone === 'yes' || caregiverExperience.length > 0) && (
        <>
          {renderDivider()}
          <Box>
            <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="24px">
              Caregiver Experience
            </ChakraText>
            {caregiverExperience.length ? (
              <VStack align="stretch" gap="8px">
                {caregiverExperience.map((experience: string, idx: number) => (
                  <ChakraText key={experience + idx} fontSize="14px" color={COLORS.gray700}>
                    {experience}
                  </ChakraText>
                ))}
              </VStack>
            ) : (
              <ChakraText fontSize="16px" color={COLORS.gray500}>
                Not provided
              </ChakraText>
            )}
          </Box>
        </>
      )}

      {(caringForSomeone === 'yes' ||
        lovedOne.demographics.genderIdentity ||
        lovedOne.cancerExperience.diagnosis) && (
        <>
          {renderDivider()}
          <Box>
            <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="24px">
              Loved One Information
            </ChakraText>

            <VStack align="stretch" gap="24px">
              <Flex gap="48px" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <FormField label="Gender Identity">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {lovedOne.demographics.genderIdentity || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
                <Box flex="1" minW="240px">
                  <FormField label="Age">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {lovedOne.demographics.age || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
              </Flex>

              <Flex gap="48px" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <FormField label="Diagnosis">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {lovedOne.cancerExperience.diagnosis || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
                <Box flex="1" minW="240px">
                  <FormField label="Date of Diagnosis">
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      {lovedOne.cancerExperience.dateOfDiagnosis || 'Not provided'}
                    </ChakraText>
                  </FormField>
                </Box>
              </Flex>

              <Flex gap="48px" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <ChakraText fontSize="14px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
                    Their treatments
                  </ChakraText>
                  <ChakraText fontSize="12px" color={COLORS.gray700} mb="12px">
                    You can select a maximum of 2.
                  </ChakraText>
                  {Array.isArray(lovedOne.cancerExperience.treatments) &&
                  lovedOne.cancerExperience.treatments.length ? (
                    <VStack align="start" gap="8px">
                      {lovedOne.cancerExperience.treatments.map(
                        (treatment: string, idx: number) => (
                          <ChakraText key={treatment + idx} fontSize="14px" color={COLORS.gray700}>
                            {treatment}
                          </ChakraText>
                        ),
                      )}
                    </VStack>
                  ) : (
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      Not provided
                    </ChakraText>
                  )}
                </Box>
                <Box flex="1" minW="240px">
                  <ChakraText fontSize="14px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
                    Their experiences
                  </ChakraText>
                  <ChakraText fontSize="12px" color={COLORS.gray700} mb="12px">
                    You can select a maximum of 5.
                  </ChakraText>
                  {Array.isArray(lovedOne.cancerExperience.experiences) &&
                  lovedOne.cancerExperience.experiences.length ? (
                    <VStack align="start" gap="8px">
                      {lovedOne.cancerExperience.experiences.map(
                        (experience: string, idx: number) => (
                          <ChakraText key={experience + idx} fontSize="14px" color={COLORS.gray700}>
                            {experience}
                          </ChakraText>
                        ),
                      )}
                    </VStack>
                  ) : (
                    <ChakraText fontSize="16px" color={COLORS.gray500}>
                      Not provided
                    </ChakraText>
                  )}
                </Box>
              </Flex>
            </VStack>
          </Box>
        </>
      )}

      {volunteerExperience && (
        <>
          {renderDivider()}
          <Box>
            <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="4px">
              Your Experience
            </ChakraText>
            <ChakraText fontSize="18px" color={COLORS.veniceBlue} mb="24px">
              This information will serve as your biography and will encourage potential matches to
              speak with you.
            </ChakraText>
            <FormField label="Tell us about yourself">
              <ChakraText fontSize="16px" color={COLORS.gray500} whiteSpace="pre-wrap">
                {volunteerExperience}
              </ChakraText>
            </FormField>
          </Box>
        </>
      )}

      {(volunteerReferences || volunteerAdditionalComments) && (
        <>
          {renderDivider()}
          <Box>
            <ChakraText fontSize="26px" fontWeight={600} color={COLORS.veniceBlue} mb="24px">
              References
            </ChakraText>

            {volunteerReferences && (
              <VStack align="stretch" gap="32px">
                {volunteerReferences.reference1 && (
                  <Box>
                    <ChakraText
                      fontSize="18px"
                      fontWeight={600}
                      color={COLORS.veniceBlue}
                      mb="16px"
                    >
                      Reference 1
                    </ChakraText>
                    <VStack align="stretch" gap="16px">
                      <FormField label="Full Name">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference1.fullName || 'Not provided'}
                        </ChakraText>
                      </FormField>
                      <FormField label="Email">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference1.email || 'Not provided'}
                        </ChakraText>
                      </FormField>
                      <FormField label="Phone Number">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference1.phoneNumber || 'Not provided'}
                        </ChakraText>
                      </FormField>
                    </VStack>
                  </Box>
                )}

                {volunteerReferences.reference2 && (
                  <Box>
                    <ChakraText
                      fontSize="18px"
                      fontWeight={600}
                      color={COLORS.veniceBlue}
                      mb="16px"
                    >
                      Reference 2
                    </ChakraText>
                    <VStack align="stretch" gap="16px">
                      <FormField label="Full Name">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference2.fullName || 'Not provided'}
                        </ChakraText>
                      </FormField>
                      <FormField label="Email">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference2.email || 'Not provided'}
                        </ChakraText>
                      </FormField>
                      <FormField label="Phone Number">
                        <ChakraText fontSize="16px" color={COLORS.gray500}>
                          {volunteerReferences.reference2.phoneNumber || 'Not provided'}
                        </ChakraText>
                      </FormField>
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}

            {volunteerAdditionalComments && (
              <Box mt="24px">
                <FormField label="Additional Comments">
                  <ChakraText fontSize="16px" color={COLORS.gray500} whiteSpace="pre-wrap">
                    {volunteerAdditionalComments}
                  </ChakraText>
                </FormField>
              </Box>
            )}
          </Box>
        </>
      )}
    </VStack>
  );
}
