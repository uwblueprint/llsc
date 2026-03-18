import React from 'react';
import { Box, Text, VStack, HStack, Badge, Button, Flex, Icon } from '@chakra-ui/react';
import {
  FiUser,
  FiClock,
  FiActivity,
  FiHeart,
  FiBell,
  FiCalendar,
  FiXCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { Match, MatchStatus, TimeBlock, VolunteerSummary } from '@/types/matchTypes';
import { UserRole } from '@/types/authTypes';

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; icon?: React.ElementType }
> = {
  requesting_new_times: {
    label: 'Time Request',
    bg: 'rgba(232, 188, 189, 0.3)',
    color: '#A70000',
    icon: FiBell,
  },
  awaiting_volunteer_acceptance: {
    label: 'Awaiting Volunteer',
    bg: '#F3F4F6',
    color: '#6B7280',
    icon: FiClock,
  },
  cancelled_by_volunteer: {
    label: 'Cancelled by Volunteer',
    bg: '#FEE4E2',
    color: '#D92D20',
    icon: FiXCircle,
  },
  cancelled_by_participant: {
    label: 'Cancelled by Participant',
    bg: '#FEE4E2',
    color: '#D92D20',
    icon: FiXCircle,
  },
  confirmed: { label: 'Call Scheduled', bg: '#D1FADF', color: '#039855', icon: FiCheckCircle },
  pending: { label: 'Pending', bg: 'rgba(179, 206, 209, 0.3)', color: '#056067', icon: FiClock },
};

// Role-specific label overrides (volunteer perspective)
const VOLUNTEER_LABEL_OVERRIDES: Record<string, string> = {
  pending: 'Awaiting Participant',
  awaiting_volunteer_acceptance: 'Action Required',
};

// Role-specific label overrides (participant perspective)
const PARTICIPANT_LABEL_OVERRIDES: Record<string, string> = {
  pending: 'Action Required',
};

function StatusBadge({ matchStatus, userRole }: { matchStatus: string; userRole?: UserRole }) {
  const config = STATUS_BADGE_CONFIG[matchStatus];
  if (!config) return null;

  let label = config.label;
  if (userRole === UserRole.VOLUNTEER && VOLUNTEER_LABEL_OVERRIDES[matchStatus]) {
    label = VOLUNTEER_LABEL_OVERRIDES[matchStatus];
  } else if (userRole === UserRole.PARTICIPANT && PARTICIPANT_LABEL_OVERRIDES[matchStatus]) {
    label = PARTICIPANT_LABEL_OVERRIDES[matchStatus];
  }

  return (
    <Badge
      bg={config.bg}
      color={config.color}
      borderRadius="16px"
      px="10px"
      py="4px"
      fontSize="13px"
      fontWeight={600}
      textTransform="none"
      fontFamily="Open Sans, sans-serif"
      display="inline-flex"
      alignItems="center"
      gap="4px"
      whiteSpace="nowrap"
    >
      {config.icon && <Icon as={config.icon} boxSize="13px" />}
      {label}
    </Badge>
  );
}

function formatScheduledTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface MatchStatusScreenProps {
  matches: Match[] | VolunteerMatch[];
  userRole: UserRole;
  userName?: string;
  onViewRequest?: (matchId: number) => void;
  onScheduleCall?: (matchId: number) => void;
  onRequestNewTimes?: (matchId: number) => void;
  onCancelCall?: (matchId: number) => void;
  onViewContactDetails?: (matchId: number) => void;
}

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

interface ProcessedMatch {
  id: number;
  person: VolunteerSummary | ParticipantSummary;
  matchStatus: MatchStatus;
  isTimeRequest: boolean;
  hasSuggestedTimes: boolean;
  chosenTimeBlock: TimeBlock | null;
}

