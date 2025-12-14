import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Box, Flex, Text, Spinner, VStack, Button } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { UserRole } from '@/types/authTypes';
import { COLORS } from '@/constants/colors';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIntakeOptions } from '@/hooks/useIntakeOptions';
import { useProfileEditing } from '@/hooks/useProfileEditing';
import { useAvailabilityEditing } from '@/hooks/useAvailabilityEditing';
import { ProfileNavigation } from '@/components/admin/userProfile/ProfileNavigation';
import { SuccessMessage } from '@/components/admin/userProfile/SuccessMessage';
import { ProfileSummary } from '@/components/admin/userProfile/ProfileSummary';
import { ProfileContent } from '@/components/admin/userProfile/ProfileContent';
import { SaveMessage } from '@/types/userProfileTypes';
import { intakeAPIClient, FormSubmission } from '@/APIClients/intakeAPIClient';

const statusColors = {
  'pending-approval': {
    bg: COLORS.bgBlueLight,
    text: COLORS.blue,
  },
  approved: {
    bg: COLORS.bgTealLight,
    text: COLORS.teal,
  },
  rejected: {
    bg: COLORS.bgPinkLight,
    text: COLORS.red,
  },
};

const FORM_IDS = {
  FIRST_CONNECTION_PARTICIPANT: '12345678-1234-1234-1234-123456789012',
  FIRST_CONNECTION_VOLUNTEER: '12345678-1234-1234-1234-123456789013',
  RANKING: '12345678-1234-1234-1234-123456789014',
  SECONDARY_APPLICATION: '12345678-1234-1234-1234-123456789015',
  BECOME_PARTICIPANT: '12345678-1234-1234-1234-123456789016',
  BECOME_VOLUNTEER: '12345678-1234-1234-1234-123456789017',
} as const;

const CREATE_FORM_BUTTON_COLOR = '#056067';

type FormSection = {
  heading: string;
  formNames: string[];
  formId?: string;
  showCreateButton?: boolean;
};

