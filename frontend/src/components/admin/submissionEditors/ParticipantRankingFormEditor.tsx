import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VStack, HStack, Text, Box, Spinner, Textarea, SimpleGrid } from '@chakra-ui/react';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { DragIcon } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { COLORS as FORM_COLORS } from '@/constants/form';
import { COLORS as UI_COLORS } from '@/constants/colors';
import { VOLUNTEER_RANKING_LABELS, LOVED_ONE_RANKING_LABELS } from '@/constants/ranking';
import {
  ParticipantRankingAnswers,
  RankingEntry,
  RankingOption,
  RankingOptionsResponse,
  normalizeParticipantRankingAnswers,
  buildRankingPreviewStatement,
  buildQualitySummaryLabel,
  buildLegacyRankingOptions,
  transformRankingOptionsResponse,
  buildRankingStatement,
} from '@/utils/adminFormHelpers/ranking';
import { SectionCard } from './SectionCard';
import { TEXTAREA_STYLES } from './shared';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const inferKindFromLabel = (label: string): 'quality' | 'experience' | 'treatment' => {
  const normalized = label.toLowerCase();
  if (normalized.startsWith('experience with oral') || normalized.includes('chemotherapy')) {
    return 'treatment';
  }
  if (normalized.startsWith('experience with')) {
    return 'experience';
  }
  return 'quality';
};

const buildBaseOption = (label: string, scope: 'self' | 'loved_one'): RankingOption => {
  const kind = inferKindFromLabel(label);
  return {
    key: `${scope}-${slugify(label)}`,
    label,
    statement: buildRankingStatement(label, kind, scope),
    scope,
    kind,
  };
};

const DEFAULT_RANKING_OPTIONS: RankingOption[] = [
  ...VOLUNTEER_RANKING_LABELS.map((label) => buildBaseOption(label, 'self')),
  ...LOVED_ONE_RANKING_LABELS.map((label) => buildBaseOption(label, 'loved_one')),
];

interface ParticipantRankingFormEditorProps {
  initialAnswers: ParticipantRankingAnswers;
  onChange?: (answers: ParticipantRankingAnswers, hasChanges: boolean) => void;
}