export function MatchStatusScreen({
  matches,
  userRole,
  userName,
  onViewRequest,
  onScheduleCall,
  onRequestNewTimes,
  onCancelCall,
  onViewContactDetails,
}: MatchStatusScreenProps) {
  const processedMatches: ProcessedMatch[] = matches.map((match) => {
    const person =
      userRole === UserRole.VOLUNTEER
        ? (match as VolunteerMatch).participant
        : (match as Match).volunteer;

    const hasSuggestedTimes =
      ('suggestedTimeBlocks' in match &&
        Array.isArray(match.suggestedTimeBlocks) &&
        match.suggestedTimeBlocks.length > 0) ||
      false;

    const chosenTimeBlock =
      'chosenTimeBlock' in match && match.chosenTimeBlock ? match.chosenTimeBlock : null;

    return {
      id: match.id,
      person,
      matchStatus: match.matchStatus,
      isTimeRequest: match.matchStatus.toLowerCase() === 'requesting_new_times',
      hasSuggestedTimes,
      chosenTimeBlock,
    };
  });

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
          Not Matched
        </Text>
        <Text fontSize="14px" color="#6B7280">
          {userName ? `${userName} has` : 'You have'} no active matches.
        </Text>
      </Box>
    );
  }

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
              Currently Matched
            </Text>
            <Text
              fontSize="14px"
              fontWeight={400}
              color="#535862"
              fontFamily="Open Sans, sans-serif"
            >
              {userName ? `${userName} has` : 'You have'} {processedMatches.length} active{' '}
              {processedMatches.length === 1 ? 'match' : 'matches'}.
            </Text>
          </VStack>
        </VStack>
      </Box>

      {/* Match Cards */}
      {processedMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          userRole={userRole}
          onViewRequest={onViewRequest}
          onScheduleCall={onScheduleCall}
          onRequestNewTimes={onRequestNewTimes}
          onCancelCall={onCancelCall}
          onViewContactDetails={onViewContactDetails}
        />
      ))}
    </VStack>
  );
}

interface MatchCardProps {
  match: ProcessedMatch;
  userRole: UserRole;
  onViewRequest?: (matchId: number) => void;
  onScheduleCall?: (matchId: number) => void;
  onRequestNewTimes?: (matchId: number) => void;
  onCancelCall?: (matchId: number) => void;
  onViewContactDetails?: (matchId: number) => void;
}

