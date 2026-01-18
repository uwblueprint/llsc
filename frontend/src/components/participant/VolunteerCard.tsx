import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { Match } from '@/types/matchTypes';
import { Avatar } from '@/components/ui/avatar';
import Badge from '@/components/dashboard/Badge';
import { COLORS } from '@/constants/form';
import { FiLoader } from 'react-icons/fi';
import { useTranslations } from 'next-intl';

interface VolunteerCardProps {
  match: Match;
  onSchedule?: (matchId: number) => void;
}

export function VolunteerCard({ match, onSchedule }: VolunteerCardProps) {
  const t = useTranslations('dashboard');
  const tOptions = useTranslations('options');
  const { volunteer } = match;

  // Helper to translate medical terms with fallback to original value
  const translateOption = (category: 'treatments' | 'experiences' | 'diagnoses', value: string) => {
    try {
      return tOptions(`${category}.${value}`);
    } catch {
      return value; // Fallback to original if translation not found
    }
  };

  // Format full name
  const fullName = `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim();

  // Format pronouns for display
  const pronounsText =
    volunteer.pronouns && volunteer.pronouns.length > 0 ? volunteer.pronouns.join('/') : '';

  const isRequestingNewTimes = match.matchStatus === 'requesting_new_times';

  return (
    <Box
      w="full"
      maxW="675px"
      border="1px solid #D5D7DA"
      borderRadius="8px"
      bg="white"
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      py="24px"
      px="28px"
      pb="80px"
      position="relative"
      minH="fit-content"
    >
      {/* Pending Badge - Top Right */}
      {isRequestingNewTimes && (
        <Box
          position="absolute"
          top="24px"
          right="28px"
          bg="#F5E9E1"
          borderRadius="16px"
          px="12px"
          py="4px"
          display="inline-flex"
          alignItems="center"
          gap="4px"
          height="28px"
        >
          <HStack gap="4px" align="center">
            <FiLoader size={12} color="#B26939" />
            <Text
              fontSize="14px"
              fontWeight={400}
              color="#B26939"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.4285714285714286em"
            >
              {t('pending')}
            </Text>
          </HStack>
        </Box>
      )}
      <VStack align="start" gap={0}>
        <HStack gap="32px" align="start">
          {/* Avatar */}
          <Avatar name={fullName} size="xl" bg="#F4F4F4" color="#000000" fontSize="36.52px" />

          {/* Volunteer Info */}
          <VStack align="start" gap={2}>
            <HStack gap={2} align="center">
              <Text
                fontSize="1.5rem"
                fontWeight={600}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.875rem"
                letterSpacing="0%"
              >
                {fullName}
              </Text>
              {pronounsText && (
                <Text
                  fontSize="1rem"
                  fontWeight={400}
                  color="#495D6C"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="100%"
                  letterSpacing="0%"
                  mr="16px"
                >
                  {pronounsText}
                </Text>
              )}
            </HStack>

            <HStack gap={2} align="center" wrap="wrap" mt="16px">
              {typeof volunteer.age === 'number' && (
                <Badge iconSrc="/icons/user-secondary.png">
                  {t('currentAge')} {volunteer.age}
                </Badge>
              )}
              {volunteer.timezone && (
                <Badge iconSrc="/icons/clock-secondary.png">
                  {t('timeZone')} {volunteer.timezone}
                </Badge>
              )}
              {volunteer.diagnosis && (
                <Badge iconSrc="/icons/activity-secondary.png">
                  {translateOption('diagnoses', volunteer.diagnosis)}
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Overview Section */}
        {volunteer.overview && (
          <Box mt={4}>
            <Text
              fontSize="1.125rem"
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb="16px"
            >
              {t('overview')}
            </Text>
            <Text
              fontSize="1rem"
              fontWeight={400}
              color="#495D6C"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.5"
            >
              {volunteer.overview}
            </Text>
          </Box>
        )}

        {/* Treatment Information */}
        {volunteer.treatments && volunteer.treatments.length > 0 && (
          <Box mt={4}>
            <Text
              fontSize="1.125rem"
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb="16px"
            >
              {t('treatmentInformation')}
            </Text>
            <HStack gap={2} wrap="wrap">
              {volunteer.treatments.map((treatment: string, index: number) => (
                <Badge key={index} bgColor="#EEF4FF" textColor="#3538CD">
                  {translateOption('treatments', treatment)}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* Experience Information */}
        {volunteer.experiences && volunteer.experiences.length > 0 && (
          <Box mt={4}>
            <Text
              fontSize="1.125rem"
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb="16px"
            >
              {t('experienceInformation')}
            </Text>
            <HStack gap={2} wrap="wrap">
              {volunteer.experiences.map((experience: string, index: number) => (
                <Badge key={index} bgColor="#FDF2FA" textColor="#C11574">
                  {translateOption('experiences', experience)}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>

      {/* Schedule call button - Positioned at bottom right */}
      {onSchedule && !isRequestingNewTimes && (
        <Button
          position="absolute"
          bottom="24px"
          right="28px"
          bg={COLORS.teal}
          color="white"
          fontWeight={600}
          fontSize="0.875rem"
          fontFamily="'Open Sans', sans-serif"
          px={6}
          py={3}
          borderRadius="6px"
          _hover={{
            bg: '#056067',
          }}
          _active={{
            bg: '#044953',
          }}
          onClick={() => onSchedule(match.id)}
        >
          {t('scheduleCall')}
        </Button>
      )}
    </Box>
  );
}
