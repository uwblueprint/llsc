import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text, Spinner, VStack, HStack, Button, Flex, Badge } from '@chakra-ui/react';
import { FiClock, FiHeart } from 'react-icons/fi';
import Link from 'next/link';
import { matchingAPIClient, AdminMatchCandidate } from '@/APIClients/matchingAPIClient';
import { matchAPIClient } from '@/APIClients/matchAPIClient';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { NotesModal } from './NotesModal';
import { rankingAPIClient, RankingPreference } from '@/APIClients/rankingAPIClient';
import { SendMatchesSuccessModal } from './SendMatchesSuccessModal';
import { SendMatchesConfirmationModal } from './SendMatchesConfirmationModal';

const scrollbarStyles = {
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: '#FAFAFA',
    borderRadius: '4px',
  },
  '::-webkit-scrollbar-thumb': {
    background: '#E0E0E0',
    borderRadius: '4px',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: '#D0D0D0',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#E0E0E0 #FAFAFA',
};

const LAYOUT_GUTTER = 8;

interface MatchesContentProps {
  participantId: string | string[] | undefined;
}

type ColumnType =
  | 'volunteer'
  | 'timezone'
  | 'age'
  | 'maritalStatus'
  | 'genderIdentity'
  | 'ethnicGroup'
  | 'parentalStatus'
  | 'loAge'
  | 'diagnosis'
  | 'loDiagnosis'
  | 'treatments'
  | 'loTreatments'
  | 'experiences'
  | 'loExperiences'
  | 'match';

interface ColumnConfig {
  type: ColumnType;
  label: string;
  minWidth: string;
  flex: string;
  isLovedOne?: boolean;
}

