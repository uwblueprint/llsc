import React from 'react';
import { Box, Flex, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { UserRole } from '@/types/authTypes';
import { COLORS } from '@/constants/colors';
import { UserResponse } from '@/types/userTypes';
import { UserData, VolunteerData } from '@/types/userTypes';
import { CancerExperienceSection } from './CancerExperienceSection';
import { LovedOneSection } from './LovedOneSection';
import { AvailabilitySection } from './AvailabilitySection';
import { CancerEditData, LovedOneEditData } from '@/types/userProfileTypes';

interface ProfileContentProps {
  user: UserResponse;
  role: UserRole;
  userData: UserData | null | undefined;
  volunteerData: VolunteerData | null | undefined;
  editingField: string | null;
  isSaving: boolean;
  cancerEditData: CancerEditData;
  lovedOneEditData: LovedOneEditData;
  treatmentOptions: string[];
  experienceOptions: string[];
  isEditingAvailability: boolean;
  selectedTimeSlots: Set<string>;
  isDragging: boolean;
  dragStart: { dayIndex: number; timeIndex: number } | null;
  getDragRangeSlots: () => Set<string>;
  isSavingAvailability?: boolean;
  onCancerEditDataChange: (data: CancerEditData) => void;
  onLovedOneEditDataChange: (data: LovedOneEditData) => void;
  onStartEditField: (fieldName: string, isLovedOne?: boolean) => void;
  onCancelEditField: () => void;
  onSaveField: (fieldName: string, isLovedOne?: boolean) => void;
  onStartEditAvailability: () => void;
  onCancelEditAvailability: () => void;
  onSaveAvailability: () => void;
  onMouseDown: (dayIndex: number, timeIndex: number) => void;
  onMouseMove: (dayIndex: number, timeIndex: number) => void;
  onMouseUp: () => void;
}

export function ProfileContent({
  user,
  role,
  userData,
  volunteerData,
  editingField,
  isSaving,
  cancerEditData,
  lovedOneEditData,
  treatmentOptions,
  experienceOptions,
  isEditingAvailability,
  selectedTimeSlots,
  isDragging,
  dragStart,
  getDragRangeSlots,
  isSavingAvailability = false,
  onCancerEditDataChange,
  onLovedOneEditDataChange,
  onStartEditField,
  onCancelEditField,
  onSaveField,
  onStartEditAvailability,
  onCancelEditAvailability,
  onSaveAvailability,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: ProfileContentProps) {
  return (
    <Box flex="1" p={8} bg="white">
      <Box maxW="1000px">
        {/* Header Section */}
        <Flex justify="space-between" align="start" mb={8}>
          <Box>
            <Heading
              color={COLORS.veniceBlue}
              fontWeight={600}
              fontSize="34px"
              lineHeight="1.36em"
              letterSpacing="-0.015em"
              mb={1}
            >
              {user.firstName} {user.lastName}
            </Heading>
            <Text
              color={COLORS.textSecondary}
              fontSize="20px"
              fontWeight={600}
              lineHeight="1.36em"
              letterSpacing="-0.015em"
              textTransform="capitalize"
              mt={1}
            >
              {role}
            </Text>
          </Box>
          <VStack align="flex-end" gap={2}>
            <Button
              variant="ghost"
              color={COLORS.red}
              _hover={{ textDecoration: 'underline', bg: 'transparent' }}
              fontSize="sm"
              fontWeight={400}
              p={0}
              h="auto"
              textDecoration="underline"
            >
              Deactivate Account
            </Button>
            <Button
              bg={COLORS.red}
              color="white"
              _hover={{ bg: '#8a0000' }}
              fontSize="sm"
              fontWeight={600}
              px={8}
              py={3}
              borderRadius="md"
            >
              Delete Account
            </Button>
          </VStack>
        </Flex>

        {/* Overview - Only for Volunteers */}
        {role === UserRole.VOLUNTEER && (
          <>
            <Box mb={10}>
              <Heading
                color={COLORS.veniceBlue}
                mb={2}
                fontWeight={600}
                fontSize="16px"
                lineHeight="1.875em"
              >
                Overview
              </Heading>
              <Text color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.36em">
                {volunteerData?.experience || userData?.additionalInfo || 'No overview provided.'}
              </Text>
            </Box>

            <Box borderBottom="1px solid" borderColor={COLORS.grayBorder} mb={8} />
          </>
        )}

        {/* Detailed Info */}
        <VStack align="stretch" gap={8}>
          {/* User's Own Cancer Experience */}
          <CancerExperienceSection
            userData={userData}
            editingField={editingField}
            isSaving={isSaving}
            editData={cancerEditData}
            treatmentOptions={treatmentOptions}
            experienceOptions={experienceOptions}
            onEditDataChange={onCancerEditDataChange}
            onStartEdit={onStartEditField}
            onCancelEdit={onCancelEditField}
            onSave={onSaveField}
          />

          {/* Loved One Info */}
          <LovedOneSection
            userData={userData}
            editingField={editingField}
            isSaving={isSaving}
            editData={lovedOneEditData}
            treatmentOptions={treatmentOptions}
            experienceOptions={experienceOptions}
            onEditDataChange={onLovedOneEditDataChange}
            onStartEdit={onStartEditField}
            onCancelEdit={onCancelEditField}
            onSave={onSaveField}
          />

          {/* Availability - Only for Volunteers */}
          {role === UserRole.VOLUNTEER && (
            <AvailabilitySection
              user={user}
              isEditing={isEditingAvailability}
              isSaving={isSavingAvailability}
              selectedTimeSlots={selectedTimeSlots}
              isDragging={isDragging}
              dragStart={dragStart}
              getDragRangeSlots={getDragRangeSlots}
              onStartEdit={onStartEditAvailability}
              onCancelEdit={onCancelEditAvailability}
              onSave={onSaveAvailability}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
            />
          )}
        </VStack>
      </Box>
    </Box>
  );
}