function MatchCard({
  match,
  userRole,
  onViewRequest,
  onScheduleCall,
  onRequestNewTimes,
  onCancelCall,
  onViewContactDetails,
}: MatchCardProps) {
  const person = match.person;

  const fullName = person
    ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
    : 'Unknown';

  const initials = person
    ? `${(person.firstName || '').charAt(0)}${(person.lastName || '').charAt(0)}`.toUpperCase()
    : '?';

  const pronounsText =
    person?.pronouns && person.pronouns.length > 0 ? person.pronouns.join('/') : '';

  const regularTreatments = person?.treatments || [];
  const lovedOneTreatments = person?.lovedOneTreatments || [];
  const regularExperiences = person?.experiences || [];
  const lovedOneExperiences = person?.lovedOneExperiences || [];

  return (
    <VStack align="stretch" gap="12px">
      {/* Card */}
      <Box
        bg="white"
        border="1px solid #D5D7DA"
        borderRadius="7px"
        px="25px"
        py="21px"
        boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
      >
        <VStack align="stretch" gap="28px">
          {/* Top section: Avatar + Name/Pronouns + Overview Badges + Status Badge */}
          <HStack align="flex-start" gap="28px">
            {/* Avatar */}
            <Box
              w="79px"
              h="79px"
              borderRadius="full"
              bg="#F4F4F4"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                fontSize="32px"
                fontWeight={600}
                color="#000000"
                opacity={0.8}
                fontFamily="Inter, sans-serif"
                letterSpacing="-1.5%"
              >
                {initials}
              </Text>
            </Box>

            {/* Name + Overview */}
            <VStack align="flex-start" gap="12px" flex={1}>
              <Flex align="center" gap="14px" flexWrap="wrap">
                <Text
                  fontSize="21px"
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

              <HStack gap="14px" flexWrap="wrap">
                {typeof person?.age === 'number' && (
                  <Badge
                    bg="rgba(179, 206, 209, 0.3)"
                    color="#056067"
                    borderRadius="14px"
                    px="10px"
                    pl="9px"
                    py="5px"
                    fontSize="14px"
                    fontWeight={400}
                    display="flex"
                    alignItems="center"
                    gap="3.5px"
                    fontFamily="Open Sans, sans-serif"
                  >
                    <Icon as={FiUser} boxSize="10.5px" strokeWidth="1.3px" />
                    Current Age: {person.age}
                  </Badge>
                )}
                {person?.timezone && (
                  <Badge
                    bg="rgba(179, 206, 209, 0.3)"
                    color="#056067"
                    borderRadius="14px"
                    px="10px"
                    pl="9px"
                    py="5px"
                    fontSize="14px"
                    fontWeight={400}
                    display="flex"
                    alignItems="center"
                    gap="3.5px"
                    fontFamily="Open Sans, sans-serif"
                  >
                    <Icon as={FiClock} boxSize="10.5px" strokeWidth="1.3px" />
                    Time Zone: {person.timezone}
                  </Badge>
                )}
                {person?.diagnosis && (
                  <Badge
                    bg="rgba(179, 206, 209, 0.3)"
                    color="#056067"
                    borderRadius="14px"
                    px="10px"
                    pl="9px"
                    py="5px"
                    fontSize="14px"
                    fontWeight={400}
                    display="flex"
                    alignItems="center"
                    gap="3.5px"
                    fontFamily="Open Sans, sans-serif"
                  >
                    <Icon as={FiActivity} boxSize="10.5px" strokeWidth="1.3px" />
                    {person.diagnosis}
                  </Badge>
                )}
                {person?.lovedOneDiagnosis && (
                  <Badge
                    bg="rgba(179, 206, 209, 0.3)"
                    color="#056067"
                    borderRadius="14px"
                    px="10px"
                    pl="9px"
                    py="5px"
                    fontSize="14px"
                    fontWeight={400}
                    display="flex"
                    alignItems="center"
                    gap="3.5px"
                    fontFamily="Open Sans, sans-serif"
                  >
                    <Icon as={FiActivity} boxSize="10.5px" strokeWidth="1.3px" />
                    Loved One: {person.lovedOneDiagnosis}
                  </Badge>
                )}
              </HStack>
            </VStack>

            {/* Status Badge — top right */}
            <Box flexShrink={0} pt="4px">
              <StatusBadge matchStatus={match.matchStatus} userRole={userRole} />
            </Box>
          </HStack>

          {/* Treatment + Experience Information */}
          <VStack align="stretch" gap="21px">
            {/* Treatment Information */}
            <HStack align="flex-start" gap="44px">
              <VStack align="flex-start" gap="12px" flex={1}>
                <Text
                  fontSize="16px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="Open Sans, sans-serif"
                >
                  Treatment Information
                </Text>
                <HStack gap="18px" flexWrap="wrap">
                  {regularTreatments.length > 0 || lovedOneTreatments.length > 0 ? (
                    <>
                      {regularTreatments.map((treatment: string, idx: number) => (
                        <Badge
                          key={`regular-${idx}`}
                          bg="#EEF4FF"
                          color="#3538CD"
                          borderRadius="14px"
                          px="11px"
                          py="5px"
                          fontSize="14px"
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
                          borderRadius="14px"
                          px="11px"
                          py="5px"
                          fontSize="14px"
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
                      No treatment information available
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>

            {/* Experience Information */}
            <HStack align="flex-start" gap="44px">
              <VStack align="flex-start" gap="12px" flex={1}>
                <Text
                  fontSize="16px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="Open Sans, sans-serif"
                >
                  Experience Information
                </Text>
                <HStack gap="18px" flexWrap="wrap">
                  {regularExperiences.length > 0 || lovedOneExperiences.length > 0 ? (
                    <>
                      {regularExperiences.map((experience: string, idx: number) => (
                        <Badge
                          key={`regular-${idx}`}
                          bg="#FDF2FA"
                          color="#C11574"
                          borderRadius="16px"
                          px="11px"
                          py="5px"
                          fontSize="14px"
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
                          px="11px"
                          py="5px"
                          fontSize="14px"
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
                      No experience information available
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </VStack>

          {/* Scheduled Time Banner (for confirmed matches) */}
          {match.matchStatus === 'confirmed' && match.chosenTimeBlock && (
            <Box bg="#ECFDF3" border="1px solid #A6F4C5" borderRadius="8px" px="20px" py="14px">
              <HStack gap="10px" align="center">
                <Icon as={FiCalendar} boxSize="18px" color="#039855" />
                <VStack align="flex-start" gap="2px">
                  <Text
                    fontSize="13px"
                    fontWeight={600}
                    color="#027A48"
                    fontFamily="Open Sans, sans-serif"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    Scheduled Call
                  </Text>
                  <Text
                    fontSize="15px"
                    fontWeight={500}
                    color="#054F31"
                    fontFamily="Open Sans, sans-serif"
                  >
                    {formatScheduledTime(match.chosenTimeBlock.startTime)}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Action Button */}
          <Flex justify="flex-end" gap="12px">
            {userRole === UserRole.VOLUNTEER && (
              <>
                {match.isTimeRequest && onViewRequest ? (
                  <Button
                    bg="#A70000"
                    color="white"
                    border="1px solid #A70000"
                    borderRadius="7px"
                    px="25px"
                    py="10.5px"
                    h="auto"
                    fontWeight={600}
                    fontSize="16px"
                    fontFamily="Open Sans, sans-serif"
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: '#8A0000', borderColor: '#8A0000' }}
                    _active={{ bg: '#700000', borderColor: '#700000' }}
                    onClick={() => onViewRequest(match.id)}
                  >
                    View Request
                  </Button>
                ) : (match.matchStatus === 'awaiting_volunteer_acceptance' ||
                    match.matchStatus === 'cancelled_by_volunteer' ||
                    match.matchStatus === 'cancelled_by_participant') &&
                  onScheduleCall ? (
                  <Button
                    bg="#056067"
                    color="white"
                    border="1px solid #056067"
                    borderRadius="7px"
                    px="25px"
                    py="10.5px"
                    h="auto"
                    fontWeight={600}
                    fontSize="16px"
                    fontFamily="Open Sans, sans-serif"
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: '#044d52', borderColor: '#044d52' }}
                    _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
                    onClick={() => onScheduleCall(match.id)}
                  >
                    Schedule call
                  </Button>
                ) : match.matchStatus === 'confirmed' ? (
                  <>
                    {onCancelCall && (
                      <Button
                        bg="#A70000"
                        color="white"
                        border="1px solid #A70000"
                        borderRadius="8px"
                        px="28px"
                        py="10px"
                        h="auto"
                        fontWeight={600}
                        fontSize="16px"
                        fontFamily="Open Sans, sans-serif"
                        boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                        _hover={{ bg: '#8B0000', borderColor: '#8B0000' }}
                        _active={{ bg: '#750000', borderColor: '#750000' }}
                        onClick={() => onCancelCall(match.id)}
                      >
                        Cancel Call
                      </Button>
                    )}
                    {onViewContactDetails && (
                      <Button
                        bg="#056067"
                        color="white"
                        border="1px solid #056067"
                        borderRadius="8px"
                        px="28px"
                        py="10px"
                        h="auto"
                        fontWeight={600}
                        fontSize="16px"
                        fontFamily="Open Sans, sans-serif"
                        boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                        _hover={{ bg: '#044d52', borderColor: '#044d52' }}
                        _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
                        onClick={() => onViewContactDetails(match.id)}
                      >
                        View Contact Details
                      </Button>
                    )}
                  </>
                ) : null}
              </>
            )}
            {userRole === UserRole.PARTICIPANT &&
              match.matchStatus === 'pending' &&
              match.hasSuggestedTimes && (
                <>
                  {onRequestNewTimes && (
                    <Button
                      bg="white"
                      color="#344054"
                      border="1px solid #D0D5DD"
                      borderRadius="7px"
                      px="25px"
                      py="10.5px"
                      h="auto"
                      fontWeight={600}
                      fontSize="16px"
                      fontFamily="Open Sans, sans-serif"
                      boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                      _hover={{ bg: '#F9FAFB' }}
                      onClick={() => onRequestNewTimes(match.id)}
                    >
                      Request new times
                    </Button>
                  )}
                  {onScheduleCall && (
                    <Button
                      bg="#056067"
                      color="white"
                      border="1px solid #056067"
                      borderRadius="7px"
                      px="25px"
                      py="10.5px"
                      h="auto"
                      fontWeight={600}
                      fontSize="16px"
                      fontFamily="Open Sans, sans-serif"
                      boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                      _hover={{ bg: '#044d52', borderColor: '#044d52' }}
                      _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
                      onClick={() => onScheduleCall(match.id)}
                    >
                      Schedule call
                    </Button>
                  )}
                </>
              )}
            {userRole === UserRole.PARTICIPANT && match.matchStatus === 'confirmed' && (
              <>
                {onCancelCall && (
                  <Button
                    bg="#A70000"
                    color="white"
                    border="1px solid #A70000"
                    borderRadius="8px"
                    px="28px"
                    py="10px"
                    h="auto"
                    fontWeight={600}
                    fontSize="16px"
                    fontFamily="Open Sans, sans-serif"
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: '#8B0000', borderColor: '#8B0000' }}
                    _active={{ bg: '#750000', borderColor: '#750000' }}
                    onClick={() => onCancelCall(match.id)}
                  >
                    Cancel Call
                  </Button>
                )}
                {onViewContactDetails && (
                  <Button
                    bg="#056067"
                    color="white"
                    border="1px solid #056067"
                    borderRadius="8px"
                    px="28px"
                    py="10px"
                    h="auto"
                    fontWeight={600}
                    fontSize="16px"
                    fontFamily="Open Sans, sans-serif"
                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                    _hover={{ bg: '#044d52', borderColor: '#044d52' }}
                    _active={{ bg: '#033a3e', borderColor: '#033a3e' }}
                    onClick={() => onViewContactDetails(match.id)}
                  >
                    View Contact Details
                  </Button>
                )}
              </>
            )}
          </Flex>
        </VStack>
      </Box>
    </VStack>
  );
}
