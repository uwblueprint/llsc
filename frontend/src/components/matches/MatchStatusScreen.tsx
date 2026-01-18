import React, { useState } from 'react';
import { Box, Text, VStack, HStack, Badge, Button, Flex, Icon } from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiUser, FiClock, FiActivity, FiHeart } from 'react-icons/fi';
import { Match, MatchStatus, VolunteerSummary } from '@/types/matchTypes';
import { UserRole } from '@/types/authTypes';
import { useTranslations, useLocale } from 'next-intl';

interface MatchStatusScreenProps {
  matches: Match[] | VolunteerMatch[];
  userRole: UserRole;
  userName?: string;
}

// Volunteer match type (has participant instead of volunteer)
export interface ParticipantSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  pronouns: string[] | null;
  diagnosis: string | null;
  age: number | null;
  timezone: string | null;
  treatments: string[];
  experiences: string[];
  lovedOneDiagnosis?: string | null;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];
}

export interface VolunteerMatch {
  id: number;
  participantId: string;
  volunteerId: string;
  participant: ParticipantSummary;
  matchStatus: MatchStatus;
  createdAt: string;
  updatedAt: string | null;
  chosenTimeBlock?: { id: number; startTime: string } | null;
  suggestedTimeBlocks?: { id: number; startTime: string }[];
}

type DisplayStatus =
  | 'match sent'
  | 'availability sent'
  | 'availability received'
  | 'call scheduled';

interface MatchWithDisplayStatus {
  id: number;
  displayStatus: DisplayStatus;
  displayDate: string | null;
  displayTime: string | null;
  person: VolunteerSummary | ParticipantSummary;
  matchStatus: MatchStatus;
}

