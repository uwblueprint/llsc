import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
} from '@chakra-ui/react';
import { BiArrowBack } from 'react-icons/bi';
import TimeScheduler from './TimeScheduler';
import ProfileHeader from '../profile/ProfileHeader';
import type { TimeSlot } from './types';

interface ScheduleProps {
  onConfirm: () => void;
}

const Schedule: React.FC<ScheduleProps> = ({ onConfirm }) => {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([
    { day: 'Tuesday', time: '10:00 - 11:00', selected: true },
    { day: 'Tuesday', time: '11:00 - 12:00', selected: true },
    { day: 'Wednesday', time: '10:00 - 11:00', selected: true },
    { day: 'Thursday', time: '10:00 - 11:00', selected: true },
    { day: 'Thursday', time: '11:00 - 12:00', selected: true },
    { day: 'Friday', time: '10:00 - 11:00', selected: true },
  ]);

  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    const existingSlotIndex = selectedTimeSlots.findIndex(
      slot => slot.day === day && slot.time === timeStr
    );

    if (existingSlotIndex >= 0) {
      setSelectedTimeSlots(prev => prev.filter((_, index) => index !== existingSlotIndex));
    } else {
      setSelectedTimeSlots(prev => [...prev, { day, time: timeStr, selected: true }]);
    }
  };

  const handleChooseNewTimes = () => {
    setSelectedTimeSlots([]);
  };

  const handleSend = () => {
    // You can add your submission logic here
    onConfirm();
  };

  return (
    <Box minH="100vh" bg="background">
      <Container maxW="7xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack gap={4} align="center">
            <BiArrowBack size={20} color="var(--chakra-colors-veniceBlue)" />
            <Text fontSize="sm" color="fieldGray" cursor="pointer" fontFamily="body">
              Back
            </Text>
          </HStack>

          {/* Title */}
          <Box textAlign="center">
            <Heading size="lg" mb={2} color="veniceBlue" fontFamily="heading" fontWeight={600}>
              Volunteer Dashboard - Participants Matched
            </Heading>
          </Box>

          {/* Main Content */}
          <Box bg="white" borderRadius="lg" p={8} boxShadow="sm">
            <VStack gap={8} align="stretch">
              {/* Schedule Section Header */}
              <Box>
                <ProfileHeader>Select your availability</ProfileHeader>
                <Text
                  color="#414651"
                  fontSize="md"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  mb={8}
                >
                  Drag to select all the times you will usually be available to meet with participants. You will also be able to edit later in your profile.
                </Text>
              </Box>

              {/* Main Grid Layout */}
              <TimeScheduler
                selectedTimeSlots={selectedTimeSlots}
                onTimeSlotToggle={handleTimeSlotToggle}
                showAvailability={true}
              />

              {/* Additional Information */}
              <Box>
                <Text fontWeight="medium" mb={3} color="veniceBlue" fontFamily="body">
                  Additional information (optional)
                </Text>
                <Textarea
                  placeholder="Enter any additional information..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  bg="background"
                  border="1px solid"
                  borderColor="border"
                  fontFamily="body"
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                  }}
                />
              </Box>

              {/* Action Buttons */}
              <HStack justify="flex-end" gap={4}>
                <Button
                  variant="outline"
                  colorScheme="brand"
                  fontFamily="body"
                  onClick={handleChooseNewTimes}
                >
                  Choose new times
                </Button>
                <Button
                  bg="#056067"
                  color="#fff"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  borderRadius="md"
                  px={8}
                  py={2}
                  _hover={{ bg: "#044d4d" }}
                  onClick={handleSend}
                >
                  Confirm Availability
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Schedule; 