export function MatchesContent({ participantId }: MatchesContentProps) {
  const [matches, setMatches] = useState<AdminMatchCandidate[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<RankingPreference[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentMatchCount, setSentMatchCount] = useState(0);
  const { user } = useUserProfile(participantId);

  useEffect(() => {
    if (!participantId || typeof participantId !== 'string') {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch matches and preferences in parallel
        const [matchesResponse, preferencesResponse] = await Promise.all([
          matchingAPIClient.getAdminMatches(participantId),
          rankingAPIClient
            .getPreferences(
              participantId,
              user?.userData?.caringForSomeone === 'yes' ? 'caregiver' : 'patient',
            )
            .catch(() => []), // If preferences fail, use empty array
        ]);

        setMatches(matchesResponse.matches);
        setPreferences(preferencesResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [participantId, user?.userData?.caringForSomeone]);

  const handleSelectAll = (details: { checked: boolean | string }) => {
    const isChecked = details.checked === true || details.checked === 'checked';
    if (isChecked) {
      setSelectedVolunteerIds(new Set(matches.map((m) => m.volunteerId)));
    } else {
      setSelectedVolunteerIds(new Set());
    }
  };

  const handleSelectVolunteer = (volunteerId: string, details: { checked: boolean | string }) => {
    const newSelected = new Set(selectedVolunteerIds);
    const isChecked = details.checked === true || details.checked === 'checked';
    if (isChecked) {
      newSelected.add(volunteerId);
    } else {
      newSelected.delete(volunteerId);
    }
    setSelectedVolunteerIds(newSelected);
  };

  const handleSendMatchesClick = () => {
    if (selectedVolunteerIds.size === 0) {
      return;
    }
    setShowConfirmationModal(true);
  };

  const handleConfirmSendMatches = async () => {
    if (!participantId || typeof participantId !== 'string' || selectedVolunteerIds.size === 0) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setShowConfirmationModal(false);

      await matchAPIClient.createMatches({
        participantId,
        volunteerIds: Array.from(selectedVolunteerIds),
      });

      setSentMatchCount(selectedVolunteerIds.size);
      setSelectedVolunteerIds(new Set());
      setShowSuccessModal(true);
      // Optionally refresh matches to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create matches');
    } finally {
      setSending(false);
    }
  };

  const allSelected = matches.length > 0 && selectedVolunteerIds.size === matches.length;

  // Determine which columns to show based on preferences
  const columns = useMemo((): ColumnConfig[] => {
    const cols: ColumnConfig[] = [
      { type: 'volunteer', label: 'Volunteer', minWidth: '150px', flex: '0 0 150px' },
      { type: 'timezone', label: 'Time Zone', minWidth: '120px', flex: '0 0 120px' },
      { type: 'age', label: 'Age', minWidth: '100px', flex: '0 0 100px' },
    ];

    // Add dynamic columns after Age based on preferences
    const hasMaritalStatus = preferences.some(
      (p) => p.kind === 'quality' && p.id === 4 && p.scope === 'self',
    );
    const hasGenderIdentity = preferences.some(
      (p) => p.kind === 'quality' && p.id === 2 && p.scope === 'self',
    );
    const hasEthnicGroup = preferences.some(
      (p) => p.kind === 'quality' && p.id === 3 && p.scope === 'self',
    );
    const hasParentalStatus = preferences.some(
      (p) => p.kind === 'quality' && p.id === 5 && p.scope === 'self',
    );
    const hasLoAge = preferences.some(
      (p) => p.kind === 'quality' && p.id === 1 && p.scope === 'loved_one',
    );
    const hasLoDiagnosis = preferences.some(
      (p) => p.kind === 'quality' && p.id === 6 && p.scope === 'loved_one',
    );
    const hasLoTreatments = preferences.some(
      (p) => p.kind === 'treatment' && p.scope === 'loved_one',
    );
    const hasLoExperiences = preferences.some(
      (p) => p.kind === 'experience' && p.scope === 'loved_one',
    );

    if (hasMaritalStatus) {
      cols.push({
        type: 'maritalStatus',
        label: 'Marital Status',
        minWidth: '120px',
        flex: '0 0 120px',
      });
    }
    if (hasGenderIdentity) {
      cols.push({ type: 'genderIdentity', label: 'Gender', minWidth: '100px', flex: '0 0 100px' });
    }
    if (hasEthnicGroup) {
      cols.push({
        type: 'ethnicGroup',
        label: 'Ethnic/Cultural Group',
        minWidth: '180px',
        flex: '0 0 180px',
      });
    }
    if (hasParentalStatus) {
      cols.push({
        type: 'parentalStatus',
        label: 'Parental Status',
        minWidth: '120px',
        flex: '0 0 120px',
      });
    }
    if (hasLoAge) {
      cols.push({
        type: 'loAge',
        label: 'LO: Age',
        minWidth: '100px',
        flex: '0 0 100px',
        isLovedOne: true,
      });
    }

    // Default columns after dynamic ones
    cols.push({ type: 'diagnosis', label: 'Diagnosis', minWidth: '180px', flex: '0 0 180px' });

    if (hasLoDiagnosis) {
      cols.push({
        type: 'loDiagnosis',
        label: 'LO: Diagnosis',
        minWidth: '180px',
        flex: '0 0 180px',
        isLovedOne: true,
      });
    }

    cols.push({
      type: 'treatments',
      label: 'Treatment Info',
      minWidth: '300px',
      flex: '0 0 300px',
    });

    if (hasLoTreatments) {
      cols.push({
        type: 'loTreatments',
        label: 'LO: Treatment Info',
        minWidth: '300px',
        flex: '0 0 300px',
        isLovedOne: true,
      });
    }

    cols.push({
      type: 'experiences',
      label: 'Experience Info',
      minWidth: '250px',
      flex: '0 0 250px',
    });

    if (hasLoExperiences) {
      cols.push({
        type: 'loExperiences',
        label: 'LO: Experience Info',
        minWidth: '250px',
        flex: '0 0 250px',
        isLovedOne: true,
      });
    }

    cols.push({ type: 'match', label: 'Match', minWidth: '150px', flex: '0 0 150px' });

    return cols;
  }, [preferences]);

  // Calculate table min-width dynamically based on columns
  const tableMinWidth = useMemo(() => {
    // Sum of all column widths + checkbox columns (16px each side) + padding (16px each side)
    const checkboxWidth = 16; // Left checkbox
    const rightCheckboxWidth = 16; // Right spacing
    const paddingWidth = 16 * 2; // px={4} = 16px on each side

    const totalColumnWidth = columns.reduce((sum, col) => {
      const width = parseInt(col.minWidth, 10);
      return sum + width;
    }, 0);

    const totalWidth = checkboxWidth + rightCheckboxWidth + totalColumnWidth + paddingWidth;

    // Ensure minimum width of 1200px for basic columns
    return `${Math.max(totalWidth, 1200)}px`;
  }, [columns]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="#056067" />
        <Text mt={4} color="#495D6C">
          Loading matches...
        </Text>
      </Box>
    );
  }

  if (error && !matches.length) {
    return (
      <Box p={8}>
        <Text color="red.600">{error}</Text>
      </Box>
    );
  }

  return (
    <Box
      p={0}
      bg="white"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      w="100%"
      maxW="100%"
      overflowX="hidden"
      px={2}
      py={8}
    >
      {/* Cards Row - Above Table */}
      <HStack align="flex-start" gap={6} mb={4} w="100%" maxW="100%" minW="0">
        {/* Profile Summary Card - Left */}
        <Box flex="1" minW="0">
          <ProfileSummaryCard
            userData={user?.userData}
            userEmail={user?.email}
            userId={participantId}
          />
        </Box>

        {/* Notes Modal - Right */}
        <Box flex="1" minW="0">
          <NotesModal
            participantId={participantId}
            participantName={
              user?.userData
                ? `${user.userData.firstName || ''} ${user.userData.lastName?.[0] || ''}.`
                : undefined
            }
          />
        </Box>
      </HStack>

      {/* Table Container - Below Cards */}
      <Box
        w="100%"
        minW="0"
        overflowX="auto"
        overflowY="visible"
        mx={-LAYOUT_GUTTER}
        px={LAYOUT_GUTTER}
        css={{ ...scrollbarStyles }}
      >
        {/* Table Container */}
        <Box border="1px solid #D5D7DA" borderRadius="8px" bg="white" minW={tableMinWidth}>
          {/* Table Header */}
          <Box
            bg="#F6F6F6"
            borderBottom="1px solid #EAEAE6"
            borderRadius="8px 8px 0 0"
            px={4}
            py={3}
            minW={tableMinWidth}
          >
            <HStack gap={4} align="center" h="44px">
              <Box minW="16px">
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} size="sm" />
              </Box>
              <HStack gap={0} flex={1} justify="space-between" align="center" w="full">
                {columns.map((col) => (
                  <HStack key={col.type} gap={1} minW={col.minWidth} flex={col.flex} align="center">
                    {col.isLovedOne && <FiHeart size={12} color="#056067" />}
                    <Text fontSize="sm" fontWeight={400} color="#414651">
                      {col.label}
                    </Text>
                  </HStack>
                ))}
              </HStack>
              <Box minW="16px" />
            </HStack>
          </Box>

          {/* Table Body */}
          <VStack align="stretch" gap={0}>
            {matches.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="#495D6C">No matches found.</Text>
              </Box>
            ) : (
              matches.map((match, index) => {
                const isSelected = selectedVolunteerIds.has(match.volunteerId);
                const getMatchScoreColor = (score: number) => {
                  if (score >= 80) return { bg: '#E7F8EE', color: '#027847' };
                  if (score >= 50) return { bg: '#FEF0C7', color: '#DC6803' };
                  return { bg: '#FEF3F2', color: '#B42419' };
                };
                const scoreColors = getMatchScoreColor(match.matchScore);
                const formatDate = (dateStr: string | null | undefined) => {
                  if (!dateStr) return null;
                  try {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    });
                  } catch {
                    return null;
                  }
                };

                return (
                  <Box key={match.volunteerId} minW={tableMinWidth}>
                    {index > 0 && <Box h="1px" bg="#EAEAE6" />}
                    <Box px={4} py={2} _hover={{ bg: '#FAFAFA' }} minH="73px">
                      <HStack gap={4} align="flex-start" h="full">
                        <Box pt={2} minW="16px">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(details) =>
                              handleSelectVolunteer(match.volunteerId, details)
                            }
                            size="sm"
                          />
                        </Box>
                        <HStack
                          gap={0}
                          flex={1}
                          justify="space-between"
                          align="flex-start"
                          w="full"
                        >
                          {columns.map((col) => {
                            const renderCell = () => {
                              switch (col.type) {
                                case 'volunteer':
                                  const getMatchCountBadgeColor = (count: number) => {
                                    if (count >= 5) return { bg: '#FEF3F2', color: '#B42419' }; // red
                                    if (count >= 3) return { bg: '#FEF0C7', color: '#DC6803' }; // yellow
                                    return { bg: '#E7F8EE', color: '#027847' }; // green
                                  };
                                  const badgeColors = getMatchCountBadgeColor(match.matchCount);
                                  return (
                                    <VStack gap={1} align="flex-start">
                                      <Link href={`/admin/users/${match.volunteerId}`}>
                                        <Text
                                          fontSize="sm"
                                          fontWeight={400}
                                          color="#414651"
                                          textDecoration="underline"
                                          cursor="pointer"
                                          _hover={{ color: '#056067' }}
                                        >
                                          {match.firstName} {match.lastName}
                                        </Text>
                                      </Link>
                                      <Badge
                                        bg={badgeColors.bg}
                                        color={badgeColors.color}
                                        borderRadius="16px"
                                        px={2}
                                        py={0.5}
                                        fontSize="10px"
                                        fontWeight={400}
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                      >
                                        <FiClock size={10} />
                                        {match.matchCount}
                                      </Badge>
                                    </VStack>
                                  );
                                case 'timezone':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.timezone || 'N/A'}
                                    </Text>
                                  );
                                case 'age':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.age ?? 'N/A'}
                                    </Text>
                                  );
                                case 'maritalStatus':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.maritalStatus || 'N/A'}
                                    </Text>
                                  );
                                case 'genderIdentity':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.genderIdentity || 'N/A'}
                                    </Text>
                                  );
                                case 'ethnicGroup':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.ethnicGroup && match.ethnicGroup.length > 0
                                        ? match.ethnicGroup.join(', ')
                                        : 'N/A'}
                                    </Text>
                                  );
                                case 'parentalStatus':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.hasKids === 'yes'
                                        ? 'Has kids'
                                        : match.hasKids === 'no'
                                          ? 'No kids'
                                          : 'N/A'}
                                    </Text>
                                  );
                                case 'loAge':
                                  return (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      {match.lovedOneAge || 'N/A'}
                                    </Text>
                                  );
                                case 'diagnosis':
                                  return (
                                    <VStack gap={0} align="flex-start">
                                      <Text fontSize="sm" fontWeight={400} color="#414651">
                                        {match.diagnosis || 'N/A'}
                                      </Text>
                                      {match.dateOfDiagnosis && (
                                        <Text fontSize="sm" fontWeight={400} color="#A0A0A0">
                                          {formatDate(match.dateOfDiagnosis)}
                                        </Text>
                                      )}
                                    </VStack>
                                  );
                                case 'loDiagnosis':
                                  return (
                                    <VStack gap={0} align="flex-start">
                                      <Text fontSize="sm" fontWeight={400} color="#414651">
                                        {match.lovedOneDiagnosis || 'N/A'}
                                      </Text>
                                      {match.lovedOneDateOfDiagnosis && (
                                        <Text fontSize="sm" fontWeight={400} color="#A0A0A0">
                                          {formatDate(match.lovedOneDateOfDiagnosis)}
                                        </Text>
                                      )}
                                    </VStack>
                                  );
                                case 'treatments':
                                  return match.treatments.length > 0 ? (
                                    <HStack gap={2} flexWrap="wrap">
                                      {match.treatments.map((treatment, idx) => (
                                        <Badge
                                          key={idx}
                                          bg="#EEF4FF"
                                          color="#3538CD"
                                          borderRadius="16px"
                                          px={3}
                                          py={1.5}
                                          fontSize="10px"
                                          fontWeight={400}
                                          lineHeight="1.8em"
                                        >
                                          {treatment}
                                        </Badge>
                                      ))}
                                    </HStack>
                                  ) : (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      N/A
                                    </Text>
                                  );
                                case 'loTreatments':
                                  return match.lovedOneTreatments &&
                                    match.lovedOneTreatments.length > 0 ? (
                                    <HStack gap={2} flexWrap="wrap">
                                      {match.lovedOneTreatments.map((treatment, idx) => (
                                        <Badge
                                          key={idx}
                                          bg="#EEF4FF"
                                          color="#3538CD"
                                          borderRadius="16px"
                                          px={3}
                                          py={1.5}
                                          fontSize="10px"
                                          fontWeight={400}
                                          lineHeight="1.8em"
                                        >
                                          {treatment}
                                        </Badge>
                                      ))}
                                    </HStack>
                                  ) : (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      N/A
                                    </Text>
                                  );
                                case 'experiences':
                                  return match.experiences.length > 0 ? (
                                    <HStack gap={2} flexWrap="wrap">
                                      {match.experiences.map((experience, idx) => {
                                        const truncatedExperience =
                                          experience.length > 20
                                            ? `${experience.substring(0, 20)}...`
                                            : experience;
                                        return (
                                          <Badge
                                            key={idx}
                                            bg="#EEF4FF"
                                            color="#3538CD"
                                            borderRadius="16px"
                                            px={3}
                                            py={1.5}
                                            fontSize="10px"
                                            fontWeight={400}
                                            lineHeight="1.8em"
                                            title={experience}
                                            maxW="100%"
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            whiteSpace="nowrap"
                                          >
                                            {truncatedExperience}
                                          </Badge>
                                        );
                                      })}
                                    </HStack>
                                  ) : (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      N/A
                                    </Text>
                                  );
                                case 'loExperiences':
                                  return match.lovedOneExperiences &&
                                    match.lovedOneExperiences.length > 0 ? (
                                    <HStack gap={2} flexWrap="wrap">
                                      {match.lovedOneExperiences.map((experience, idx) => {
                                        const truncatedExperience =
                                          experience.length > 20
                                            ? `${experience.substring(0, 20)}...`
                                            : experience;
                                        return (
                                          <Badge
                                            key={idx}
                                            bg="#EEF4FF"
                                            color="#3538CD"
                                            borderRadius="16px"
                                            px={3}
                                            py={1.5}
                                            fontSize="10px"
                                            fontWeight={400}
                                            lineHeight="1.8em"
                                            title={experience}
                                            maxW="100%"
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            whiteSpace="nowrap"
                                          >
                                            {truncatedExperience}
                                          </Badge>
                                        );
                                      })}
                                    </HStack>
                                  ) : (
                                    <Text fontSize="sm" fontWeight={400} color="#414651">
                                      N/A
                                    </Text>
                                  );
                                case 'match':
                                  return (
                                    <HStack gap={2} align="center" flexWrap="wrap">
                                      <Badge
                                        bg={scoreColors.bg}
                                        color={scoreColors.color}
                                        borderRadius="16px"
                                        px={3}
                                        py={1.5}
                                        fontSize="10px"
                                        fontWeight={400}
                                        lineHeight="1.8em"
                                      >
                                        {match.matchScore.toFixed(0)}
                                      </Badge>
                                    </HStack>
                                  );
                                default:
                                  return null;
                              }
                            };

                            return (
                              <Box key={col.type} minW={col.minWidth} flex={col.flex}>
                                {renderCell()}
                              </Box>
                            );
                          })}
                        </HStack>
                        <Box minW="16px" />
                      </HStack>
                    </Box>
                  </Box>
                );
              })
            )}
          </VStack>
        </Box>

        {/* Error Messages */}
        {error && (
          <Box pt={4} minW={tableMinWidth}>
            <Text color="red.600" fontSize="sm">
              {error}
            </Text>
          </Box>
        )}

        {/* Send Matches Button */}
        <Flex justify="flex-end" minW={tableMinWidth} pt={6} pb={0}>
          <Button
            onClick={handleSendMatchesClick}
            disabled={selectedVolunteerIds.size === 0 || sending}
            bg="#056067"
            color="white"
            _hover={{ bg: '#045055' }}
            px={7}
            py={2.5}
            borderRadius="8px"
            fontWeight={600}
            fontSize="16px"
            lineHeight="1.5em"
            loading={sending}
            loadingText="Sending..."
          >
            Send Matches
          </Button>
        </Flex>
      </Box>

      {/* Confirmation Modal */}
      <SendMatchesConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmSendMatches}
        participantName={
          user?.userData
            ? `${user.userData.firstName || ''} ${user.userData.lastName || ''}`.trim() || undefined
            : undefined
        }
        matchCount={selectedVolunteerIds.size}
        isSending={sending}
      />

      {/* Success Modal */}
      <SendMatchesSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        participantName={
          user?.userData
            ? `${user.userData.firstName || ''} ${user.userData.lastName || ''}`.trim() || undefined
            : undefined
        }
        matchCount={sentMatchCount}
      />
    </Box>
  );
}
