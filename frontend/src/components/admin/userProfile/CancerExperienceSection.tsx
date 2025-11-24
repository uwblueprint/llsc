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
import { COLORS } from '@/constants/colors';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { formatDateLong } from '@/utils/dateUtils';
import { DIAGNOSIS_OPTIONS } from '@/utils/userProfileUtils';
import { CancerEditData } from '@/types/userProfileTypes';
import { UserData } from '@/types/userTypes';

interface CancerExperienceSectionProps {
  userData: UserData | null | undefined;
  editingField: string | null;
  isSaving: boolean;
  editData: CancerEditData;
  treatmentOptions: string[];
  experienceOptions: string[];
  onEditDataChange: (data: CancerEditData) => void;
  onStartEdit: (fieldName: string) => void;
  onCancelEdit: () => void;
  onSave: (fieldName: string) => void;
}

export function CancerExperienceSection({
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
}: CancerExperienceSectionProps) {
  if (userData?.hasBloodCancer !== 'yes') return null;

  return (
    <Box>
      <Heading
        color={COLORS.veniceBlue}
        mb={6}
        fontWeight={600}
        fontSize="22px"
        lineHeight="1.82em"
      >
        Blood cancer experience information
      </Heading>

      <SimpleGrid columns={2} gap={8} position="relative">
        {/* Diagnosis */}
        <Box position="relative" zIndex={editingField === 'diagnosis' ? 20 : 'auto'}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">
              Diagnosis
            </Text>
            {editingField === 'diagnosis' ? (
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
                  onClick={() => onSave('diagnosis')}
                  loading={isSaving}
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
                onClick={() => onStartEdit('diagnosis')}
              >
                Edit
              </Button>
            )}
          </Flex>
          {editingField === 'diagnosis' ? (
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
              {userData?.diagnosis ? (
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
                  {userData.diagnosis}
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

        {/* Date of Diagnosis */}
        <Box>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">
              Date of Diagnosis
            </Text>
            {editingField === 'dateOfDiagnosis' ? (
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
                  onClick={() => onSave('dateOfDiagnosis')}
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
                onClick={() => onStartEdit('dateOfDiagnosis')}
              >
                Edit
              </Button>
            )}
          </Flex>
          {editingField === 'dateOfDiagnosis' ? (
            <Input
              type="date"
              value={editData.dateOfDiagnosis || ''}
              onChange={(e) => onEditDataChange({ ...editData, dateOfDiagnosis: e.target.value })}
              fontSize="16px"
            />
          ) : (
            <Text color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.875em">
              {userData?.dateOfDiagnosis ? formatDateLong(userData.dateOfDiagnosis) : 'N/A'}
            </Text>
          )}
        </Box>

        {/* Treatments */}
        <Box position="relative" zIndex={editingField === 'treatments' ? 20 : 'auto'}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">
              Treatments
            </Text>
            {editingField === 'treatments' ? (
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
                  onClick={() => onSave('treatments')}
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
                onClick={() => onStartEdit('treatments')}
              >
                Edit
              </Button>
            )}
          </Flex>
          {editingField === 'treatments' ? (
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
              {userData?.treatments?.length ? (
                userData.treatments.map((t) => (
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

        {/* Experiences */}
        <Box position="relative" zIndex={editingField === 'experiences' ? 20 : 'auto'}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">
              Experiences
            </Text>
            {editingField === 'experiences' ? (
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
                  onClick={() => onSave('experiences')}
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
                onClick={() => onStartEdit('experiences')}
              >
                Edit
              </Button>
            )}
          </Flex>
          {editingField === 'experiences' ? (
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
              {userData?.experiences?.length ? (
                userData.experiences.map((e) => (
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
  );
}
