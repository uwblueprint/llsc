import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Text, Button, Spinner } from '@chakra-ui/react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { intakeAPIClient, FormSubmission } from '@/APIClients/intakeAPIClient';
import { adminUserDataAPIClient, AdminUserDataResponse } from '@/APIClients/userDataAPIClient';
import { volunteerDataAPIClient, VolunteerDataResponse } from '@/APIClients/volunteerDataAPIClient';
import { Text as ChakraText } from '@chakra-ui/react';
import { COLORS as UI_COLORS } from '@/constants/colors';
import { FormViewer } from '@/components/admin/FormViewer';
import {
  buildPrefilledIntakeAnswers,
  VolunteerFormAnswers,
  convertToAdminIntakeFormData,
} from '@/utils/adminFormHelpers/intake';
import {
  normalizeParticipantRankingAnswers,
  ParticipantRankingAnswers,
} from '@/utils/adminFormHelpers/ranking';
import { AdminSecondaryApplicationFormView } from '@/components/admin/submissionEditors/AdminSecondaryApplicationFormView';
import { AdminIntakeFormView } from '@/components/admin/submissionEditors/AdminIntakeFormView';
import { AdminRankingFormView } from '@/components/admin/submissionEditors/AdminRankingFormView';

type EditableAnswers = VolunteerFormAnswers | ParticipantRankingAnswers;

