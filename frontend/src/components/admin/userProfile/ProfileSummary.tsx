import React from 'react';
import { Box, Flex, Heading, Text, VStack, HStack, IconButton, Input } from '@chakra-ui/react';
import { FiEdit2, FiHeart, FiX, FiCheck } from 'react-icons/fi';
import { COLORS } from '@/constants/colors';
import { formatArray, capitalizeWords } from '@/utils/userProfileUtils';
import { formatDateLong } from '@/utils/dateUtils';
import { ProfileEditData } from '@/types/userProfileTypes';
import { UserData } from '@/types/userTypes';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';

// Options from intake forms
const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe',
];

const PRONOUNS_OPTIONS = [
  'He/Him',
  'She/Her',
  'They/Them',
  'Ze/Zir',
  'Prefer not to answer',
  'Self-describe',
];

const TIMEZONE_OPTIONS = ['NST', 'AST', 'EST', 'CST', 'MST', 'PST'];

const MARITAL_STATUS_OPTIONS = ['Single', 'Married/Common Law', 'Divorced', 'Widowed'];

const HAS_KIDS_OPTIONS = ['Yes', 'No', 'Prefer not to answer'];

const ETHNIC_OPTIONS = [
  'Black (including African and Caribbean descent)',
  'Middle Eastern, Western or Central Asian',
  'East Asian',
  'South Asian',
  'Southeast Asian',
  'Indigenous person from Canada',
  'Latin American',
  'White',
  'Mixed Ethnicity (Individuals who identify with more than one racial/ethnic or cultural group)',
  'Prefer not to answer',
  'Another background/Prefer to self-describe (please specify):',
];

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
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={COLORS.grayBorder}
      mt={6}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="sm" color={COLORS.veniceBlue} fontWeight={600}>
          Profile Summary
        </Heading>
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
            <IconButton
              aria-label="Cancel"
              size="sm"
              variant="ghost"
              color={COLORS.textSecondary}
              onClick={onCancel}
              disabled={isSaving}
              _hover={{ bg: 'gray.100', color: COLORS.textPrimary }}
            >
              <FiX />
            </IconButton>
            <IconButton
              aria-label="Save"
              size="sm"
              bg={COLORS.teal}
              color="white"
              onClick={onSave}
              disabled={isSaving}
              _hover={{ bg: COLORS.tealDarker }}
            >
              <FiCheck />
            </IconButton>
          </HStack>
        )}
      </Flex>
      <VStack align="stretch" gap={4}>
        {/* Name */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Name
          </Text>
          {isEditing ? (
            <HStack gap={2}>
              <Input
                size="sm"
                value={editData.firstName || ''}
                onChange={(e) => onEditDataChange({ ...editData, firstName: e.target.value })}
                placeholder="First Name"
                fontSize="sm"
                border="1px solid"
                borderColor={COLORS.grayBorder}
                borderRadius="6px"
              />
              <Input
                size="sm"
                value={editData.lastName || ''}
                onChange={(e) => onEditDataChange({ ...editData, lastName: e.target.value })}
                placeholder="Last Name"
                fontSize="sm"
                border="1px solid"
                borderColor={COLORS.grayBorder}
                borderRadius="6px"
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
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Email Address
          </Text>
          <Text fontSize="sm" color={COLORS.veniceBlue}>
            {userEmail || userData?.email || 'N/A'}
          </Text>
        </Box>
        {/* Birthday */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Birthday
          </Text>
          {isEditing ? (
            <Input
              type="date"
              size="sm"
              value={editData.dateOfBirth || ''}
              onChange={(e) => onEditDataChange({ ...editData, dateOfBirth: e.target.value })}
              fontSize="sm"
              border="1px solid"
              borderColor={COLORS.grayBorder}
              borderRadius="6px"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.dateOfBirth ? formatDateLong(userData.dateOfBirth) : 'N/A'}
            </Text>
          )}
        </Box>
        {/* Phone Number */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Phone Number
          </Text>
          {isEditing ? (
            <Input
              size="sm"
              value={editData.phone || ''}
              onChange={(e) => onEditDataChange({ ...editData, phone: e.target.value })}
              placeholder="Phone Number"
              fontSize="sm"
              border="1px solid"
              borderColor={COLORS.grayBorder}
              borderRadius="6px"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.phone || 'N/A'}
            </Text>
          )}
        </Box>
        {/* Gender */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Gender
          </Text>
          {isEditing ? (
            <SingleSelectDropdown
              options={GENDER_IDENTITY_OPTIONS}
              selectedValue={editData.genderIdentity || ''}
              onSelectionChange={(value) =>
                onEditDataChange({ ...editData, genderIdentity: value })
              }
              placeholder="Select gender"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.genderIdentity || 'N/A'}
            </Text>
          )}
        </Box>
        {/* Pronouns */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Pronouns
          </Text>
          {isEditing ? (
            <MultiSelectDropdown
              options={PRONOUNS_OPTIONS}
              selectedValues={editData.pronouns || []}
              onSelectionChange={(values) => onEditDataChange({ ...editData, pronouns: values })}
              placeholder="Select pronouns"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {formatArray(userData?.pronouns)}
            </Text>
          )}
        </Box>
        {/* Time Zone */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Time Zone
          </Text>
          {isEditing ? (
            <SingleSelectDropdown
              options={TIMEZONE_OPTIONS}
              selectedValue={editData.timezone || ''}
              onSelectionChange={(value) => onEditDataChange({ ...editData, timezone: value })}
              placeholder="Select time zone"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {userData?.timezone || 'N/A'}
            </Text>
          )}
        </Box>
        {/* Ethnic or Cultural Group */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Ethnic or Cultural Group
          </Text>
          {isEditing ? (
            <MultiSelectDropdown
              options={ETHNIC_OPTIONS}
              selectedValues={editData.ethnicGroup || []}
              onSelectionChange={(values) => onEditDataChange({ ...editData, ethnicGroup: values })}
              placeholder="Select ethnic or cultural group"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {formatArray(userData?.ethnicGroup)}
            </Text>
          )}
        </Box>
        {/* Preferred Language */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Preferred Language
          </Text>
          <Text fontSize="sm" color={COLORS.veniceBlue}>
            N/A
          </Text>
        </Box>
        {/* Marital Status */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Marital Status
          </Text>
          {isEditing ? (
            <SingleSelectDropdown
              options={MARITAL_STATUS_OPTIONS}
              selectedValue={editData.maritalStatus || ''}
              onSelectionChange={(value) => onEditDataChange({ ...editData, maritalStatus: value })}
              placeholder="Select marital status"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {capitalizeWords(userData?.maritalStatus)}
            </Text>
          )}
        </Box>
        {/* Parental Status */}
        <Box>
          <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>
            Parental Status
          </Text>
          {isEditing ? (
            <SingleSelectDropdown
              options={HAS_KIDS_OPTIONS}
              selectedValue={editData.hasKids || ''}
              onSelectionChange={(value) => onEditDataChange({ ...editData, hasKids: value })}
              placeholder="Select parental status"
            />
          ) : (
            <Text fontSize="sm" color={COLORS.veniceBlue}>
              {capitalizeWords(userData?.hasKids)}
            </Text>
          )}
        </Box>

        {/* Divider before Loved One fields */}
        {userData?.caringForSomeone === 'yes' && (
          <>
            <Box borderTop="1px solid" borderColor={COLORS.grayBorder} my={2} />
            <Box>
              <Flex align="center" gap={2} mb={1}>
                <FiHeart size={12} color={COLORS.veniceBlue} />
                <Text fontSize="xs" color={COLORS.textSecondary}>
                  LO&apos;s Gender
                </Text>
              </Flex>
              {isEditing ? (
                <Box ml={4}>
                  <SingleSelectDropdown
                    options={GENDER_IDENTITY_OPTIONS}
                    selectedValue={editData.lovedOneGenderIdentity || ''}
                    onSelectionChange={(value) =>
                      onEditDataChange({ ...editData, lovedOneGenderIdentity: value })
                    }
                    placeholder="Select loved one's gender"
                  />
                </Box>
              ) : (
                <Text fontSize="sm" color={COLORS.veniceBlue} ml={4}>
                  {userData?.lovedOneGenderIdentity || 'N/A'}
                </Text>
              )}
            </Box>
            <Box>
              <Flex align="center" gap={2} mb={1}>
                <FiHeart size={12} color={COLORS.veniceBlue} />
                <Text fontSize="xs" color={COLORS.textSecondary}>
                  LO&apos;s Age
                </Text>
              </Flex>
              {isEditing ? (
                <Input
                  size="sm"
                  value={editData.lovedOneAge || ''}
                  onChange={(e) => onEditDataChange({ ...editData, lovedOneAge: e.target.value })}
                  placeholder="Loved One's Age"
                  fontSize="sm"
                  ml={4}
                  border="1px solid"
                  borderColor={COLORS.grayBorder}
                  borderRadius="6px"
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
