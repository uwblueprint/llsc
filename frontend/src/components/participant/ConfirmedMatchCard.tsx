import { Box, Button, Flex, Text, VStack, HStack } from '@chakra-ui/react';
import { Match } from '@/types/matchTypes';
import { formatDateRelative, formatDateShort, formatTime } from '@/utils/dateUtils';
import { Avatar } from '@/components/ui/avatar';
import Badge from '@/components/dashboard/Badge';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useTranslations } from 'next-intl';

interface ConfirmedMatchCardProps {
  match: Match;
  onCancelCall?: (matchId: number) => void;
  onViewContactDetails?: (matchId: number) => void;
}

export function ConfirmedMatchCard({
  match,
  onCancelCall,
  onViewContactDetails,
}: ConfirmedMatchCardProps) {
  const t = useTranslations('dashboard');
  const isDesktop = useIsDesktop();
  const { volunteer, chosenTimeBlock } = match;

  if (!chosenTimeBlock) {
    return null;
  }

  const dateLabel = formatDateRelative(chosenTimeBlock.startTime);
  const dateShort = formatDateShort(chosenTimeBlock.startTime);
  const timeFormatted = formatTime(chosenTimeBlock.startTime);

  // Format pronouns for display
  const pronounsText =
    volunteer.pronouns && volunteer.pronouns.length > 0 ? volunteer.pronouns.join('/') : null;

  // Format timezone (remove underscores, capitalize)
  const formatTimezone = (tz: string) => {
    return tz.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get volunteer timezone or use placeholder
  const volunteerTimezone = volunteer.timezone ? formatTimezone(volunteer.timezone) : 'TBD';

  return (
    <VStack align="stretch" gap={4}>
      {/* Date Badge - Above the card */}
      <Box display="flex" alignItems="center" gap={2} alignSelf="flex-start">
        <Text
          fontSize={{ base: '16px', lg: '20px' }}
          fontWeight="600"
          color="#056067"
          fontFamily="Open Sans"
        >
          {dateShort}
        </Text>
        <Text
          fontSize={{ base: '14px', lg: '18px' }}
          fontWeight="400"
          color="#056067"
          fontFamily="Open Sans"
        >
          {dateLabel}
        </Text>
      </Box>

      {/* Card with blue bar and volunteer info */}
      <Flex gap={3} align="stretch">
        {/* Time - to the left of blue bar */}
        <Box display="flex" alignItems="flex-start" pt={2}>
          <Text
            fontSize={{ base: '14px', lg: '18px' }}
            fontWeight="400"
            color="#1F2937"
            fontFamily="Open Sans"
            whiteSpace="nowrap"
          >
            {timeFormatted}
          </Text>
        </Box>

        {/* Blue vertical bar */}
        <Box bg="#5F989D" w="4px" borderRadius="4px" />

        {/* Volunteer Card */}
        <Box
          flex={1}
          bg="white"
          border="1px solid"
          borderColor="#D5D7DA"
          borderRadius="8px"
          p={{ base: 4, lg: 7 }}
          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        >
          <VStack align="stretch" gap={0}>
            {/* Volunteer Info */}
            <HStack
              gap={{ base: 3, lg: 8 }}
              align="flex-start"
              mb={4}
              flexDirection={{ base: 'column', lg: 'row' }}
            >
              {/* Avatar + Name row on mobile */}
              <HStack gap={3} align="center" w="100%">
                <Avatar
                  name={`${volunteer.firstName} ${volunteer.lastName}`}
                  size={isDesktop ? 'xl' : 'lg'}
                  bg="#F4F4F4"
                  color="#000000"
                  fontSize={isDesktop ? '36.52px' : '24px'}
                />
                {/* Name and pronouns on mobile - inline with avatar */}
                {!isDesktop && (
                  <VStack align="start" gap={0} flex={1}>
                    <Text
                      fontSize="1.125rem"
                      fontWeight={600}
                      color="#1D3448"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="1.5rem"
                    >
                      {volunteer.firstName} {volunteer.lastName}
                    </Text>
                    {pronounsText && (
                      <Text
                        fontSize="0.875rem"
                        fontWeight={400}
                        color="#495D6C"
                        fontFamily="'Open Sans', sans-serif"
                      >
                        {pronounsText}
                      </Text>
                    )}
                  </VStack>
                )}
              </HStack>

              {/* Name, pronouns, and info badges - desktop layout */}
              <VStack align="start" gap={2} flex={1} display={{ base: 'none', lg: 'flex' }}>
                {/* Name and pronouns */}
                <HStack gap={2} align="center">
                  <Text
                    fontSize="1.5rem"
                    fontWeight={600}
                    color="#1D3448"
                    fontFamily="'Open Sans', sans-serif"
                    lineHeight="1.875rem"
                  >
                    {volunteer.firstName} {volunteer.lastName}
                  </Text>
                  {pronounsText && (
                    <Text
                      fontSize="1rem"
                      fontWeight={400}
                      color="#495D6C"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="100%"
                    >
                      {pronounsText}
                    </Text>
                  )}
                </HStack>

                {/* Info badges */}
                <HStack gap={2} align="center" wrap="wrap" mt={4}>
                  {typeof volunteer.age === 'number' && (
                    <Badge
                      iconSrc="/icons/user-secondary.png"
                      bgColor="rgba(179, 206, 209, 0.3)"
                      textColor="#056067"
                    >
                      Current Age: {volunteer.age}
                    </Badge>
                  )}
                  <Badge
                    iconSrc="/icons/clock-secondary.png"
                    bgColor="rgba(179, 206, 209, 0.3)"
                    textColor="#056067"
                  >
                    Time Zone: {volunteerTimezone}
                  </Badge>
                  {volunteer.diagnosis && (
                    <Badge
                      iconSrc="/icons/activity-secondary.png"
                      bgColor="rgba(179, 206, 209, 0.3)"
                      textColor="#056067"
                    >
                      {volunteer.diagnosis}
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>

            {/* Info badges - mobile only, below avatar/name row */}
            {!isDesktop && (
              <HStack gap={2} align="center" wrap="wrap" mb={4}>
                {typeof volunteer.age === 'number' && (
                  <Badge
                    iconSrc="/icons/user-secondary.png"
                    bgColor="rgba(179, 206, 209, 0.3)"
                    textColor="#056067"
                  >
                    {t('currentAge')} {volunteer.age}
                  </Badge>
                )}
                <Badge
                  iconSrc="/icons/clock-secondary.png"
                  bgColor="rgba(179, 206, 209, 0.3)"
                  textColor="#056067"
                >
                  {t('timeZone')} {volunteerTimezone}
                </Badge>
                {volunteer.diagnosis && (
                  <Badge
                    iconSrc="/icons/activity-secondary.png"
                    bgColor="rgba(179, 206, 209, 0.3)"
                    textColor="#056067"
                  >
                    {volunteer.diagnosis}
                  </Badge>
                )}
              </HStack>
            )}

            {/* Overview Section */}
            {volunteer.overview && (
              <Box mt={4}>
                <Text
                  fontSize={{ base: '1rem', lg: '1.125rem' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875rem"
                  mb={{ base: 2, lg: 4 }}
                >
                  Overview
                </Text>
                <Text
                  fontSize={{ base: '0.875rem', lg: '1rem' }}
                  fontWeight={400}
                  color="#495D6C"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.5"
                >
                  {volunteer.overview}
                </Text>
              </Box>
            )}

            {/* Treatment Information Section */}
            {volunteer.treatments && volunteer.treatments.length > 0 && (
              <Box mt={4}>
                <Text
                  fontSize={{ base: '1rem', lg: '1.125rem' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875rem"
                  mb={{ base: 2, lg: 4 }}
                >
                  Treatment Information
                </Text>
                <HStack gap={2} wrap="wrap">
                  {volunteer.treatments.map((treatment: string, index: number) => (
                    <Badge key={index} bgColor="#EEF4FF" textColor="#3538CD">
                      {treatment}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Experience Information Section */}
            {volunteer.experiences && volunteer.experiences.length > 0 && (
              <Box mt={4}>
                <Text
                  fontSize={{ base: '1rem', lg: '1.125rem' }}
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.875rem"
                  mb={{ base: 2, lg: 4 }}
                >
                  Experience Information
                </Text>
                <HStack gap={2} wrap="wrap">
                  {volunteer.experiences.map((experience: string, index: number) => (
                    <Badge key={index} bgColor="#FDF2FA" textColor="#C11574">
                      {experience}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Action Buttons */}
            <Flex
              justify={{ base: 'stretch', lg: 'flex-end' }}
              direction={{ base: 'column', lg: 'row' }}
              gap={3}
              mt={6}
            >
              {onCancelCall && (
                <Button
                  bg="#DC2626"
                  color="white"
                  px={6}
                  py={2.5}
                  borderRadius="8px"
                  fontWeight={600}
                  fontSize="md"
                  fontFamily="'Open Sans', sans-serif"
                  w={{ base: '100%', lg: 'auto' }}
                  _hover={{ bg: '#B91C1C' }}
                  _active={{ bg: '#991B1B' }}
                  onClick={() => onCancelCall(match.id)}
                >
                  Cancel Call
                </Button>
              )}
              {onViewContactDetails && (
                <Button
                  bg="#056067"
                  color="white"
                  px={6}
                  py={2.5}
                  borderRadius="8px"
                  fontWeight={600}
                  fontSize="md"
                  fontFamily="'Open Sans', sans-serif"
                  w={{ base: '100%', lg: 'auto' }}
                  _hover={{ bg: '#044d52' }}
                  _active={{ bg: '#033a3e' }}
                  onClick={() => onViewContactDetails(match.id)}
                >
                  View Contact Details
                </Button>
              )}
            </Flex>
          </VStack>
        </Box>
      </Flex>
    </VStack>
  );
}
