/**
 * AdminRankingFormView - Admin-facing ranking form editor
 *
 * This component displays 5 dropdowns for ranking preferences, pre-filled with
 * the user's selections. The admin can view and edit these rankings.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { VStack, HStack, Text, Box, Spinner } from '@chakra-ui/react';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormField } from '@/components/ui/form-field';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { CustomRadio } from '@/components/CustomRadio';
import { COLORS as FORM_COLORS } from '@/constants/form';
import { COLORS as UI_COLORS } from '@/constants/colors';
import {
  ParticipantRankingAnswers,
  RankingEntry,
  RankingOption,
  RankingOptionsResponse,
  transformRankingOptionsResponse,
  buildRankingStatement,
} from '@/utils/adminFormHelpers/ranking';
import { SectionCard } from './SectionCard';

interface AdminRankingFormViewProps {
  initialAnswers: ParticipantRankingAnswers;
  userId: string;
  onChange?: (answers: ParticipantRankingAnswers, hasChanges: boolean) => void;
}

export const AdminRankingFormView: React.FC<AdminRankingFormViewProps> = ({
  initialAnswers,
  userId,
  onChange,
}) => {
  // Ensure target is set
  const initialDataWithTarget = useMemo(() => {
    const target =
      initialAnswers.participantType === 'caregiver' || initialAnswers.isCaregiverVolunteerFlow
        ? 'caregiver'
        : 'patient';
    return {
      ...initialAnswers,
      target: initialAnswers.target || target,
    };
  }, [initialAnswers]);

  const [formData, setFormData] = useState<ParticipantRankingAnswers>(initialDataWithTarget);
  const [baselineData, setBaselineData] =
    useState<ParticipantRankingAnswers>(initialDataWithTarget);
  const [rankingOptions, setRankingOptions] = useState<RankingOption[]>([]);
  const [isLoadingRankingOptions, setIsLoadingRankingOptions] = useState(false);
  const [rankingOptionsError, setRankingOptionsError] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const latestFormDataRef = useRef<ParticipantRankingAnswers>(formData);

  // Determine target (patient or caregiver)
  const rankingTarget = useMemo<'patient' | 'caregiver'>(() => {
    if (formData.target) {
      return formData.target;
    }
    if (formData.participantType === 'caregiver' || formData.isCaregiverVolunteerFlow) {
      return 'caregiver';
    }
    return 'patient';
  }, [formData.target, formData.participantType, formData.isCaregiverVolunteerFlow]);

  // Handle target change
  const handleTargetChange = useCallback((value: string) => {
    const newTarget = value === 'caringForLovedOne' ? 'caregiver' : 'patient';
    setFormData((prev) => ({
      ...prev,
      target: newTarget,
    }));
  }, []);

  // Fetch eligible ranking options
  useEffect(() => {
    let isMounted = true;

    const fetchRankingOptions = async () => {
      setIsLoadingRankingOptions(true);
      setRankingOptionsError(null);
      try {
        const { data } = await baseAPIClient.get<RankingOptionsResponse>('/ranking/admin/options', {
          params: { user_id: userId, target: rankingTarget },
        });
        if (!isMounted) {
          return;
        }
        const options = transformRankingOptionsResponse(data);
        setRankingOptions(options);

        // If we have preferences but no labels, populate them from fetched options
        if (initialAnswers.preferences && initialAnswers.preferences.length > 0) {
          const updatedRankings = initialAnswers.preferences
            .map((pref) => {
              // Find matching option by id, kind, and scope
              const matchingOption = options.find((opt) => {
                // Parse the option key: "quality:123:self" or "treatment:456:loved_one"
                const keyParts = opt.key.split(':');
                if (keyParts.length >= 3) {
                  const optKind = keyParts[0];
                  const optId = parseInt(keyParts[1], 10);
                  const optScope = keyParts[2];
                  return optKind === pref.kind && optId === pref.id && optScope === pref.scope;
                }
                return false;
              });

              if (matchingOption) {
                return {
                  label:
                    matchingOption.statement ||
                    buildRankingStatement(
                      matchingOption.label,
                      matchingOption.kind,
                      matchingOption.scope,
                    ),
                  rank: pref.rank,
                  scope: pref.scope,
                  kind: pref.kind,
                };
              }

              // Fallback if no match found
              return {
                label: `${pref.kind}-${pref.id}`,
                rank: pref.rank,
                scope: pref.scope,
                kind: pref.kind,
              };
            })
            .sort((a, b) => a.rank - b.rank);

          setFormData((prev) => ({
            ...prev,
            rankings: updatedRankings,
          }));
        }
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
  }, [userId, rankingTarget, initialAnswers.preferences]);

  // Reset editor state when initial answers change (e.g., navigating or reloading)
  useEffect(() => {
    setFormData(initialDataWithTarget);
    setBaselineData(initialDataWithTarget);
    latestFormDataRef.current = initialDataWithTarget;
    isDirtyRef.current = false;
  }, [initialDataWithTarget]);

  // Build dropdown options from ranking options (as strings for SingleSelectDropdown)
  const dropdownOptions = useMemo(() => {
    const options: string[] = [];
    const labelToKeyMap = new Map<string, string>();

    rankingOptions.forEach((option) => {
      const displayLabel =
        option.statement || buildRankingStatement(option.label, option.kind, option.scope);
      if (!options.includes(displayLabel)) {
        options.push(displayLabel);
        labelToKeyMap.set(displayLabel, option.key);
      }
    });

    // Also include any existing rankings that might not be in the options
    (formData.rankings || []).forEach((entry) => {
      const label = entry.label || '';
      if (label && !options.includes(label)) {
        options.push(label);
        const key = `${entry.scope || 'self'}-${label.toLowerCase().replace(/\s+/g, '-')}`;
        labelToKeyMap.set(label, key);
      }
    });

    return options.sort((a, b) => a.localeCompare(b));
  }, [rankingOptions, formData.rankings]);

  // Map label to option key
  const getKeyFromLabel = useCallback(
    (label: string): string | null => {
      const option = rankingOptions.find((opt) => {
        const optLabel = opt.statement || buildRankingStatement(opt.label, opt.kind, opt.scope);
        return optLabel === label;
      });
      return option?.key || null;
    },
    [rankingOptions],
  );

  // Get current selection label for each rank (1-5)
  const getCurrentSelection = useCallback(
    (rank: number): string => {
      const ranking = formData.rankings?.find((r) => r.rank === rank);
      return ranking?.label || '';
    },
    [formData.rankings],
  );

  // Helper to parse option key and extract id
  const parseOptionKey = useCallback((key: string): { kind: string; id: number } | null => {
    // Format: "quality:123:self" or "treatment:456:loved_one" or "experience:789:self"
    const keyParts = key.split(':');
    if (keyParts.length >= 2) {
      const kind = keyParts[0]; // "quality", "treatment", or "experience"
      const id = parseInt(keyParts[1], 10);
      if (!isNaN(id) && (kind === 'quality' || kind === 'treatment' || kind === 'experience')) {
        return { kind, id };
      }
    }
    return null;
  }, []);

  // Handle dropdown change (receives label string)
  const handleRankingChange = useCallback(
    (rank: number, selectedLabel: string) => {
      setFormData((prev) => {
        const selectedKey = getKeyFromLabel(selectedLabel);
        const selectedOption = selectedKey
          ? rankingOptions.find((opt) => opt.key === selectedKey)
          : null;
        const existingRankings = [...(prev.rankings || [])];

        // Find or create ranking entry for this rank
        const existingIndex = existingRankings.findIndex((r) => r.rank === rank);

        if (selectedOption) {
          const newEntry: RankingEntry = {
            label:
              selectedOption.statement ||
              buildRankingStatement(
                selectedOption.label,
                selectedOption.kind,
                selectedOption.scope,
              ),
            rank,
            scope: selectedOption.scope,
            kind: selectedOption.kind,
          };

          if (existingIndex >= 0) {
            existingRankings[existingIndex] = newEntry;
          } else {
            existingRankings.push(newEntry);
          }
        } else {
          // Fallback: use the label directly
          const newEntry: RankingEntry = {
            label: selectedLabel,
            rank,
          };

          if (existingIndex >= 0) {
            existingRankings[existingIndex] = newEntry;
          } else {
            existingRankings.push(newEntry);
          }
        }

        // Update selectedQualities to match rankings
        const sortedRankings = [...existingRankings].sort((a, b) => (a.rank || 0) - (b.rank || 0));

        // Build preferences array for backend format
        const preferences = sortedRankings
          .map((r) => {
            // Find matching option by label
            const matchingOption = rankingOptions.find((opt) => {
              const optLabel =
                opt.statement || buildRankingStatement(opt.label, opt.kind, opt.scope);
              return optLabel === r.label;
            });

            if (matchingOption) {
              const parsed = parseOptionKey(matchingOption.key);
              if (parsed) {
                return {
                  kind: parsed.kind,
                  id: parsed.id,
                  scope: matchingOption.scope as 'self' | 'loved_one',
                  rank: r.rank || 0,
                };
              }
            }
            return null;
          })
          .filter(
            (p): p is { kind: string; id: number; scope: 'self' | 'loved_one'; rank: number } =>
              p !== null,
          );

        const newSelectedQualities = sortedRankings
          .map((r) => {
            const matchingOption = rankingOptions.find((opt) => {
              const optLabel =
                opt.statement || buildRankingStatement(opt.label, opt.kind, opt.scope);
              return optLabel === r.label;
            });
            return matchingOption?.key || '';
          })
          .filter(Boolean);

        return {
          ...prev,
          rankings: sortedRankings,
          rankedPreferences: sortedRankings.map((r) => r.label),
          selectedQualities:
            newSelectedQualities.length > 0 ? newSelectedQualities : prev.selectedQualities,
          // Store preferences in the format expected by backend
          preferences,
          target: rankingTarget,
        };
      });
    },
    [rankingOptions, rankingTarget, parseOptionKey, getKeyFromLabel],
  );

  // Track changes and call onChange
  useEffect(() => {
    latestFormDataRef.current = formData;
    const dirty = JSON.stringify(formData) !== JSON.stringify(baselineData);
    isDirtyRef.current = dirty;
  }, [formData, baselineData]);

  useEffect(() => {
    if (onChange) {
      onChange(latestFormDataRef.current, isDirtyRef.current);
    }
  }, [formData, baselineData, onChange]);

  return (
    <VStack align="stretch" gap="10" maxW="900px" mx="auto" width="100%">
      <SectionCard title="Volunteer Matching Preferences">
        <VStack align="stretch" gap={6}>
          <Text color={FORM_COLORS.fieldGray} fontSize="15px">
            This information will be used to match the participant with a suitable volunteer. Note
            that their volunteer is guaranteed to speak their language and have the same
            availability.
          </Text>

          {/* Participant's target selection */}
          <Box>
            <Text
              color={UI_COLORS.veniceBlue}
              fontFamily="'Open Sans', sans-serif"
              fontWeight={500}
              fontSize="14px"
              mb={4}
            >
              I would like a volunteer that...
            </Text>

            <VStack align="start" gap={3}>
              <CustomRadio
                name="volunteerTarget"
                value="similarDiagnosis"
                checked={rankingTarget === 'patient'}
                onChange={handleTargetChange}
              >
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontSize="14px"
                  color={UI_COLORS.veniceBlue}
                >
                  has a similar diagnosis
                </Text>
              </CustomRadio>

              <CustomRadio
                name="volunteerTarget"
                value="caringForLovedOne"
                checked={rankingTarget === 'caregiver'}
                onChange={handleTargetChange}
              >
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontSize="14px"
                  color={UI_COLORS.veniceBlue}
                >
                  is caring for a loved one with blood cancer
                </Text>
              </CustomRadio>
            </VStack>
          </Box>

          <Text color={UI_COLORS.veniceBlue} fontSize="15px" fontWeight={600}>
            Rank the following statements in the order that you agree with them:
          </Text>

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
          ) : null}

          <VStack align="stretch" gap={4}>
            {[1, 2, 3, 4, 5].map((rank) => (
              <Box key={rank}>
                <FormField label={`Rank ${rank}`}>
                  <SingleSelectDropdown
                    options={dropdownOptions}
                    selectedValue={getCurrentSelection(rank)}
                    onSelectionChange={(value) => handleRankingChange(rank, value)}
                    placeholder={`Select preference for rank ${rank}`}
                  />
                </FormField>
              </Box>
            ))}
          </VStack>

          {formData.additionalNotes && (
            <Box mt={4}>
              <Text color={FORM_COLORS.fieldGray} fontSize="14px" fontWeight={600} mb={2}>
                Additional Notes:
              </Text>
              <Text color={FORM_COLORS.fieldGray} fontSize="14px">
                {formData.additionalNotes}
              </Text>
            </Box>
          )}
        </VStack>
      </SectionCard>
    </VStack>
  );
};

export default AdminRankingFormView;
