import React, { useEffect, useState } from 'react';
import { Box, Text, Spinner, VStack, HStack, Button, Flex, Badge } from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';
import { matchingAPIClient, AdminMatchCandidate } from '@/APIClients/matchingAPIClient';
import { matchAPIClient } from '@/APIClients/matchAPIClient';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { NotesModal } from './NotesModal';

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

interface MatchesContentProps {
  participantId: string | string[] | undefined;
}

export function MatchesContent({ participantId }: MatchesContentProps) {
  const [matches, setMatches] = useState<AdminMatchCandidate[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user, loading: userLoading } = useUserProfile(participantId);

  useEffect(() => {
    if (!participantId || typeof participantId !== 'string') {
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await matchingAPIClient.getAdminMatches(participantId);
        setMatches(response.matches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [participantId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVolunteerIds(new Set(matches.map((m) => m.volunteerId)));
    } else {
      setSelectedVolunteerIds(new Set());
    }
  };

  const handleSelectVolunteer = (volunteerId: string, checked: boolean) => {
    const newSelected = new Set(selectedVolunteerIds);
    if (checked) {
      newSelected.add(volunteerId);
    } else {
      newSelected.delete(volunteerId);
    }
    setSelectedVolunteerIds(newSelected);
  };

  const handleSendMatches = async () => {
    if (!participantId || typeof participantId !== 'string' || selectedVolunteerIds.size === 0) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      await matchAPIClient.createMatches({
        participantId,
        volunteerIds: Array.from(selectedVolunteerIds),
      });

      setSuccess(`Successfully created ${selectedVolunteerIds.size} match(es)`);
      setSelectedVolunteerIds(new Set());
      // Optionally refresh matches to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create matches');
    } finally {
      setSending(false);
    }
  };

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

  const allSelected = matches.length > 0 && selectedVolunteerIds.size === matches.length;

  return (
    <Box p={0} bg="white" display="flex" flexDirection="column" alignItems="center" w="100%" px={8} py={8} overflowY="hidden">
      {/* Cards Row - Above Table */}
      <HStack align="flex-start" gap={10} mb={10} justify="center" w="100%">
        {/* Profile Summary Card - Left */}
        <Box flexShrink={0} w="640px" minW="640px" maxW="640px">
          <ProfileSummaryCard userData={user?.userData} userEmail={user?.email} userId={participantId} />
        </Box>

        {/* Notes Modal - Right */}
        <Box flexShrink={0} w="640px" minW="640px" maxW="640px">
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
      <VStack align="stretch" gap={0} w="1320px" maxW="100%">
        {/* Scrollable Table Container */}
        <Box
          overflowX="auto"
          border="1px solid #D5D7DA"
          borderRadius="8px"
          maxH="calc(100vh - 450px)"
          overflowY="auto"
          bg="white"
          w="100%"
          sx={scrollbarStyles}
        >
          {/* Table Header */}
          <Box
            bg="#F6F6F6"
            borderBottom="1px solid #EAEAE6"
            borderRadius="8px 8px 0 0"
            px={4}
            py={3}
            position="sticky"
            top={0}
            zIndex={10}
          >
            <HStack gap={4} align="center" h="44px">
              <Box minW="16px">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  size="sm"
                />
              </Box>
              <HStack gap={0} flex={1} justify="space-between" align="center" w="full">
                <Text fontSize="sm" fontWeight={400} color="#414651" w="150px">
                  Volunteer
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="120px">
                  Time Zone
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="100px">
                  Age
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="180px">
                  Diagnosis
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="300px">
                  Treatment Info
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="250px">
                  Experience Info
                </Text>
                <Text fontSize="sm" fontWeight={400} color="#414651" w="150px">
                  Match
                </Text>
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

                return (
                  <Box key={match.volunteerId}>
                    {index > 0 && <Box h="1px" bg="#EAEAE6" />}
                    <Box px={4} py={2} _hover={{ bg: '#FAFAFA' }} minH="73px">
                      <HStack gap={4} align="flex-start" h="full">
                        <Box pt={2} minW="16px">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectVolunteer(match.volunteerId, checked as boolean)
                            }
                            size="sm"
                          />
                        </Box>
                        <HStack gap={0} flex={1} justify="space-between" align="flex-start" w="full">
                          {/* Volunteer Name */}
                          <Box w="150px">
                            <Text fontSize="sm" fontWeight={400} color="#414651">
                              {match.firstName} {match.lastName}
                            </Text>
                          </Box>

                          {/* Time Zone */}
                          <Box w="120px">
                            <Text fontSize="sm" fontWeight={400} color="#414651">
                              {match.timezone || 'N/A'}
                            </Text>
                          </Box>

                          {/* Age */}
                          <Box w="100px">
                            <Text fontSize="sm" fontWeight={400} color="#414651">
                              {match.age ?? 'N/A'}
                            </Text>
                          </Box>

                          {/* Diagnosis */}
                          <Box w="180px">
                            <VStack align="start" gap={0}>
                              <Text fontSize="sm" fontWeight={400} color="#414651" lineHeight="1.2em">
                                {match.diagnosis || 'N/A'}
                              </Text>
                            </VStack>
                          </Box>

                          {/* Treatment Info */}
                          <Box w="300px">
                            {match.treatments.length > 0 ? (
                              <HStack gap={2} flexWrap="wrap">
                                {match.treatments.slice(0, 3).map((treatment, idx) => (
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
                                {match.treatments.length > 3 && (
                                  <Badge
                                    bg="#EEF4FF"
                                    color="#3538CD"
                                    borderRadius="16px"
                                    px={3}
                                    py={1.5}
                                    fontSize="10px"
                                    fontWeight={400}
                                    lineHeight="1.8em"
                                  >
                                    +{match.treatments.length - 3}
                                  </Badge>
                                )}
                              </HStack>
                            ) : (
                              <Text fontSize="sm" fontWeight={400} color="#414651">
                                N/A
                              </Text>
                            )}
                          </Box>

                          {/* Experience Info */}
                          <Box w="250px">
                            {match.experiences.length > 0 ? (
                              <HStack gap={2} flexWrap="wrap">
                                {match.experiences.slice(0, 2).map((experience, idx) => {
                                  const truncatedExperience =
                                    experience.length > 20 ? `${experience.substring(0, 20)}...` : experience;
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
                                {match.experiences.length > 2 && (
                                  <Badge
                                    bg="#EEF4FF"
                                    color="#3538CD"
                                    borderRadius="16px"
                                    px={3}
                                    py={1.5}
                                    fontSize="10px"
                                    fontWeight={400}
                                    lineHeight="1.8em"
                                  >
                                    +{match.experiences.length - 2}
                                  </Badge>
                                )}
                              </HStack>
                            ) : (
                              <Text fontSize="sm" fontWeight={400} color="#414651">
                                N/A
                              </Text>
                            )}
                          </Box>

                          {/* Match Score */}
                          <Box w="150px">
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
                              {/* Clock icon badge - placeholder for now */}
                              {match.matchScore >= 80 && (
                                <Badge
                                  bg={scoreColors.bg}
                                  color={scoreColors.color}
                                  borderRadius="16px"
                                  px={2}
                                  py={1.5}
                                  fontSize="10px"
                                  fontWeight={400}
                                  lineHeight="1.8em"
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <FiClock size={10} />
                                  <Text>2</Text>
                                </Badge>
                              )}
                            </HStack>
                          </Box>
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

        {/* Error/Success Messages */}
        {error && (
          <Box px={8} pt={4}>
            <Text color="red.600" fontSize="sm">
              {error}
            </Text>
          </Box>
        )}
        {success && (
          <Box px={8} pt={4}>
            <Text color="green.600" fontSize="sm">
              {success}
            </Text>
          </Box>
        )}

        {/* Send Matches Button */}
        <Flex justify="center" w="100%" pt={6} pb={0}>
          <Button
            onClick={handleSendMatches}
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
            isLoading={sending}
            loadingText="Sending..."
          >
            Send Matches
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
