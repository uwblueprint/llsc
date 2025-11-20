import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  Text,
  Spinner,
} from '@chakra-ui/react';
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

export default function AdminUserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  
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


  const role = roleIdToUserRole(user.roleId);
  const userData = user.userData;
  const volunteerData = user.volunteerData;

  // Determine active tab based on route or query param
  const activeTab = router.query.tab as string || 'profile';
  
  const handleTabChange = (tab: string) => {
    router.push({ pathname: router.pathname, query: { ...router.query, tab } }, undefined, { shallow: true });
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
            />
          ) : activeTab === 'forms' ? (
            <Box flex="1" p={8} bg="white">
              <Text>Forms content coming soon...</Text>
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
