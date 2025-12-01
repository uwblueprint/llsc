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
import { buildPrefilledIntakeAnswers, VolunteerFormAnswers } from '@/utils/adminFormHelpers/intake';
import {
  normalizeParticipantRankingAnswers,
  ParticipantRankingAnswers,
} from '@/utils/adminFormHelpers/ranking';
import { IntakeFormEditor } from '@/components/admin/submissionEditors/IntakeFormEditor';
import { SecondaryApplicationFormEditor } from '@/components/admin/submissionEditors/SecondaryApplicationFormEditor';
import { ParticipantRankingFormEditor } from '@/components/admin/submissionEditors/ParticipantRankingFormEditor';

type EditableAnswers = VolunteerFormAnswers | ParticipantRankingAnswers;

export default function FormViewPage() {
  const router = useRouter();
  const { user_id, submission_id } = router.query;

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
          user_id && typeof user_id === 'string'
            ? adminUserDataAPIClient.getUserData(user_id).catch(() => null)
            : Promise.resolve(null),
          user_id && typeof user_id === 'string'
            ? volunteerDataAPIClient.getVolunteerDataByUserId(user_id)
            : Promise.resolve(null),
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
    [user_id],
  );

  useEffect(() => {
    if (mounted && submission_id && typeof submission_id === 'string') {
      loadSubmission(submission_id);
    }
  }, [submission_id, mounted, loadSubmission]);

  const handleBack = () => {
    const routeUserId = (Array.isArray(user_id) ? user_id[0] : user_id) ?? submission?.userId;
    if (routeUserId) {
      router.push(`/admin/users/${routeUserId}?tab=forms`);
    } else {
      router.push('/admin/directory');
    }
  };

  const updateSubmissionStatus = useCallback(
    async (nextStatus: 'approved' | 'rejected') => {
      if (!submission) return;
      try {
        setIsSavingForm(true);
        setEditError(null);
        setEditSuccess(null);
        const updatedAnswers: Record<string, unknown> = {
          ...(submission.answers || {}),
          status: nextStatus,
        };
        const updated = await intakeAPIClient.updateFormSubmission(submission.id, updatedAnswers);
        setSubmission(updated);
        setEditSuccess(
          nextStatus === 'approved' ? 'Form approved successfully.' : 'Form declined.',
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update form status.';
        setEditError(message);
      } finally {
        setIsSavingForm(false);
      }
    },
    [submission],
  );

  const handleApprove = () => {
    void updateSubmissionStatus('approved');
  };

  const handleDecline = () => {
    void updateSubmissionStatus('rejected');
  };

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
  const intakePrefilledAnswers = useMemo(() => {
    if (!submission || (!usesUnifiedIntakeEditor && !isVolunteerSecondaryForm)) {
      return null;
    }
    return buildPrefilledIntakeAnswers(submission.answers, userData, volunteerData);
  }, [submission, userData, volunteerData, usesUnifiedIntakeEditor, isVolunteerSecondaryForm]);

  const rankingPrefilledAnswers = useMemo(() => {
    if (!submission || !isParticipantRankingForm) {
      return null;
    }
    return normalizeParticipantRankingAnswers(answersRecord);
  }, [submission, isParticipantRankingForm, answersRecord]);

  const existingStatus =
    typeof answersRecord.status === 'string' ? (answersRecord.status as string) : undefined;
  const resolvedStatus =
    (isParticipantRankingForm ? rankingPrefilledAnswers?.status : intakePrefilledAnswers?.status) ??
    existingStatus;
  const isSubmissionPending = resolvedStatus === 'pending-approval';

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
        <Flex mb="48px" onClick={handleBack} cursor="pointer" w="fit-content" align="center">
          <ChakraText
            fontSize="16px"
            fontWeight={600}
            color={UI_COLORS.veniceBlue}
            fontFamily="'Open Sans', sans-serif"
          >
            ← Back
          </ChakraText>
        </Flex>

        <Flex justify="space-between" align="center" mb="32px">
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
          <Text color="green.600" mb={4} fontWeight={600}>
            {editSuccess}
          </Text>
        )}
        {editError && (
          <Text color="red.500" mb={4} fontWeight={600}>
            {editError}
          </Text>
        )}

        {isVolunteerSecondaryForm ? (
          intakePrefilledAnswers ? (
            <SecondaryApplicationFormEditor
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
            <IntakeFormEditor
              initialAnswers={intakePrefilledAnswers}
              onChange={handleVolunteerEditorChange}
            />
          ) : (
            <Flex justify="center" py="60px">
              <Spinner size="lg" color={UI_COLORS.teal} />
            </Flex>
          )
        ) : isParticipantRankingForm ? (
          rankingPrefilledAnswers ? (
            <ParticipantRankingFormEditor
              initialAnswers={rankingPrefilledAnswers}
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

        <Flex justify="flex-end" gap="10px" mt="48px" align="center">
          {isSubmissionPending && (
            <Button
              px="16px"
              py="10px"
              h="auto"
              bg={UI_COLORS.teal}
              color={UI_COLORS.white}
              borderRadius="8px"
              fontSize="14px"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              _hover={{ bg: UI_COLORS.tealDarker }}
              onClick={handleApprove}
            >
              <ChakraText>✓ Approve Form</ChakraText>
            </Button>
          )}
          {isSubmissionPending && (
            <Button
              px="16px"
              py="10px"
              h="auto"
              bg={UI_COLORS.red}
              color={UI_COLORS.white}
              borderRadius="8px"
              fontSize="14px"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              _hover={{ bg: UI_COLORS.redDarker }}
              onClick={handleDecline}
            >
              <ChakraText>✕ Decline Request</ChakraText>
            </Button>
          )}
          <Button
            onClick={handlePrimarySave}
            disabled={!canSaveForm}
            bg={canSaveForm ? '#101828' : '#EAECF5'}
            color={canSaveForm ? '#FFFFFF' : '#475467'}
            borderRadius="8px"
            border="1px solid"
            borderColor={canSaveForm ? '#101828' : '#D0D5DD'}
            px="18px"
            py="10px"
            fontWeight={600}
            fontSize="14px"
            fontFamily="'Open Sans', sans-serif"
            _hover={canSaveForm ? { bg: '#0F1726' } : undefined}
          >
            Save Form
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