export default function AdminUserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [creatingFormId, setCreatingFormId] = useState<string | null>(null);

  // Custom hooks
  const { user, loading, setUser } = useUserProfile(id);
  const { treatmentOptions, experienceOptions } = useIntakeOptions();
  const {
    isEditingProfileSummary,
    isSaving,
    profileEditData,
    setProfileEditData,
    editingField,
    cancerEditData,
    setCancerEditData,
    lovedOneEditData,
    setLovedOneEditData,
    handleStartEditProfileSummary,
    handleSaveProfileSummary,
    handleCancelEditProfileSummary,
    handleStartEditField,
    handleCancelEditField,
    handleSaveField,
  } = useProfileEditing({
    userId: id,
    user,
    setUser,
    setSaveMessage,
  });

  const {
    isEditingAvailability,
    selectedTimeSlots,
    isDragging,
    dragStart,
    isSaving: isSavingAvailability,
    getDragRangeSlots,
    handleStartEditAvailability,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSaveAvailability,
    handleCancelEditAvailability,
  } = useAvailabilityEditing({
    userId: id,
    user,
    setUser,
    setSaveMessage,
  });

  const loadUserForms = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setFormsLoading(false);
      return;
    }

    try {
      setFormsLoading(true);
      const response = await intakeAPIClient.getFormSubmissions({ userId: id });
      setFormSubmissions(response.submissions);
      setFormsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load form submissions';
      setFormsError(message);
    } finally {
      setFormsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUserForms();
  }, [loadUserForms]);

  const role = user ? roleIdToUserRole(user.roleId) : null;

  const formSections: FormSection[] = useMemo(() => {
    if (!role) return [];

    const isParticipant = role === UserRole.PARTICIPANT;

    if (isParticipant) {
      return [
        {
          heading: 'First Connection Participant Form',
          formNames: ['First Connection Participant Form'],
          formId: FORM_IDS.FIRST_CONNECTION_PARTICIPANT,
          showCreateButton: false,
        },
        {
          heading: 'Ranking Form',
          formNames: ['Ranking Form'],
          formId: FORM_IDS.RANKING,
          showCreateButton: false,
        },
        {
          heading: 'Become a Volunteer Form',
          formNames: ['Become a Volunteer Form'],
          formId: FORM_IDS.BECOME_VOLUNTEER,
          showCreateButton: true,
        },
      ];
    }

    return [
      {
        heading: 'First Connection Volunteer Form',
        formNames: ['First Connection Volunteer Form'],
        formId: FORM_IDS.FIRST_CONNECTION_VOLUNTEER,
        showCreateButton: false,
      },
      {
        heading: 'Secondary Application Form',
        formNames: ['Secondary Application Form'],
        formId: FORM_IDS.SECONDARY_APPLICATION,
        showCreateButton: false,
      },
      {
        heading: 'Become a Participant Form',
        formNames: ['Become a Participant Form'],
        formId: FORM_IDS.BECOME_PARTICIPANT,
        showCreateButton: true,
      },
    ];
  }, [role]);

  const groupedForms = useMemo(() => {
    const grouped: Record<string, FormSubmission[]> = {};
    formSections.forEach(({ heading }) => {
      grouped[heading] = [];
    });

    formSubmissions.forEach((submission) => {
      const formName = submission.form?.name;
      if (!formName) return;

      for (const section of formSections) {
        if (section.formNames.includes(formName)) {
          grouped[section.heading].push(submission);
          break;
        }
      }
    });

    return grouped;
  }, [formSections, formSubmissions]);

  const handleCreateForm = useCallback(
    async (formId: string, heading: string) => {
      if (!id || typeof id !== 'string') {
        setFormsError('Unable to determine user for form creation.');
        return;
      }

      const existingSubmissions = groupedForms[heading] || [];
      if (existingSubmissions.length > 0) {
        setSaveMessage({
          type: 'error',
          text: `Only one ${heading} can exist at a time. Please edit or remove the existing submission.`,
        });
        return;
      }

      try {
        setCreatingFormId(formId);
        await intakeAPIClient.createFormSubmission({
          formId,
          userId: id,
          answers: {
            status: 'pending-approval',
            createdByAdmin: true,
          },
        });
        setFormsError(null);
        setSaveMessage({
          type: 'success',
          text: `${heading} is now ready to edit.`,
        });
        await loadUserForms();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create form. Please try again.';
        setFormsError(message);
        setSaveMessage({
          type: 'error',
          text: message,
        });
      } finally {
        setCreatingFormId(null);
      }
    },
    [groupedForms, id, loadUserForms],
  );

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="xl" color={COLORS.veniceBlue} />
        </Flex>
      </ProtectedPage>
    );
  }

  if (!user) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
        <AdminHeader />
        <Box p={8}>
          <Text>User not found</Text>
        </Box>
      </ProtectedPage>
    );
  }

  const userData = user.userData;
  const volunteerData = user.volunteerData;

  // Determine active tab based on route or query param
  const activeTab = (router.query.tab as string) || 'profile';

  const handleTabChange = (tab: string) => {
    router.push({ pathname: router.pathname, query: { ...router.query, tab } }, undefined, {
      shallow: true,
    });
  };

  // Don't render if role is null (shouldn't happen, but TypeScript safety)
  if (!role) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
        <AdminHeader />
        <Box p={8}>
          <Text>Invalid user role</Text>
        </Box>
      </ProtectedPage>
    );
  }

  const getFormStatus = (submission: FormSubmission): string => {
    const answers = submission.answers;
    const statusValue =
      answers && typeof answers['status'] === 'string' ? (answers['status'] as string) : null;
    return statusValue || 'approved';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending-approval': 'Pending Approval',
      approved: 'Form Approved',
      rejected: 'Rejected',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleViewForm = (submissionId: string) => {
    if (!id || typeof id !== 'string') return;
    router.push(`/admin/users/${id}/forms/${submissionId}`);
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
      <AdminHeader />
      <SuccessMessage message={saveMessage} />
      <Flex minH="calc(100vh - 72px)" bg="gray.50">
        {/* Left Sidebar */}
        <Box w="320px" p={8} display={{ base: 'none', md: 'block' }} bg="white">
          <ProfileNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Profile Summary Card */}
          <ProfileSummary
            userData={userData}
            userEmail={user.email}
            isEditing={isEditingProfileSummary}
            isSaving={isSaving}
            editData={profileEditData}
            onEditDataChange={setProfileEditData}
            onStartEdit={handleStartEditProfileSummary}
            onSave={handleSaveProfileSummary}
            onCancel={handleCancelEditProfileSummary}
          />
        </Box>

        {/* Main Content */}
        {activeTab === 'profile' || !activeTab ? (
          <ProfileContent
            user={user}
            role={role}
            userData={userData}
            volunteerData={volunteerData}
            editingField={editingField}
            isSaving={isSaving}
            cancerEditData={cancerEditData}
            lovedOneEditData={lovedOneEditData}
            treatmentOptions={treatmentOptions}
            experienceOptions={experienceOptions}
            isEditingAvailability={isEditingAvailability}
            selectedTimeSlots={selectedTimeSlots}
            isDragging={isDragging}
            dragStart={dragStart}
            getDragRangeSlots={getDragRangeSlots}
            isSavingAvailability={isSavingAvailability}
            onCancerEditDataChange={setCancerEditData}
            onLovedOneEditDataChange={setLovedOneEditData}
            onStartEditField={handleStartEditField}
            onCancelEditField={handleCancelEditField}
            onSaveField={handleSaveField}
            onStartEditAvailability={handleStartEditAvailability}
            onCancelEditAvailability={handleCancelEditAvailability}
            onSaveAvailability={handleSaveAvailability}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            setUser={setUser}
          />
        ) : activeTab === 'forms' ? (
          <Box flex="1" p={8} bg="white">
            <Text fontSize="28px" fontWeight="600" color={COLORS.veniceBlue} mb={6}>
              Forms
            </Text>

            {formsLoading ? (
              <Flex align="center" justify="center" py={20}>
                <Spinner size="lg" color={COLORS.teal} />
              </Flex>
            ) : formsError ? (
              <Text color="red.500">{formsError}</Text>
            ) : formSections.length === 0 ? (
              <Text color={COLORS.gray500}>No forms available for this user.</Text>
            ) : (
              <VStack align="stretch" gap="32px">
                {formSections.map((section) => {
                  const submissions = groupedForms[section.heading] || [];
                  const isSwitchSection = Boolean(section.showCreateButton);

                  if (!isSwitchSection && submissions.length === 0) {
                    return null;
                  }

                  const canShowCreateButton =
                    isSwitchSection && section.formId && submissions.length === 0;

                  return (
                    <Box key={section.heading}>
                      <Flex align="center" justify="space-between" gap={6}>
                        <Box flex="1">
                          <Text fontSize="20px" fontWeight="600" color={COLORS.veniceBlue}>
                            {section.heading}
                          </Text>
                        </Box>
                        {canShowCreateButton && (
                          <Button
                            bg={CREATE_FORM_BUTTON_COLOR}
                            border="1px solid"
                            borderColor={CREATE_FORM_BUTTON_COLOR}
                            color={COLORS.white}
                            fontSize="18px"
                            fontWeight={600}
                            fontFamily="'Open Sans', sans-serif"
                            borderRadius="8px"
                            px="20px"
                            py="12px"
                            gap="8px"
                            lineHeight="20px"
                            boxShadow="0px 1px 2px rgba(10, 13, 18, 0.05)"
                            justifyContent="center"
                            alignItems="center"
                            onClick={() =>
                              handleCreateForm(section.formId as string, section.heading)
                            }
                            disabled={creatingFormId === section.formId}
                            opacity={creatingFormId === section.formId ? 0.75 : 1}
                            _hover={{ bg: '#034c53' }}
                            _active={{ bg: '#02353d' }}
                          >
                            <Text as="span">
                              {creatingFormId === section.formId ? 'Creating…' : 'Create Form'}
                            </Text>
                            <Image
                              src="/plus-circle.png"
                              alt="Create form"
                              width={20}
                              height={20}
                            />
                          </Button>
                        )}
                      </Flex>

                      {submissions.length > 0 && (
                        <Box mt="24px">
                          <VStack align="stretch" gap="24px">
                            {submissions.map((submission) => {
                              const status = getFormStatus(submission);
                              const badgeColors =
                                statusColors[status as keyof typeof statusColors] || {};
                              return (
                                <Box
                                  key={submission.id}
                                  border="1px solid"
                                  borderColor={COLORS.gray300}
                                  borderRadius="10px"
                                  p={4}
                                  cursor="pointer"
                                  _hover={{ bg: COLORS.hoverBg }}
                                  onClick={() => handleViewForm(submission.id)}
                                >
                                  <Flex justify="space-between" align="center">
                                    <Box>
                                      <Text
                                        fontSize="16px"
                                        fontWeight="600"
                                        color={COLORS.veniceBlue}
                                      >
                                        {submission.form?.name || 'Untitled Form'}
                                      </Text>
                                      <Text fontSize="14px" color={COLORS.gray500}>
                                        Submitted {formatDate(submission.submittedAt)}
                                      </Text>
                                    </Box>
                                    <Box
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      bg={badgeColors.bg || COLORS.bgGrayLight}
                                    >
                                      <Text
                                        fontSize="14px"
                                        fontWeight="600"
                                        color={badgeColors.text || COLORS.gray700}
                                      >
                                        {getStatusLabel(status)}
                                      </Text>
                                    </Box>
                                  </Flex>
                                </Box>
                              );
                            })}
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        ) : activeTab === 'matches' ? (
          <Box flex="1" p={8} bg="white">
            <Text>Matches content coming soon...</Text>
          </Box>
        ) : null}
      </Flex>
    </ProtectedPage>
  );
}
