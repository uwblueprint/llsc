import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  IconButton,
  Input,
} from '@chakra-ui/react';
import { FiEdit2, FiHeart } from 'react-icons/fi';
import { COLORS } from '@/constants/colors';
import { formatArray, capitalizeWords } from '@/utils/userProfileUtils';
import { formatDateLong } from '@/utils/dateUtils';
import { ProfileEditData } from '@/types/userProfileTypes';
import { UserData } from '@/types/userTypes';

interface ProfileSummaryProps {
  userData: UserData | null | undefined;
  userEmail?: string;
  isEditing: boolean;
  isSaving: boolean;
  editData: ProfileEditData;
  onEditDataChange: (data: ProfileEditData) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ProfileSummary({
  userData,
  userEmail,
  isEditing,
  isSaving,
  editData,
  onEditDataChange,
  onStartEdit,
  onSave,
  onCancel,
}: ProfileSummaryProps) {
  return (
    <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor={COLORS.grayBorder} mt={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="sm" color={COLORS.veniceBlue} fontWeight={600}>Profile Summary</Heading>
        {!isEditing ? (
          <IconButton 
            aria-label="Edit" 
            variant="ghost" 
            size="sm" 
            color={COLORS.veniceBlue} 
            _hover={{ bg: 'blue.50', color: COLORS.veniceBlue }}
            onClick={onStartEdit}
          >
            <FiEdit2 />
          </IconButton>
        ) : (
          <HStack gap={2}>
            <Button 
              size="sm" 
              variant="ghost" 
              color={COLORS.veniceBlue}
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              bg={COLORS.teal} 
              color="white"
              onClick={onSave}
              loading={isSaving}
              _hover={{ bg: COLORS.tealDarker }}
            >
              Save
            </Button>
          </HStack>
        )}
      </Flex>
      <VStack align="stretch" gap={4}>
        {/* Name */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Name</Text>
          {isEditing ? (
            <HStack gap={2}>
              <Input
                size="sm"
                value={editData.firstName || ''}
                onChange={(e) => onEditDataChange({ ...editData, firstName: e.target.value })}
                placeholder="First Name"
                fontSize="sm"
              />
              <Input
                size="sm"
                value={editData.lastName || ''}
                onChange={(e) => onEditDataChange({ ...editData, lastName: e.target.value })}
                placeholder="Last Name"
                fontSize="sm"
              />
            </HStack>
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.firstName || ''} {userData?.lastName || ''}
            </Text>
          )}
        </Box>
        {/* Email Address - Read only */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Email Address</Text>
          <Text fontSize="sm" color={COLORS.veniceBlue}>{userEmail || userData?.email || 'N/A'}</Text>
        </Box>
        {/* Birthday */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Birthday</Text>
          {isEditing ? (
            <Input
              type="date"
              size="sm"
              value={editData.dateOfBirth || ''}
              onChange={(e) => onEditDataChange({ ...editData, dateOfBirth: e.target.value })}
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.dateOfBirth ? formatDateLong(userData.dateOfBirth) : 'N/A'}
            </Text>
          )}
        </Box>
        {/* Phone Number */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Phone Number</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.phone || ''}
              onChange={(e) => onEditDataChange({ ...editData, phone: e.target.value })}
              placeholder="Phone Number"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.phone || 'N/A'}</Text>
          )}
        </Box>
        {/* Gender */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Gender</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.genderIdentity || ''}
              onChange={(e) => onEditDataChange({ ...editData, genderIdentity: e.target.value })}
              placeholder="Gender"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.genderIdentity || 'N/A'}</Text>
          )}
        </Box>
        {/* Pronouns */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Pronouns</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.pronouns?.join(', ') || ''}
              onChange={(e) => onEditDataChange({ 
                ...editData, 
                pronouns: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              })}
              placeholder="Pronouns (comma-separated)"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{formatArray(userData?.pronouns)}</Text>
          )}
        </Box>
        {/* Time Zone */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Time Zone</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.timezone || ''}
              onChange={(e) => onEditDataChange({ ...editData, timezone: e.target.value })}
              placeholder="Time Zone"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.timezone || 'N/A'}</Text>
          )}
        </Box>
        {/* Ethnic or Cultural Group */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Ethnic or Cultural Group</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.ethnicGroup?.join(', ') || ''}
              onChange={(e) => onEditDataChange({ 
                ...editData, 
                ethnicGroup: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
              })}
              placeholder="Ethnic or Cultural Group (comma-separated)"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{formatArray(userData?.ethnicGroup)}</Text>
          )}
        </Box>
        {/* Preferred Language */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Preferred Language</Text>
          <Text fontSize="sm" color={COLORS.veniceBlue}>N/A</Text>
        </Box>
        {/* Marital Status */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Marital Status</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.maritalStatus || ''}
              onChange={(e) => onEditDataChange({ ...editData, maritalStatus: e.target.value })}
              placeholder="Marital Status"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{capitalizeWords(userData?.maritalStatus)}</Text>
          )}
        </Box>
        {/* Parental Status */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Parental Status</Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.hasKids || ''}
              onChange={(e) => onEditDataChange({ ...editData, hasKids: e.target.value })}
              placeholder="Parental Status"
              fontSize="sm"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>{capitalizeWords(userData?.hasKids)}</Text>
          )}
        </Box>
        
        {/* Divider before Loved One fields */}
        {userData?.caringForSomeone === 'yes' && (
          <>
            <Box borderTop="1px solid" borderColor={COLORS.grayBorder} my={2} />
            <Box>
              <Flex align="center" gap={2} mb={1}>
                <FiHeart size={12} color={COLORS.veniceBlue} />
                <Text fontSize="xs" color={COLORS.textSecondary}>LO&apos;s Gender</Text>
              </Flex>
              {isEditing ? (
                <Input
                  size="sm"
                  value={editData.lovedOneGenderIdentity || ''}
                  onChange={(e) => onEditDataChange({ ...editData, lovedOneGenderIdentity: e.target.value })}
                  placeholder="Loved One's Gender"
                  fontSize="sm"
                  ml={4}
                />
              ) : (
                <Text fontSize="sm" color={COLORS.veniceBlue} ml={4}>
                  {userData?.lovedOneGenderIdentity || 'N/A'}
                </Text>
              )}
            </Box>
            <Box>
              <Flex align="center" gap={2} mb={1}>
                <FiHeart size={12} color={COLORS.veniceBlue} />
                <Text fontSize="xs" color={COLORS.textSecondary}>LO&apos;s Age</Text>
              </Flex>
              {isEditing ? (
                <Input
                  size="sm"
                  value={editData.lovedOneAge || ''}
                  onChange={(e) => onEditDataChange({ ...editData, lovedOneAge: e.target.value })}
                  placeholder="Loved One's Age"
                  fontSize="sm"
                  ml={4}
                />
              ) : (
                <Text fontSize="sm" color={COLORS.veniceBlue} ml={4}>
                  {userData?.lovedOneAge || 'N/A'}
                </Text>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
}