export function MatchStatusScreen({ matches, userRole, userName }: MatchStatusScreenProps) {
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set());
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const toggleMatchExpansion = (matchId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  const getDisplayStatus = (match: Match | VolunteerMatch): DisplayStatus => {
    const status = match.matchStatus.toLowerCase();

    if (userRole === UserRole.VOLUNTEER) {
      if (status === 'awaiting_volunteer_acceptance') {
        return 'match sent';
      } else if (status === 'pending') {
        return 'availability sent';
      } else if (status === 'confirmed') {
        return 'call scheduled';
      }
    } else {
      // Participant
      const participantMatch = match as Match;
      if (status === 'pending') {
        // If there are suggested time blocks, availability has been received
        if (
          participantMatch.suggestedTimeBlocks &&
          participantMatch.suggestedTimeBlocks.length > 0
        ) {
          return 'availability received';
        }
        return 'match sent';
      } else if (status === 'confirmed') {
        return 'call scheduled';
      }
    }

    // Default fallback
    return 'match sent';
  };

  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formatTime = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString(locale === 'fr' ? 'fr-CA' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  const processedMatches: MatchWithDisplayStatus[] = matches.map((match) => {
    const displayStatus = getDisplayStatus(match);

    // Use match creation date and time
    const displayDate = formatDate(match.createdAt);
    const displayTime = formatTime(match.createdAt);

    // Get the person (volunteer for participants, participant for volunteers)
    const person =
      userRole === UserRole.VOLUNTEER
        ? (match as VolunteerMatch).participant
        : (match as Match).volunteer;

    return {
      id: match.id,
      displayStatus,
      displayDate,
      displayTime,
      person,
      matchStatus: match.matchStatus,
    };
  });

  // Show "Not Matched" state when there are no matches
  if (processedMatches.length === 0) {
    return (
      <Box
        w="full"
        border="1px solid #E5E7EB"
        borderRadius="8px"
        bg="white"
        p={12}
        textAlign="center"
      >
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="80px"
          h="80px"
          borderRadius="full"
          bg="#F3F4F6"
          mb={4}
        >
          <Icon as={FiUser} boxSize={10} color="#9CA3AF" />
        </Box>
        <Text fontSize="20px" fontWeight={600} color="#1D3448" mb={2}>
          {t('notMatched')}
        </Text>
        <Text fontSize="14px" color="#6B7280">
          {userName ? t('hasNoActiveMatches', { name: userName }) : t('youHaveNoActiveMatches')}
        </Text>
      </Box>
    );
  }

  // Show "Currently Matched" state with matches list
  return (
    <VStack align="stretch" gap="40px" w="full">
      {/* Currently Matched Status Card */}
      <Box
        bg="white"
        border="1px solid #D5D7DA"
        borderRadius="8px"
        px="20px"
        py="24px"
        boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
      >
        <VStack align="center" gap="20px">
          {/* Success Icon */}
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="48px"
            h="48px"
            borderRadius="full"
            bg="#D1FADF"
            border="8px solid #ECFDF3"
          >
            <Box w="24px" h="24px" display="flex" alignItems="center" justifyContent="center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M16.6668 5L7.50016 14.1667L3.3335 10"
                  stroke="#039855"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          </Box>
          <VStack align="center" gap="8px">
            <Text
              fontSize="18px"
              fontWeight={600}
              color="#181D27"
              fontFamily="Open Sans, sans-serif"
            >
              {t('currentlyMatched')}
            </Text>
            <Text
              fontSize="14px"
              fontWeight={400}
              color="#535862"
              fontFamily="Open Sans, sans-serif"
            >
              {userName
                ? t('nameHasActiveMatches', { name: userName, count: processedMatches.length })
                : t('youHaveActiveMatches', { count: processedMatches.length })}
            </Text>
          </VStack>
        </VStack>
      </Box>

      {/* Matches Table */}
      <Box border="1px solid #D5D7DA" borderRadius="8px" bg="white" overflow="hidden">
        {/* Table Header */}
        <Box bg="white" borderBottom="1px solid #D5D7DA" px={6} py={3}>
          <HStack justify="space-between" align="center" gap={4}>
            <Box flex="1" minW="150px">
              <HStack gap="6px">
                <Text
                  fontSize="16px"
                  fontWeight={500}
                  color="#414651"
                  fontFamily="Inter, sans-serif"
                >
                  {t('name')}
                </Text>
                <Icon as={FiChevronDown} boxSize="16px" color="#414651" />
              </HStack>
            </Box>
            <Box w="150px">
              <HStack gap="6px">
                <Text
                  fontSize="16px"
                  fontWeight={500}
                  color="#414651"
                  fontFamily="Inter, sans-serif"
                >
                  {t('date')}
                </Text>
                <Icon as={FiChevronDown} boxSize="16px" color="#414651" />
              </HStack>
            </Box>
            <Box w="100px">
              <Text fontSize="16px" fontWeight={500} color="#414651" fontFamily="Inter, sans-serif">
                {t('time')}
              </Text>
            </Box>
            <Box w="140px" />
            <Box w="100px" />
          </HStack>
        </Box>

        {/* Table Body */}
        <VStack align="stretch" gap={0}>
          {processedMatches.map((match, index) => {
            const isExpanded = expandedMatches.has(match.id);
            const person = match.person;

            const fullName = person
              ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
              : t('unknown');

            const pronounsText =
              person?.pronouns && person.pronouns.length > 0 ? person.pronouns.join('/') : '';

            return (
              <Box key={match.id}>
                {index > 0 && <Box h="1px" bg="#D5D7DA" />}
                <Box>
                  {/* Main Row */}
                  <Box px={6} py={4}>
                    <HStack justify="space-between" align="center" gap={4}>
                      <Box flex="1" minW="150px">
                        <Flex align="center" gap="10px">
                          <Text
                            fontSize="18px"
                            fontWeight={600}
                            color="#1D3448"
                            fontFamily="Open Sans, sans-serif"
                          >
                            {fullName}
                          </Text>
                          {pronounsText && (
                            <Text
                              fontSize="14px"
                              fontWeight={400}
                              color="#495D6C"
                              fontFamily="Open Sans, sans-serif"
                            >
                              {pronounsText}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                      <Box w="150px">
                        <Text
                          fontSize="18px"
                          fontWeight={400}
                          color="#1D3448"
                          fontFamily="Open Sans, sans-serif"
                        >
                          {match.displayDate || '-'}
                        </Text>
                      </Box>
                      <Box w="100px">
                        <Text
                          fontSize="18px"
                          fontWeight={400}
                          color="#1D3448"
                          fontFamily="Open Sans, sans-serif"
                        >
                          {match.displayTime || '-'}
                        </Text>
                      </Box>
                      <Box w="140px">
                        <Badge
                          bg="rgba(179, 206, 209, 0.3)"
                          color="#056067"
                          borderRadius="16px"
                          px="14px"
                          py="6px"
                          fontSize="16px"
                          fontWeight={400}
                          textTransform="capitalize"
                          fontFamily="Open Sans, sans-serif"
                        >
                          {match.displayStatus}
                        </Badge>
                      </Box>
                      <Box w="100px">
                        <Button
                          bg="#056067"
                          color="white"
                          border="1px solid #056067"
                          borderRadius="8px"
                          px="14px"
                          py="8px"
                          h="36px"
                          fontWeight={600}
                          fontSize="14px"
                          fontFamily="Open Sans, sans-serif"
                          boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                          _hover={{ bg: '#044d52', borderColor: '#044d52' }}
                          _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
                          onClick={() => toggleMatchExpansion(match.id)}
                        >
                          <Flex align="center" gap="6px">
                            <Text>{t('details')}</Text>
                            <Icon
                              as={isExpanded ? FiChevronUp : FiChevronDown}
                              boxSize="20px"
                              strokeWidth="2px"
                            />
                          </Flex>
                        </Button>
                      </Box>
                    </HStack>
                  </Box>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <Box px="20px" py="24px" bg="#FAFAFA" borderTop="1px solid #D5D7DA">
                      {(() => {
                        // Track which treatments/experiences are from loved one
                        const regularTreatments = person?.treatments || [];
                        const lovedOneTreatments = person?.lovedOneTreatments || [];
                        const regularExperiences = person?.experiences || [];
                        const lovedOneExperiences = person?.lovedOneExperiences || [];

                        return (
                          <HStack align="flex-start" gap="24px" w="full">
                            {/* Overview */}
                            <VStack align="flex-start" gap="16px" flex="0 0 250px">
                              <Text
                                fontSize="18px"
                                fontWeight={600}
                                color="#1D3448"
                                fontFamily="Open Sans, sans-serif"
                              >
                                {t('overview')}
                              </Text>
                              <VStack align="flex-start" gap="8px" w="full">
                                {typeof person?.age === 'number' && (
                                  <Badge
                                    bg="rgba(179, 206, 209, 0.3)"
                                    color="#056067"
                                    borderRadius="14.04px"
                                    px="10.53px"
                                    pl="8.78px"
                                    py="5.27px"
                                    fontSize="16px"
                                    fontWeight={400}
                                    display="flex"
                                    alignItems="center"
                                    gap="3.51px"
                                    fontFamily="Open Sans, sans-serif"
                                  >
                                    <Icon as={FiUser} boxSize="10.53px" strokeWidth="1.32px" />
                                    {t('currentAge')} {person.age}
                                  </Badge>
                                )}
                                {person?.timezone && (
                                  <Badge
                                    bg="rgba(179, 206, 209, 0.3)"
                                    color="#056067"
                                    borderRadius="14.04px"
                                    px="10.53px"
                                    pl="8.78px"
                                    py="5.27px"
                                    fontSize="16px"
                                    fontWeight={400}
                                    display="flex"
                                    alignItems="center"
                                    gap="3.51px"
                                    fontFamily="Open Sans, sans-serif"
                                  >
                                    <Icon as={FiClock} boxSize="10.53px" strokeWidth="1.32px" />
                                    {t('timeZone')} {person.timezone}
                                  </Badge>
                                )}
                                {person?.diagnosis && (
                                  <Badge
                                    bg="rgba(179, 206, 209, 0.3)"
                                    color="#056067"
                                    borderRadius="14.04px"
                                    px="10.53px"
                                    pl="8.78px"
                                    py="5.27px"
                                    fontSize="16px"
                                    fontWeight={400}
                                    display="flex"
                                    alignItems="center"
                                    gap="3.51px"
                                    fontFamily="Open Sans, sans-serif"
                                  >
                                    <Icon as={FiActivity} boxSize="10.53px" strokeWidth="1.32px" />
                                    {person.diagnosis}
                                  </Badge>
                                )}
                                {person?.lovedOneDiagnosis && (
                                  <Badge
                                    bg="rgba(179, 206, 209, 0.3)"
                                    color="#056067"
                                    borderRadius="14.04px"
                                    px="10.53px"
                                    pl="8.78px"
                                    py="5.27px"
                                    fontSize="16px"
                                    fontWeight={400}
                                    display="flex"
                                    alignItems="center"
                                    gap="3.51px"
                                    fontFamily="Open Sans, sans-serif"
                                  >
                                    <Icon as={FiActivity} boxSize="10.53px" strokeWidth="1.32px" />
                                    {t('lovedOneLabel')} {person.lovedOneDiagnosis}
                                  </Badge>
                                )}
                                {!person?.age &&
                                  !person?.timezone &&
                                  !person?.diagnosis &&
                                  !person?.lovedOneDiagnosis && (
                                    <Text fontSize="14px" color="#6B7280">
                                      {t('noOverviewInfo')}
                                    </Text>
                                  )}
                              </VStack>
                            </VStack>

                            {/* Treatment Information */}
                            <VStack align="flex-start" gap="16px" flex="1">
                              <Text
                                fontSize="18px"
                                fontWeight={600}
                                color="#1D3448"
                                fontFamily="Open Sans, sans-serif"
                              >
                                {t('treatmentInformation')}
                              </Text>
                              <HStack gap="8px" flexWrap="wrap">
                                {regularTreatments.length > 0 || lovedOneTreatments.length > 0 ? (
                                  <>
                                    {regularTreatments.map((treatment: string, idx: number) => (
                                      <Badge
                                        key={`regular-${idx}`}
                                        bg="#EEF4FF"
                                        color="#3538CD"
                                        borderRadius="14.04px"
                                        px="12px"
                                        pl="10px"
                                        py="6px"
                                        fontSize="16px"
                                        fontWeight={400}
                                        fontFamily="Open Sans, sans-serif"
                                      >
                                        {treatment}
                                      </Badge>
                                    ))}
                                    {lovedOneTreatments.map((treatment: string, idx: number) => (
                                      <Badge
                                        key={`lovedone-${idx}`}
                                        bg="#EEF4FF"
                                        color="#3538CD"
                                        borderRadius="14.04px"
                                        px="12px"
                                        pl="10px"
                                        py="6px"
                                        fontSize="16px"
                                        fontWeight={400}
                                        fontFamily="Open Sans, sans-serif"
                                        display="flex"
                                        alignItems="center"
                                        gap="4px"
                                      >
                                        <Icon as={FiHeart} boxSize="12px" color="#056067" />
                                        {treatment}
                                      </Badge>
                                    ))}
                                  </>
                                ) : (
                                  <Text fontSize="14px" color="#6B7280">
                                    {t('noTreatmentInfo')}
                                  </Text>
                                )}
                              </HStack>
                            </VStack>

                            {/* Experience Information */}
                            <VStack align="flex-start" gap="16px" flex="1">
                              <Text
                                fontSize="18px"
                                fontWeight={600}
                                color="#1D3448"
                                fontFamily="Open Sans, sans-serif"
                              >
                                {t('experienceInformation')}
                              </Text>
                              <HStack gap="8px" flexWrap="wrap">
                                {regularExperiences.length > 0 || lovedOneExperiences.length > 0 ? (
                                  <>
                                    {regularExperiences.map((experience: string, idx: number) => (
                                      <Badge
                                        key={`regular-${idx}`}
                                        bg="#FDF2FA"
                                        color="#C11574"
                                        borderRadius="16px"
                                        px="12px"
                                        pl="10px"
                                        py="6px"
                                        fontSize="16px"
                                        fontWeight={400}
                                        fontFamily="Open Sans, sans-serif"
                                      >
                                        {experience}
                                      </Badge>
                                    ))}
                                    {lovedOneExperiences.map((experience: string, idx: number) => (
                                      <Badge
                                        key={`lovedone-${idx}`}
                                        bg="#FDF2FA"
                                        color="#C11574"
                                        borderRadius="16px"
                                        px="12px"
                                        pl="10px"
                                        py="6px"
                                        fontSize="16px"
                                        fontWeight={400}
                                        fontFamily="Open Sans, sans-serif"
                                        display="flex"
                                        alignItems="center"
                                        gap="4px"
                                      >
                                        <Icon as={FiHeart} boxSize="12px" color="#056067" />
                                        {experience}
                                      </Badge>
                                    ))}
                                  </>
                                ) : (
                                  <Text fontSize="14px" color="#6B7280">
                                    {t('noExperienceInfo')}
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </VStack>
  );
}
