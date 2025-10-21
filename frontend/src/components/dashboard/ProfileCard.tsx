import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import Badge from './badge';
import { COLORS } from '@/constants/form';

interface ProfileCardProps {
  participant: {
    id: number;
    name: string;
    pronouns: string;
    age: number;
    timezone: string;
    diagnosis: string;
    treatments: string[];
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
  onViewContact
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (showTimes && time) {
    return (
      <HStack gap="24px" align="start" w="100%">
        {/* Time with vertical line */}
        <HStack gap="24px" align="start">
          <Text 
            fontSize="1rem"
            fontWeight={400}
            color="#6B7280"
            fontFamily="'Open Sans', sans-serif"
            whiteSpace="nowrap"
          >
            {formatTime(time)}
          </Text>
          <Box 
            w="4px" 
            h="314px" 
            bg="#5F989D" 
            borderRadius="11px"
          />
        </HStack>

        {/* Card */}
        <ProfileCardContent 
          participant={participant}
          onScheduleCall={onScheduleCall}
          onViewContact={onViewContact}
        />
      </HStack>
    );
  }

  return (
    <ProfileCardContent 
      participant={participant}
      onScheduleCall={onScheduleCall}
      onViewContact={onViewContact}
    />
  );
};

const ProfileCardContent: React.FC<{
  participant: ProfileCardProps['participant'];
  onScheduleCall?: () => void;
  onViewContact?: () => void;
}> = ({ participant, onScheduleCall, onViewContact }) => {
  return (
    <Box 
      w="675px"
      h="314px"
      border="1px solid #D5D7DA"
      borderRadius="8px"
      bg="white"
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      py="24px"
      px="28px"
      position="relative"
    >
      <VStack align="start" gap={0}>
        <HStack gap="32px" align="start">
          {/* Avatar */}
          <Avatar
            name={participant.name}
            size="xl"
            bg="#F4F4F4"
            color="#000000"
            fontSize="36.52px"
          />

          {/* Participant Info */}
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
                {participant.name}
              </Text>
              <Text 
                fontSize="1rem"
                fontWeight={400}
                color="#495D6C"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="100%"
                letterSpacing="0%"
                mr="16px"
              >
                {participant.pronouns}
              </Text>
            </HStack>

            <HStack gap={2} align="center" wrap="wrap" mt="16px">
              <Badge iconSrc="/icons/user-secondary.png">
                Current Age: {participant.age}
              </Badge>
              <Badge iconSrc="/icons/clock-secondary.png">
                Timezone: {participant.timezone}
              </Badge>
              <Badge iconSrc="/icons/activity-secondary.png">
                {participant.diagnosis}
              </Badge>
            </HStack>
          </VStack>
        </HStack>

        {/* Treatment Information - Left aligned to the box */}
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
            Treatment Information
          </Text>
          <HStack gap={4} wrap="wrap">
            {participant.treatments.map((treatment: string, index: number) => (
              <Text 
                key={index}
                fontSize="1rem"
                fontWeight={400}
                color="#495D6C"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="100%"
                letterSpacing="0%"
              >
                • {treatment}
              </Text>
            ))}
          </HStack>
        </Box>
      </VStack>

      {/* Action Button - Positioned at bottom */}
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
          bg: "#056067"
        }}
        _active={{
          bg: "#044953"
        }}
        onClick={onViewContact || onScheduleCall}
      >
        {onViewContact ? 'View Contact Details' : 'Schedule Call'}
      </Button>
    </Box>
  );
};

export default ProfileCard; 