export default function FormViewPage() {
  const router = useRouter();
  const { id, submission_id } = router.query;

  // Extract user_id as a string (handle array case from router.query)
  const userId = useMemo(() => {
    if (typeof id === 'string') {
      return id;
    }
    if (Array.isArray(id) && id.length > 0) {
      return id[0];
    }
    return null;
  }, [id]);

  const [mounted, setMounted] = useState(false);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [userData, setUserData] = useState<AdminUserDataResponse | null>(null);
  const [volunteerData, setVolunteerData] = useState<VolunteerDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSubmission = useCallback(
    async (submissionId: string) => {
      try {
        setLoading(true);
        const [submissionData, userDataResponse, volunteerDataResponse] = await Promise.all([
          intakeAPIClient.getFormSubmissionById(submissionId),
          userId
            ? adminUserDataAPIClient.getUserData(userId).catch(() => null)
            : Promise.resolve(null),
          userId ? volunteerDataAPIClient.getVolunteerDataByUserId(userId) : Promise.resolve(null),
        ]);
        setSubmission(submissionData);
        setUserData(userDataResponse);
        setVolunteerData(volunteerDataResponse);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error loading submission:', message);
        setError(message || 'Failed to load form submission');
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (mounted && submission_id && typeof submission_id === 'string') {
      loadSubmission(submission_id);
    }
  }, [submission_id, mounted, loadSubmission]);

  const handleBack = () => {
    // Use userId from router or fallback to submission.userId
    const finalUserId = userId || submission?.userId;

    if (finalUserId && typeof finalUserId === 'string') {
      // Use window.location for a full page navigation to ensure the page updates
      window.location.href = `/admin/users/${finalUserId}?tab=forms`;
    } else {
      // Fallback to directory if we can't determine the user
      window.location.href = '/admin/directory';
    }
  };

  const handleApprove = useCallback(async () => {
    if (!submission) return;
    try {
      setIsSavingForm(true);
      setEditError(null);
      setEditSuccess(null);
      await intakeAPIClient.approveFormSubmission(submission.id);
      setEditSuccess('Form approved successfully. Processing complete.');
      // Reload submission to get updated status
      await loadSubmission(submission.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve form.';
      setEditError(message);
    } finally {
      setIsSavingForm(false);
    }
  }, [submission, loadSubmission]);

  const handleDecline = useCallback(async () => {
    if (!submission) return;
    try {
      setIsSavingForm(true);
      setEditError(null);
      setEditSuccess(null);
      await intakeAPIClient.rejectFormSubmission(submission.id);
      setEditSuccess('Form declined.');
      // Reload submission to get updated status
      await loadSubmission(submission.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to decline form.';
      setEditError(message);
    } finally {
      setIsSavingForm(false);
    }
  }, [submission, loadSubmission]);

  const handleResubmit = useCallback(async () => {
    if (!submission) return;
    try {
      setIsSavingForm(true);
      setEditError(null);
      setEditSuccess(null);
      await intakeAPIClient.resubmitFormSubmission(submission.id);
      setEditSuccess('Form resubmitted for approval.');
      // Reload submission to get updated status
      await loadSubmission(submission.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resubmit form.';
      setEditError(message);
    } finally {
      setIsSavingForm(false);
    }
  }, [submission, loadSubmission]);

  const normalizedFormName = submission?.form?.name?.toLowerCase() ?? '';
  const normalizedFormType = submission?.form?.type ?? '';
  const answersRecord = useMemo(() => {
    if (submission?.answers && typeof submission.answers === 'object') {
      return submission.answers as Record<string, unknown>;
    }
    return {};
  }, [submission]);
  const answersFormType =
    typeof answersRecord.formType === 'string'
      ? (answersRecord.formType as string).toLowerCase()
      : '';

  const isVolunteerSecondaryForm =
    normalizedFormType === 'secondary' ||
    normalizedFormName.includes('secondary application') ||
    normalizedFormName.includes('volunteer profile');

  const isVolunteerBecomeParticipantForm =
    normalizedFormType === 'become_participant' ||
    normalizedFormName.includes('become a participant');

  const isParticipantRankingForm =
    normalizedFormType === 'ranking' || normalizedFormName.includes('ranking');

  const isParticipantFirstConnectionForm =
    normalizedFormType === 'intake' &&
    normalizedFormName.includes('participant') &&
    !normalizedFormName.includes('volunteer');

  const isParticipantBecomeVolunteerForm =
    normalizedFormType === 'become_volunteer' || normalizedFormName.includes('become a volunteer');

  const isVolunteerIntakeForm =
    !isVolunteerSecondaryForm &&
    !isVolunteerBecomeParticipantForm &&
    (answersFormType === 'volunteer' ||
      (normalizedFormType === 'intake' && normalizedFormName.includes('volunteer')));

  const usesUnifiedIntakeEditor =
    isVolunteerIntakeForm ||
    isParticipantFirstConnectionForm ||
    isParticipantBecomeVolunteerForm ||
    isVolunteerBecomeParticipantForm;
  // Use the submission.status field (from database column) for approval workflow
  const submissionStatus = submission?.status;
  const isSubmissionPending = submissionStatus === 'pending_approval';
  const isSubmissionApproved = submissionStatus === 'approved';
  const isSubmissionRejected = submissionStatus === 'rejected';

  const intakePrefilledAnswers = useMemo(() => {
    if (!submission || (!usesUnifiedIntakeEditor && !isVolunteerSecondaryForm)) {
      return null;
    }
    // For pending/rejected forms, only use data from form_submissions.answers
    // Don't pull from volunteer_data or user_data tables until form is approved
    const isPendingOrRejected =
      submissionStatus === 'pending_approval' || submissionStatus === 'rejected';

    if (isPendingOrRejected) {
      // Only use submission.answers, don't use userData or volunteerData
      return buildPrefilledIntakeAnswers(submission.answers, null, null);
    }

    // For approved forms, we can use all data sources
    return buildPrefilledIntakeAnswers(submission.answers, userData, volunteerData);
  }, [
    submission,
    userData,
    volunteerData,
    usesUnifiedIntakeEditor,
    isVolunteerSecondaryForm,
    submissionStatus,
  ]);

  const rankingPrefilledAnswers = useMemo(() => {
    if (!submission || !isParticipantRankingForm) {
      return null;
    }
    return normalizeParticipantRankingAnswers(answersRecord);
  }, [submission, isParticipantRankingForm, answersRecord]);

  const editableInitialAnswers = useMemo(() => {
    if (isParticipantRankingForm) {
      return rankingPrefilledAnswers;
    }
    if (usesUnifiedIntakeEditor || isVolunteerSecondaryForm) {
      return intakePrefilledAnswers;
    }
    return null;
  }, [
    isParticipantRankingForm,
    rankingPrefilledAnswers,
    usesUnifiedIntakeEditor,
    isVolunteerSecondaryForm,
    intakePrefilledAnswers,
  ]);

  const [pendingAnswers, setPendingAnswers] = useState<EditableAnswers | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    if (editableInitialAnswers) {
      setPendingAnswers(editableInitialAnswers);
      setHasPendingChanges(false);
    } else {
      setPendingAnswers(null);
      setHasPendingChanges(false);
    }
  }, [editableInitialAnswers]);

  const handleVolunteerEditorChange = useCallback(
    (answers: VolunteerFormAnswers, dirty: boolean) => {
      setPendingAnswers(answers);
      setHasPendingChanges(dirty);
    },
    [],
  );

  const handleRankingEditorChange = useCallback(
    (answers: ParticipantRankingAnswers, dirty: boolean) => {
      setPendingAnswers(answers);
      setHasPendingChanges(dirty);
    },
    [],
  );

  const canSaveForm = hasPendingChanges && !!pendingAnswers && !isSavingForm;

  const handlePrimarySave = () => {
    if (!pendingAnswers) return;
    void handleSaveForm(pendingAnswers);
  };

  const handleSaveForm = async (updatedAnswers?: EditableAnswers) => {
    if (!submission || !updatedAnswers) return;
    try {
      setIsSavingForm(true);
      setEditError(null);
      setEditSuccess(null);
      const sanitizedAnswers = updatedAnswers as unknown as Record<string, unknown>;
      const updated = await intakeAPIClient.updateFormSubmission(submission.id, sanitizedAnswers);
      setSubmission(updated);
      setEditSuccess('Form saved successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save form.';
      setEditError(message);
    } finally {
      setIsSavingForm(false);
    }
  };

  if (!mounted || loading) {
    return (
      <Box minH="100vh" bg={UI_COLORS.white}>
        <AdminHeader />
        <Flex justify="center" align="center" minH="calc(100vh - 60px)">
          <Spinner size="xl" color={UI_COLORS.teal} />
        </Flex>
      </Box>
    );
  }

  if (error || !submission) {
    return (
      <Box minH="100vh" bg={UI_COLORS.white}>
        <AdminHeader />
        <Flex justify="center" align="center" minH="calc(100vh - 60px)">
          <Text color={UI_COLORS.red} fontSize="18px">
            {error || 'Form submission not found'}
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={UI_COLORS.white}>
      <AdminHeader />
      <Box px="80px" py="80px">
        <Button
          variant="ghost"
          onClick={handleBack}
          mb="48px"
          p={0}
          h="auto"
          minW="auto"
          fontWeight={600}
          fontSize="16px"
          color={UI_COLORS.veniceBlue}
          fontFamily="'Open Sans', sans-serif"
          _hover={{ bg: 'transparent', textDecoration: 'underline' }}
        >
          ← Back
        </Button>

        <Flex justify="space-between" align="center" mb="24px">
          <ChakraText
            fontSize="36px"
            fontWeight={600}
            color={UI_COLORS.veniceBlue}
            fontFamily="'Open Sans', sans-serif"
          >
            {submission.form?.name || 'Form Submission'}
          </ChakraText>
        </Flex>

        {editSuccess && (
          <Box
            mb={4}
            p={3}
            borderRadius="8px"
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
          >
            <Text color="green.700" fontWeight={600} fontSize="14px">
              {editSuccess}
            </Text>
          </Box>
        )}
        {editError && (
          <Box mb={4} p={3} borderRadius="8px" bg="red.50" border="1px solid" borderColor="red.200">
            <Text color="red.700" fontWeight={600} fontSize="14px">
              {editError}
            </Text>
          </Box>
        )}

        {isSubmissionRejected && (
          <Box
            mb={4}
            p={3}
            borderRadius="8px"
            bg={UI_COLORS.bgPinkLight}
            border="1px solid"
            borderColor={UI_COLORS.red}
          >
            <Text color={UI_COLORS.red} fontWeight={600} fontSize="14px">
              ✕ This form was rejected. You can edit and resubmit it for approval.
            </Text>
          </Box>
        )}

        {isVolunteerSecondaryForm ? (
          intakePrefilledAnswers ? (
            <AdminSecondaryApplicationFormView
              initialAnswers={intakePrefilledAnswers}
              onChange={handleVolunteerEditorChange}
            />
          ) : (
            <Flex justify="center" py="60px">
              <Spinner size="lg" color={UI_COLORS.teal} />
            </Flex>
          )
        ) : usesUnifiedIntakeEditor ? (
          intakePrefilledAnswers ? (
            <AdminIntakeFormView
              initialData={convertToAdminIntakeFormData(intakePrefilledAnswers)}
              formType={answersRecord.formType === 'volunteer' ? 'volunteer' : 'participant'}
              onChange={(data, hasChanges) => {
                // Convert back to VolunteerFormAnswers format for compatibility
                const converted: VolunteerFormAnswers = {
                  ...intakePrefilledAnswers,
                  hasBloodCancer: data.hasBloodCancer,
                  caringForSomeone: data.caringForSomeone,
                  personalInfo: {
                    ...intakePrefilledAnswers.personalInfo,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: data.dateOfBirth,
                    phoneNumber: data.phoneNumber,
                    postalCode: data.postalCode,
                    city: data.city,
                    province: data.province,
                  },
                  demographics: {
                    ...intakePrefilledAnswers.demographics,
                    genderIdentity: data.genderIdentity,
                    pronouns: data.pronouns,
                    ethnicGroup: data.ethnicGroup,
                    preferredLanguage: data.preferredLanguage,
                    maritalStatus: data.maritalStatus,
                    hasKids: data.hasKids,
                    timezone: data.timezone,
                  },
                  cancerExperience: {
                    diagnosis: data.diagnosis || '',
                    dateOfDiagnosis: data.dateOfDiagnosis || '',
                    treatments: data.treatments || [],
                    experiences: data.experiences || [],
                  },
                  caregiverExperience: {
                    experiences: data.caregiverExperiences || [],
                  },
                  lovedOne: data.lovedOne
                    ? {
                        demographics: {
                          genderIdentity: data.lovedOne.genderIdentity,
                          genderIdentityCustom: data.lovedOne.genderIdentityCustom,
                          age: data.lovedOne.age,
                        },
                        cancerExperience: {
                          diagnosis: data.lovedOne.diagnosis,
                          dateOfDiagnosis: data.lovedOne.dateOfDiagnosis,
                          treatments: data.lovedOne.treatments,
                          experiences: data.lovedOne.experiences,
                        },
                      }
                    : intakePrefilledAnswers.lovedOne,
                  additionalInfo: data.additionalInfo || '',
                };
                handleVolunteerEditorChange(converted, hasChanges);
              }}
            />
          ) : (
            <Flex justify="center" py="60px">
              <Spinner size="lg" color={UI_COLORS.teal} />
            </Flex>
          )
        ) : isParticipantRankingForm ? (
          rankingPrefilledAnswers && userId ? (
            <AdminRankingFormView
              initialAnswers={rankingPrefilledAnswers}
              userId={userId}
              onChange={handleRankingEditorChange}
            />
          ) : (
            <Flex justify="center" py="60px">
              <Spinner size="lg" color={UI_COLORS.teal} />
            </Flex>
          )
        ) : (
          <FormViewer submission={submission} userData={userData} volunteerData={volunteerData} />
        )}

        {/* Action Buttons */}
        <Flex justify="flex-end" gap="12px" mt="48px" align="center">
          {/* Approve Button - Only for pending forms */}
          {isSubmissionPending && (
            <Button
              px="18px"
              py="12px"
              h="auto"
              bg="#056067"
              color="#FFFFFF"
              borderRadius="8px"
              fontSize="16px"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              _hover={{ bg: '#044d52' }}
              _disabled={{ bg: '#EAECF5', color: '#475467', cursor: 'not-allowed' }}
              onClick={handleApprove}
              disabled={isSavingForm}
            >
              ✓ Approve form
            </Button>
          )}

          {/* Decline Button - Only for pending forms */}
          {isSubmissionPending && (
            <Button
              px="18px"
              py="12px"
              h="auto"
              bg="#C7393F"
              color="#FFFFFF"
              borderRadius="8px"
              fontSize="16px"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              _hover={{ bg: '#a82e33' }}
              _disabled={{ bg: '#EAECF5', color: '#475467', cursor: 'not-allowed' }}
              onClick={handleDecline}
              disabled={isSavingForm}
            >
              ✕ Decline Request
            </Button>
          )}

          {/* Resubmit Button - Only for rejected forms */}
          {isSubmissionRejected && (
            <Button
              px="18px"
              py="12px"
              h="auto"
              bg="#056067"
              color="#FFFFFF"
              borderRadius="8px"
              fontSize="16px"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              _hover={{ bg: '#044d52' }}
              _disabled={{ bg: '#EAECF5', color: '#475467', cursor: 'not-allowed' }}
              onClick={handleResubmit}
              disabled={isSavingForm}
            >
              Resubmit for Approval
            </Button>
          )}

          {/* Save Button - For all forms */}
          <Button
            onClick={handlePrimarySave}
            disabled={!canSaveForm || isSavingForm || isSubmissionApproved}
            bg={canSaveForm && !isSavingForm && !isSubmissionApproved ? '#101828' : '#EAECF5'}
            color={canSaveForm && !isSavingForm && !isSubmissionApproved ? '#FFFFFF' : '#475467'}
            borderRadius="8px"
            border="1px solid"
            borderColor={
              canSaveForm && !isSavingForm && !isSubmissionApproved ? '#101828' : '#D0D5DD'
            }
            px="18px"
            py="12px"
            h="auto"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            _hover={
              canSaveForm && !isSavingForm && !isSubmissionApproved ? { bg: '#0F1726' } : undefined
            }
          >
            Save Form
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
