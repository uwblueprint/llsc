import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Input,
} from '@chakra-ui/react';
import { FiHeart } from 'react-icons/fi';
import { COLORS } from '@/constants/colors';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { formatDateLong } from '@/utils/dateUtils';
import { DIAGNOSIS_OPTIONS } from '@/utils/userProfileUtils';
import { LovedOneEditData } from '@/types/userProfileTypes';
import { UserData } from '@/types/userTypes';

interface LovedOneSectionProps {
  userData: UserData | null | undefined;
  editingField: string | null;
  isSaving: boolean;
  editData: LovedOneEditData;
  treatmentOptions: string[];
  experienceOptions: string[];
  onEditDataChange: (data: LovedOneEditData) => void;
  onStartEdit: (fieldName: string, isLovedOne: boolean) => void;
  onCancelEdit: () => void;
  onSave: (fieldName: string, isLovedOne: boolean) => void;
}

export function LovedOneSection({
  userData,
  editingField,
  isSaving,
  editData,
  treatmentOptions,
  experienceOptions,
  onEditDataChange,
  onStartEdit,
  onCancelEdit,
  onSave,
}: LovedOneSectionProps) {
  if (userData?.caringForSomeone !== 'yes') return null;

  const hasOwnCancer = userData?.hasBloodCancer === 'yes';

  return (
    <>
      {/* Divider between user's own info and loved one info */}
      {hasOwnCancer && <Box borderBottom="1px solid" borderColor={COLORS.grayBorder} />}

      <Box>
        {!hasOwnCancer && (
          <Heading
            color={COLORS.veniceBlue}
            mb={6}
            fontWeight={600}
            fontSize="22px"
            lineHeight="1.82em"
          >
            Blood cancer experience information
          </Heading>
        )}
        {hasOwnCancer && (
          <Heading
            color={COLORS.veniceBlue}
            mb={6}
            fontWeight={600}
            fontSize="22px"
            lineHeight="1.82em"
          >
            Loved One&apos;s Blood cancer experience information
          </Heading>
        )}
        <SimpleGrid columns={2} gap={8}>
          {/* Loved One's Diagnosis */}
          <Box>
            <Flex align="center" justify="space-between" mb={2}>
              <Flex align="center" gap={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontWeight={600}
                  color={COLORS.veniceBlue}
                  fontSize="16px"
                  lineHeight="1.875em"
                >
                  Loved One&apos;s Diagnosis
                </Text>
              </Flex>
              {editingField === 'lovedOneDiagnosis' ? (
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    fontSize="sm"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    bg={COLORS.teal}
                    color="white"
                    fontSize="sm"
                    fontWeight={500}
                    px={4.5}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={COLORS.teal}
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                    onClick={() => onSave('lovedOneDiagnosis', true)}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  bg={COLORS.teal}
                  color="white"
                  fontSize="sm"
                  fontWeight={500}
                  px={4.5}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={COLORS.teal}
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                  onClick={() => onStartEdit('lovedOneDiagnosis', true)}
                >
                  Edit
                </Button>
              )}
            </Flex>
            {editingField === 'lovedOneDiagnosis' ? (
              <Box>
                <SingleSelectDropdown
                  options={DIAGNOSIS_OPTIONS}
                  selectedValue={editData.diagnosis || ''}
                  onSelectionChange={(value) => onEditDataChange({ ...editData, diagnosis: value })}
                  placeholder="Select diagnosis"
                  allowClear={false}
                />
              </Box>
            ) : (
              <Flex gap={2} flexWrap="wrap">
                {userData?.lovedOneDiagnosis ? (
                  <Badge
                    bg={COLORS.bgTealLight}
                    color={COLORS.tealDarker}
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="14px"
                    fontWeight={400}
                    lineHeight="1.43em"
                  >
                    {userData.lovedOneDiagnosis}
                  </Badge>
                ) : (
                  <Text
                    color={COLORS.textSecondary}
                    fontSize="16px"
                    fontWeight={400}
                    lineHeight="1.5em"
                  >
                    N/A
                  </Text>
                )}
              </Flex>
            )}
          </Box>

          {/* Loved One's Date of Diagnosis */}
          <Box>
            <Flex align="center" justify="space-between" mb={2}>
              <Flex align="center" gap={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontWeight={600}
                  color={COLORS.veniceBlue}
                  fontSize="16px"
                  lineHeight="1.875em"
                >
                  Loved One&apos;s Date of Diagnosis
                </Text>
              </Flex>
              {editingField === 'lovedOneDateOfDiagnosis' ? (
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    fontSize="sm"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    bg={COLORS.teal}
                    color="white"
                    fontSize="sm"
                    fontWeight={500}
                    px={4.5}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={COLORS.teal}
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                    onClick={() => onSave('lovedOneDateOfDiagnosis', true)}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  bg={COLORS.teal}
                  color="white"
                  fontSize="sm"
                  fontWeight={500}
                  px={4.5}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={COLORS.teal}
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                  onClick={() => onStartEdit('lovedOneDateOfDiagnosis', true)}
                >
                  Edit
                </Button>
              )}
            </Flex>
            {editingField === 'lovedOneDateOfDiagnosis' ? (
              <Input
                type="date"
                value={editData.dateOfDiagnosis || ''}
                onChange={(e) => onEditDataChange({ ...editData, dateOfDiagnosis: e.target.value })}
                fontSize="16px"
              />
            ) : (
              <Text
                color={COLORS.textPrimary}
                fontSize="16px"
                fontWeight={400}
                lineHeight="1.875em"
              >
                {userData?.lovedOneDateOfDiagnosis
                  ? formatDateLong(userData.lovedOneDateOfDiagnosis)
                  : 'N/A'}
              </Text>
            )}
          </Box>

          {/* Treatments Loved One Has Done */}
          <Box position="relative" zIndex={editingField === 'lovedOneTreatments' ? 20 : 'auto'}>
            <Flex justify="space-between" align="center" mb={2}>
              <Flex align="center" gap={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontWeight={600}
                  color={COLORS.veniceBlue}
                  fontSize="16px"
                  lineHeight="1.875em"
                >
                  Treatments Loved One Has Done
                </Text>
              </Flex>
              {editingField === 'lovedOneTreatments' ? (
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    fontSize="sm"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    bg={COLORS.teal}
                    color="white"
                    fontSize="sm"
                    fontWeight={500}
                    px={4.5}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={COLORS.teal}
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                    onClick={() => onSave('lovedOneTreatments', true)}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  bg={COLORS.teal}
                  color="white"
                  fontSize="sm"
                  fontWeight={500}
                  px={4.5}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={COLORS.teal}
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                  onClick={() => onStartEdit('lovedOneTreatments', true)}
                >
                  Edit
                </Button>
              )}
            </Flex>
            {editingField === 'lovedOneTreatments' ? (
              <Box position="relative" zIndex={10}>
                <MultiSelectDropdown
                  options={treatmentOptions}
                  selectedValues={editData.treatments || []}
                  onSelectionChange={(values) =>
                    onEditDataChange({ ...editData, treatments: values })
                  }
                  placeholder="Select treatments"
                />
              </Box>
            ) : (
              <VStack align="start" gap={1}>
                {userData?.lovedOneTreatments?.length ? (
                  userData.lovedOneTreatments.map((t) => (
                    <Text
                      key={t.id}
                      color={COLORS.textPrimary}
                      fontSize="16px"
                      fontWeight={400}
                      lineHeight="1.5em"
                    >
                      {t.name}
                    </Text>
                  ))
                ) : (
                  <Text
                    color={COLORS.textSecondary}
                    fontSize="16px"
                    fontWeight={400}
                    lineHeight="1.5em"
                  >
                    None listed
                  </Text>
                )}
              </VStack>
            )}
          </Box>

          {/* Experiences Loved One Had */}
          <Box position="relative" zIndex={editingField === 'lovedOneExperiences' ? 20 : 'auto'}>
            <Flex justify="space-between" align="center" mb={2}>
              <Flex align="center" gap={2}>
                <FiHeart size={14} color={COLORS.veniceBlue} />
                <Text
                  fontWeight={600}
                  color={COLORS.veniceBlue}
                  fontSize="16px"
                  lineHeight="1.875em"
                >
                  Experiences Loved One Had
                </Text>
              </Flex>
              {editingField === 'lovedOneExperiences' ? (
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    fontSize="sm"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    bg={COLORS.teal}
                    color="white"
                    fontSize="sm"
                    fontWeight={500}
                    px={4.5}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={COLORS.teal}
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                    onClick={() => onSave('lovedOneExperiences', true)}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  bg={COLORS.teal}
                  color="white"
                  fontSize="sm"
                  fontWeight={500}
                  px={4.5}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={COLORS.teal}
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                  onClick={() => onStartEdit('lovedOneExperiences', true)}
                >
                  Edit
                </Button>
              )}
            </Flex>
            {editingField === 'lovedOneExperiences' ? (
              <Box position="relative" zIndex={10}>
                <MultiSelectDropdown
                  options={experienceOptions}
                  selectedValues={editData.experiences || []}
                  onSelectionChange={(values) =>
                    onEditDataChange({ ...editData, experiences: values })
                  }
                  placeholder="Select experiences"
                />
              </Box>
            ) : (
              <VStack align="start" gap={1}>
                {userData?.lovedOneExperiences?.length ? (
                  userData.lovedOneExperiences.map((e) => (
                    <Text
                      key={e.id}
                      color={COLORS.textPrimary}
                      fontSize="16px"
                      fontWeight={400}
                      lineHeight="1.5em"
                    >
                      {e.name}
                    </Text>
                  ))
                ) : (
                  <Text
                    color={COLORS.textSecondary}
                    fontSize="16px"
                    fontWeight={400}
                    lineHeight="1.5em"
                  >
                    None listed
                  </Text>
                )}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </>
  );
}
