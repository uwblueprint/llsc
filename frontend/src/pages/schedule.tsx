import React, { useState } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Button, Textarea } from '@chakra-ui/react';
import { BiArrowBack } from 'react-icons/bi';
import { TimeScheduler, AvailabilitySidebar } from '../components/TimeScheduler';
import type { TimeSlot } from '../components/TimeScheduler';

const SchedulePage: React.FC = () => {
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
      // Remove the slot
      setSelectedTimeSlots(prev => prev.filter((_, index) => index !== existingSlotIndex));
    } else {
      // Add the slot
      setSelectedTimeSlots(prev => [...prev, { day, time: timeStr, selected: true }]);
    }
  };

  const handleChooseNewTimes = () => {
    setSelectedTimeSlots([]);
  };

  const handleSend = () => {
    console.log('Selected time slots:', selectedTimeSlots);
    console.log('Additional info:', additionalInfo);
    // Handle form submission here
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="7xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack gap={4} align="center">
            <BiArrowBack size={20} />
            <Text fontSize="sm" color="gray.600" cursor="pointer">
              Back
            </Text>
          </HStack>

          {/* Title */}
          <Box textAlign="center">
            <Heading size="lg" mb={2}>
              Volunteer Dashboard - Participants Matched
            </Heading>
          </Box>

          {/* Main Content */}
          <Box bg="white" borderRadius="lg" p={8} shadow="sm">
            <VStack gap={8} align="stretch">
              {/* Schedule Section Header */}
              <Box>
                <Heading size="md" mb={2}>
                  Schedule call with your availability
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis posuere quam at lorem facilibus.
                </Text>
              </Box>

              {/* Main Grid Layout */}
              <HStack gap={8} align="start">
                {/* Time Grid */}
                <Box flex="2">
                  <Text fontWeight="medium" mb={4}>
                    Your availability:
                  </Text>
                  <TimeScheduler
                    selectedTimeSlots={selectedTimeSlots}
                    onTimeSlotToggle={handleTimeSlotToggle}
                  />
                </Box>

                {/* Sidebar */}
                <Box flex="1">
                  <AvailabilitySidebar selectedTimeSlots={selectedTimeSlots} />
                </Box>
              </HStack>

              {/* Additional Information */}
              <Box>
                <Text fontWeight="medium" mb={3} color="gray.700">
                  Additional information (optional)
                </Text>
                <Textarea
                  placeholder="Enter any additional information..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                  }}
                />
              </Box>

              {/* Action Buttons */}
              <HStack justify="flex-end" gap={4}>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={handleChooseNewTimes}
                >
                  Choose new times
                </Button>
                <Button
                  colorScheme="teal"
                  onClick={handleSend}
                >
                  Send
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default SchedulePage; 