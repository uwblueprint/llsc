import React from 'react';
import { Box, Text, VStack, HStack, Button } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import Badge from './Badge';
import { COLORS } from '@/constants/form';
import { useTranslations } from 'next-intl';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface ProfileCardProps {
  participant: {
    id: number;
    name: string;
    pronouns: string;
    age: number;
    timezone: string;
    diagnosis: string;
    treatments: string[];
    experiences?: string[];
    initials: string;
  };
  time?: Date;
  showTimes?: boolean;
  onScheduleCall?: () => void;
  onViewContact?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  participant,
  time,
  showTimes = false,
  onScheduleCall,
  onViewContact,
}) => {
  const t = useTranslations('dashboard');
  const isDesktop = useIsDesktop();
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (showTimes && time) {
    return (
      <HStack gap={{ base: '12px', lg: '24px' }} align="start" w="100%">
        {/* Time with vertical line */}
        <HStack gap={{ base: '12px', lg: '24px' }} align="start">
          <Text
            fontSize={{ base: '0.875rem', lg: '1rem' }}
            fontWeight={400}
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            whiteSpace="nowrap"
          >
            {formatTime(time)}
          </Text>
          <Box w="4px" minH={{ base: '200px', lg: '371px' }} bg="#5F989D" borderRadius="11px" />
        </HStack>

        {/* Card */}
        <ProfileCardContent
          participant={participant}
          onScheduleCall={onScheduleCall}
          onViewContact={onViewContact}
          isDesktop={isDesktop}
        />
      </HStack>
    );
  }

  return (
    <ProfileCardContent
      participant={participant}
      onScheduleCall={onScheduleCall}
      onViewContact={onViewContact}
      isDesktop={isDesktop}
    />
  );
};

const ProfileCardContent: React.FC<{
  participant: ProfileCardProps['participant'];
  onScheduleCall?: () => void;
  onViewContact?: () => void;
  isDesktop: boolean;
}> = ({ participant, onScheduleCall, onViewContact, isDesktop }) => {
  const t = useTranslations('dashboard');
  const tOptions = useTranslations('options');

  // Helper to translate medical terms with fallback to original value
  const translateOption = (category: 'treatments' | 'experiences' | 'diagnoses', value: string) => {
    try {
      return tOptions(`${category}.${value}`);
    } catch {
      return value; // Fallback to original if translation not found
    }
  };

  return (
    <Box
      w={{ base: '100%', lg: '675px' }}
      minH={{ base: 'auto', lg: '371px' }}
      border="1px solid #D5D7DA"
      borderRadius="8px"
      bg="white"
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      py={{ base: '16px', lg: '24px' }}
      px={{ base: '16px', lg: '28px' }}
      pb={{ base: '16px', lg: '24px' }}
      position="relative"
    >
      <VStack align="start" gap={0}>
        <HStack gap={{ base: '12px', lg: '32px' }} align="start">
          {/* Avatar */}
          <Avatar
            name={participant.name}
            size={isDesktop ? 'xl' : 'lg'}
            bg="#F4F4F4"
            color="#000000"
            fontSize={isDesktop ? '36.52px' : '24px'}
          />

          {/* Participant Info */}
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
                {participant.name}
              </Text>
              {participant.pronouns && (
                <Text
                  fontSize={{ base: '0.875rem', lg: '1rem' }}
                  fontWeight={400}
                  color="#495D6C"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="100%"
                  letterSpacing="0%"
                >
                  {participant.pronouns}
                </Text>
              )}
            </HStack>

            <HStack gap={2} align="center" wrap="wrap" mt={{ base: '8px', lg: '16px' }}>
              <Badge iconSrc="/icons/user-secondary.png">
                {t('currentAge')} {participant.age}
              </Badge>
              <Badge iconSrc="/icons/clock-secondary.png">
                {t('timeZone')} {participant.timezone}
              </Badge>
              <Badge iconSrc="/icons/activity-secondary.png">
                {translateOption('diagnoses', participant.diagnosis)}
              </Badge>
            </HStack>
          </VStack>
        </HStack>

        {/* Treatment Information - Left aligned to the box */}
        {participant.treatments && participant.treatments.length > 0 && (
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
              {t('treatmentInformation')}
            </Text>
            <HStack gap={2} wrap="wrap">
              {participant.treatments.map((treatment: string, index: number) => (
                <Badge key={index} bgColor="#EEF4FF" textColor="#3538CD">
                  {translateOption('treatments', treatment)}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* Experience Information */}
        {participant.experiences && participant.experiences.length > 0 && (
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
              {participant.experiences.map((experience: string, index: number) => (
                <Badge key={index} bgColor="#FDF2FA" textColor="#C11574">
                  {experience}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>

      {/* Action Button */}
      {(onViewContact || onScheduleCall) && (
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
          onClick={onViewContact || onScheduleCall}
        >
          {onViewContact ? t('viewContactDetails') : t('scheduleCall')}
        </Button>
      )}
    </Box>
  );
};

export default ProfileCard;