export const ParticipantRankingFormEditor: React.FC<ParticipantRankingFormEditorProps> = ({
  initialAnswers,
  onChange,
}) => {
  const normalizedInitial = useMemo(
    () => normalizeParticipantRankingAnswers(initialAnswers),
    [initialAnswers],
  );
  const [formData, setFormData] = useState<ParticipantRankingAnswers>(normalizedInitial);
  const [baselineData, setBaselineData] = useState<ParticipantRankingAnswers>(normalizedInitial);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [rankingOptions, setRankingOptions] = useState<RankingOption[]>([]);
  const [isLoadingRankingOptions, setIsLoadingRankingOptions] = useState(false);
  const [rankingOptionsError, setRankingOptionsError] = useState<string | null>(null);
  const legacyOptionsRef = useRef<RankingOption[]>(buildLegacyRankingOptions(normalizedInitial));

  useEffect(() => {
    setFormData(normalizedInitial);
    setBaselineData(normalizedInitial);
    legacyOptionsRef.current = buildLegacyRankingOptions(normalizedInitial);
  }, [normalizedInitial]);

  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(baselineData);
    onChange?.(formData, dirty);
  }, [formData, baselineData, onChange]);

  const rankingTarget = useMemo<'patient' | 'caregiver'>(() => {
    if (formData.participantType === 'caregiver' || formData.isCaregiverVolunteerFlow) {
      return 'caregiver';
    }
    return 'patient';
  }, [formData.participantType, formData.isCaregiverVolunteerFlow]);

  useEffect(() => {
    let isMounted = true;

    const fetchRankingOptions = async () => {
      setIsLoadingRankingOptions(true);
      setRankingOptionsError(null);
      try {
        const { data } = await baseAPIClient.get<RankingOptionsResponse>('/ranking/options', {
          params: { target: rankingTarget },
        });
        if (!isMounted) {
          return;
        }
        setRankingOptions(transformRankingOptionsResponse(data));
      } catch {
        if (!isMounted) {
          return;
        }
        setRankingOptions([]);
        setRankingOptionsError('Unable to load volunteer qualities. Showing existing selections.');
      } finally {
        if (isMounted) {
          setIsLoadingRankingOptions(false);
        }
      }
    };

    fetchRankingOptions();

    return () => {
      isMounted = false;
    };
  }, [rankingTarget]);

  const updateRankingRows = (updater: (rows: RankingEntry[]) => RankingEntry[]) => {
    setFormData((prev) => {
      const currentRows = prev.rankings || [];
      const updated = updater(currentRows);
      const normalizedRows = updated.map((row, index) => ({
        ...row,
        label: row.label || `Preference ${index + 1}`,
        rank: index + 1,
      }));
      return {
        ...prev,
        rankings: normalizedRows,
        rankedPreferences: normalizedRows.map((row) => row.label),
      };
    });
  };

  const handleRankingReorder = (fromIndex: number, toIndex: number) => {
    updateRankingRows((rows) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
        return rows;
      }
      const next = [...rows];
      if (!next[fromIndex] || (!next[toIndex] && toIndex !== next.length)) {
        return rows;
      }
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (event: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      handleRankingReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const rankingRows = useMemo(
    () => [...(formData.rankings || [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
    [formData.rankings],
  );

  const selectedQualities = useMemo(
    () => formData.selectedQualities || [],
    [formData.selectedQualities],
  );

  const { qualityOptions, optionLookup } = useMemo(() => {
    const combined: RankingOption[] = [];
    const dedupeMap = new Map<string, RankingOption>();
    const aliasMap: Record<string, RankingOption> = {};

    const registerOption = (option: RankingOption) => {
      const normalizedScope = option.scope === 'loved_one' ? 'loved_one' : 'self';
      const normalizedKind =
        option.kind === 'experience' || option.kind === 'treatment' ? option.kind : 'quality';
      const baseStatement =
        option.statement || buildRankingStatement(option.label, normalizedKind, normalizedScope);
      const summary = buildQualitySummaryLabel(baseStatement || option.label);
      const dedupeKey = `${normalizedScope}:${summary.toLowerCase()}`;

      const existing = dedupeMap.get(dedupeKey);
      if (existing) {
        aliasMap[option.key] = existing;
        return existing;
      }

      const normalizedOption: RankingOption = {
        ...option,
        scope: normalizedScope,
        kind: normalizedKind,
        label: option.label,
        statement: baseStatement,
      };
      dedupeMap.set(dedupeKey, normalizedOption);
      aliasMap[option.key] = normalizedOption;
      combined.push(normalizedOption);
      return normalizedOption;
    };

    DEFAULT_RANKING_OPTIONS.forEach(registerOption);
    rankingOptions.forEach(registerOption);
    legacyOptionsRef.current.forEach(registerOption);

    (formData.selectedQualities || []).forEach((key, index) => {
      if (aliasMap[key]) {
        return;
      }
      const fallbackEntry = formData.rankings?.[index];
      const scope = (fallbackEntry?.scope === 'loved_one' ? 'loved_one' : 'self') as
        | 'self'
        | 'loved_one';
      const kind = (
        fallbackEntry?.kind === 'experience' || fallbackEntry?.kind === 'treatment'
          ? fallbackEntry.kind
          : 'quality'
      ) as 'quality' | 'experience' | 'treatment';
      const shortLabel = buildQualitySummaryLabel(fallbackEntry?.label || key);
      registerOption({
        key,
        label: shortLabel,
        statement: fallbackEntry?.label || buildRankingStatement(shortLabel, kind, scope),
        scope,
        kind,
      });
    });

    if (!combined.length) {
      (formData.rankings || []).forEach((row, index) => {
        const key = row.label || `existing-${index}`;
        const scope = (row.scope === 'loved_one' ? 'loved_one' : 'self') as 'self' | 'loved_one';
        const kind = (
          row.kind === 'experience' || row.kind === 'treatment' ? row.kind : 'quality'
        ) as 'quality' | 'experience' | 'treatment';
        const shortLabel = buildQualitySummaryLabel(row.label || key);
        registerOption({
          key,
          label: shortLabel,
          statement: row.label || buildRankingStatement(shortLabel, kind, scope),
          scope,
          kind,
        });
      });
    }

    const optionLookup: Record<string, RankingOption> = {};
    combined.forEach((option) => {
      optionLookup[option.key] = option;
    });
    Object.entries(aliasMap).forEach(([key, value]) => {
      optionLookup[key] = value;
    });

    return { qualityOptions: combined, optionLookup };
  }, [rankingOptions, formData.selectedQualities, formData.rankings]);

  const volunteerOptions = useMemo(
    () => qualityOptions.filter((option) => option.scope === 'self'),
    [qualityOptions],
  );
  const lovedOneOptions = useMemo(
    () => qualityOptions.filter((option) => option.scope === 'loved_one'),
    [qualityOptions],
  );

  const handleQualityToggle = useCallback(
    (key: string) => {
      setFormData((prev) => {
        const currentKeys = prev.selectedQualities || [];
        const exists = currentKeys.includes(key);

        if (!exists && currentKeys.length >= 5) {
          return prev;
        }

        const nextKeys = exists
          ? currentKeys.filter((item) => item !== key)
          : [...currentKeys, key];

        const keyToEntry: Record<string, RankingEntry | undefined> = {};
        currentKeys.forEach((existingKey, index) => {
          keyToEntry[existingKey] = prev.rankings?.[index];
        });

        const nextRankings = nextKeys.map((selectedKey, index) => {
          const preserved = keyToEntry[selectedKey];
          if (preserved) {
            return { ...preserved, rank: index + 1 };
          }
          const option = optionLookup[selectedKey];
          if (option) {
            return {
              label: option.statement,
              rank: index + 1,
              scope: option.scope,
              kind: option.kind,
            };
          }
          const summary = buildQualitySummaryLabel(selectedKey);
          return {
            label: buildRankingStatement(summary),
            rank: index + 1,
          };
        });

        return {
          ...prev,
          selectedQualities: nextKeys,
          rankings: nextRankings,
          rankedPreferences: nextRankings.map((entry) => entry.label),
        };
      });
    },
    [optionLookup],
  );

  const renderOptionLabel = useCallback(
    (option: RankingOption) => option.label || buildQualitySummaryLabel(option.statement || ''),
    [],
  );

  const hasRankingRows = rankingRows.length > 0;
  const hasAdditionalNotes =
    typeof formData.additionalNotes === 'string' && formData.additionalNotes.trim().length > 0;

  return (
    <VStack align="stretch" gap="10" maxW="900px" mx="auto" width="100%">
      <SectionCard title="Relevant Qualities in a Volunteer">
        {rankingOptionsError && (
          <Text color="red.500" fontSize="12px" mb={2}>
            {rankingOptionsError}
          </Text>
        )}
        {isLoadingRankingOptions ? (
          <HStack gap={3}>
            <Spinner size="sm" />
            <Text color={FORM_COLORS.fieldGray} fontSize="13px">
              Loading volunteer qualities...
            </Text>
          </HStack>
        ) : qualityOptions.length ? (
          <VStack align="stretch" gap={6}>
            <Text color={FORM_COLORS.fieldGray} fontSize="14px">
              You will be ranking these qualities in the next step. Note that the volunteer is
              guaranteed to speak the participant’s language and match their availability.
            </Text>
            <Box>
              <Text color={UI_COLORS.veniceBlue} fontSize="14px" fontWeight={600} mb={1}>
                I would prefer that... *
              </Text>
              <Text color={FORM_COLORS.fieldGray} fontSize="12px">
                You can select a maximum of five across both categories. Please select at least one
                quality.
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
              {volunteerOptions.length > 0 && (
                <Box>
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={3}>
                    The volunteer is/has...
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {volunteerOptions.map((option) => {
                      const isChecked = selectedQualities.includes(option.key);
                      const isDisabled = !isChecked && selectedQualities.length >= 5;
                      return (
                        <Checkbox
                          key={option.key}
                          checked={isChecked}
                          disabled={isDisabled}
                          colorScheme="teal"
                          cursor={isDisabled ? 'not-allowed' : 'pointer'}
                          onChange={() => handleQualityToggle(option.key)}
                        >
                          <Text fontSize="14px" color={UI_COLORS.veniceBlue}>
                            {renderOptionLabel(option)}
                          </Text>
                        </Checkbox>
                      );
                    })}
                  </VStack>
                </Box>
              )}
              {lovedOneOptions.length > 0 && (
                <Box>
                  <Text color={FORM_COLORS.fieldGray} fontSize="12px" mb={3}>
                    Their loved one is/has...
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {lovedOneOptions.map((option) => {
                      const isChecked = selectedQualities.includes(option.key);
                      const isDisabled = !isChecked && selectedQualities.length >= 5;
                      return (
                        <Checkbox
                          key={option.key}
                          checked={isChecked}
                          disabled={isDisabled}
                          colorScheme="teal"
                          cursor={isDisabled ? 'not-allowed' : 'pointer'}
                          onChange={() => handleQualityToggle(option.key)}
                        >
                          <Text fontSize="14px" color={UI_COLORS.veniceBlue}>
                            {renderOptionLabel(option)}
                          </Text>
                        </Checkbox>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </SimpleGrid>
            <Text color={FORM_COLORS.fieldGray} fontSize="12px">
              These selections feed directly into the ranked statements below.
            </Text>
          </VStack>
        ) : (
          <Text color={FORM_COLORS.fieldGray} fontSize="14px">
            No qualities were captured for this submission.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Volunteer Matching Preferences">
        <VStack align="stretch" gap={6}>
          <Text color={FORM_COLORS.fieldGray} fontSize="15px">
            This information will be used to match the participant with a suitable volunteer. Note
            that their volunteer is guaranteed to speak their language and have the same
            availability.
          </Text>
          <Text color={UI_COLORS.veniceBlue} fontSize="15px" fontWeight={600}>
            Rank the following statements in the order that you agree with them:
          </Text>
          {hasRankingRows ? (
            <VStack align="stretch" gap={4}>
              {rankingRows.map((row, index) => (
                <HStack key={`${row.rank}-${index}-${row.label}`} w="full" gap={4} align="center">
                  <Text
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="16px"
                    fontWeight={600}
                    color={UI_COLORS.veniceBlue}
                    minW="20px"
                  >
                    {index + 1}.
                  </Text>
                  <HStack
                    flex="1"
                    p={4}
                    bg={
                      dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index
                        ? '#dbeafe'
                        : draggedIndex === index
                        ? '#e5e7eb'
                        : '#f9fafb'
                    }
                    border={`1px solid ${
                      dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index
                        ? FORM_COLORS.teal
                        : '#e5e7eb'
                    }`}
                    borderRadius="8px"
                    cursor={draggedIndex === index ? 'grabbing' : 'grab'}
                    gap={3}
                    opacity={draggedIndex === index ? 0.5 : 1}
                    transition="all 0.2s ease"
                    draggable
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                    _hover={{
                      borderColor: FORM_COLORS.teal,
                      boxShadow: `0 0 0 1px ${FORM_COLORS.teal}20`,
                      bg: draggedIndex === index ? '#e5e7eb' : '#f3f4f6',
                    }}
                  >
                    <Box cursor={draggedIndex === index ? 'grabbing' : 'grab'} p={1}>
                      <DragIcon />
                    </Box>
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="14px"
                      color={UI_COLORS.veniceBlue}
                      flex="1"
                      userSelect="none"
                    >
                      {buildRankingPreviewStatement(row)}
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text color={FORM_COLORS.fieldGray} fontSize="14px">
              No ranking statements are available for this submission.
            </Text>
          )}
        </VStack>
      </SectionCard>

      {hasAdditionalNotes && (
        <SectionCard title="Additional Notes">
          <FormField label="Notes captured during ranking">
            <Textarea
              {...TEXTAREA_STYLES}
              minH="140px"
              value={formData.additionalNotes || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalNotes: e.target.value,
                }))
              }
            />
          </FormField>
        </SectionCard>
      )}
    </VStack>
  );
};

export default ParticipantRankingFormEditor;
