import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { Match } from '@/types/matchTypes';
import { Avatar } from '@/components/ui/avatar';
import Badge from '@/components/dashboard/Badge';
import { COLORS } from '@/constants/form';
import { FiLoader } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface VolunteerCardProps {
  match: Match;
  onSchedule?: (matchId: number) => void;
}

export function VolunteerCard({ match, onSchedule }: VolunteerCardProps) {
  const t = useTranslations('dashboard');
  const tOptions = useTranslations('options');
  const isDesktop = useIsDesktop();
  const { volunteer } = match;

  // Format full name
  const fullName = `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim();

  // Format pronouns for display
  const pronounsText =
    volunteer.pronouns && volunteer.pronouns.length > 0 ? volunteer.pronouns.join('/') : '';

  const isRequestingNewTimes = match.matchStatus === 'requesting_new_times';

  return (
    <Box
      w="full"
      maxW={{ base: '100%', lg: '675px' }}
      border="1px solid #D5D7DA"
      borderRadius="8px"
      bg="white"
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      py={{ base: '16px', lg: '24px' }}
      px={{ base: '16px', lg: '28px' }}
      pb={{ base: '16px', lg: '80px' }}
      position="relative"
      minH="fit-content"
    >
      {/* Pending Badge - Top Right */}
      {isRequestingNewTimes && (
        <Box
          position="absolute"
          top={{ base: '16px', lg: '24px' }}
          right={{ base: '16px', lg: '28px' }}
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
              Pending
            </Text>
          </HStack>
        </Box>
      )}
      <VStack align="start" gap={0}>
        <HStack gap={{ base: '12px', lg: '32px' }} align="start">
          {/* Avatar */}
          <Avatar
            name={fullName}
            size={isDesktop ? 'xl' : 'lg'}
            bg="#F4F4F4"
            color="#000000"
            fontSize={isDesktop ? '36.52px' : '24px'}
          />

          {/* Volunteer Info */}
          <VStack align="start" gap={2} flex={1}>
            <HStack gap={2} align="center" wrap="wrap">
              <Text
                fontSize={{ base: '1.125rem', lg: '1.5rem' }}
                fontWeight={600}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
                lineHeight={{ base: '1.5rem', lg: '1.875rem' }}
                letterSpacing="0%"
              >
                {fullName}
              </Text>
              {pronounsText && (
                <Text
                  fontSize={{ base: '0.875rem', lg: '1rem' }}
                  fontWeight={400}
                  color="#495D6C"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="100%"
                  letterSpacing="0%"
                >
                  {pronounsText}
                </Text>
              )}
            </HStack>

            <HStack gap={2} align="center" wrap="wrap" mt={{ base: '8px', lg: '16px' }}>
              {typeof volunteer.age === 'number' && (
                <Badge iconSrc="/icons/user-secondary.png">Current Age: {volunteer.age}</Badge>
              )}
              {volunteer.timezone && (
                <Badge iconSrc="/icons/clock-secondary.png">Time Zone: {volunteer.timezone}</Badge>
              )}
              {volunteer.diagnosis && (
                <Badge iconSrc="/icons/activity-secondary.png">{volunteer.diagnosis}</Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Overview Section */}
        {volunteer.overview && (
          <Box mt={4}>
            <Text
              fontSize={{ base: '1rem', lg: '1.125rem' }}
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb={{ base: '8px', lg: '16px' }}
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

        {/* Treatment Information */}
        {volunteer.treatments && volunteer.treatments.length > 0 && (
          <Box mt={4}>
            <Text
              fontSize={{ base: '1rem', lg: '1.125rem' }}
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb={{ base: '8px', lg: '16px' }}
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

        {/* Experience Information */}
        {volunteer.experiences && volunteer.experiences.length > 0 && (
          <Box mt={4}>
            <Text
              fontSize={{ base: '1rem', lg: '1.125rem' }}
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.875rem"
              letterSpacing="0%"
              mb={{ base: '8px', lg: '16px' }}
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
      </VStack>

      {/* Schedule call button */}
      {onSchedule && !isRequestingNewTimes && (
        <Button
          position={isDesktop ? 'absolute' : 'relative'}
          bottom={isDesktop ? '24px' : undefined}
          right={isDesktop ? '28px' : undefined}
          w={{ base: '100%', lg: 'auto' }}
          mt={{ base: 4, lg: 0 }}
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
          Schedule call
        </Button>
      )}
    </Box>
  );
}
