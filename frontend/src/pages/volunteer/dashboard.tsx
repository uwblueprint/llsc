import React, { useState, useEffect } from 'react';
import { TimeScheduler } from '../../components/TimeScheduler';
import type { TimeSlot } from '../../components/TimeScheduler/types';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
} from '@chakra-ui/react';

const VolunteerDashboard: React.FC = () => {
  // Placeholder: Replace with real logic (API/localStorage) for first-time check
  const [showSchedule, setShowSchedule] = useState(true);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([
    // Example: Some pre-selected slots
    { day: 'Monday', time: '13:00 - 14:00', selected: true },
    { day: 'Tuesday', time: '13:00 - 14:00', selected: true },
    { day: 'Wednesday', time: '13:00 - 14:00', selected: true },
    { day: 'Thursday', time: '13:00 - 14:00', selected: true },
    { day: 'Friday', time: '13:00 - 14:00', selected: true },
  ]);

  useEffect(() => {
    // Example: Check localStorage for a flag
    const hasSetAvailability = localStorage.getItem('hasSetAvailability');
    if (hasSetAvailability === 'true') {
      setShowSchedule(false);
    }
  }, []);

  const handleTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    
    setSelectedTimeSlots(prev => {
      const existingSlotIndex = prev.findIndex(
        slot => slot.day === day && slot.time === timeStr
      );

      if (existingSlotIndex >= 0) {
        // Remove the time slot if it exists
        return prev.filter((_, index) => index !== existingSlotIndex);
      } else {
        // Add the time slot if it doesn't exist
        return [...prev, { day, time: timeStr, selected: true }];
      }
    });
  };

  const handleConfirmAvailability = () => {
    // Save the availability data (you can add API call here)
    console.log('Confirmed availability:', selectedTimeSlots);
    
    // Set flag so schedule doesn't show again
    localStorage.setItem('hasSetAvailability', 'true');
    setShowSchedule(false);
  };

  if (showSchedule) {
    return (
      <TimeScheduler
        selectedTimeSlots={selectedTimeSlots}
        onTimeSlotToggle={handleTimeSlotToggle}
        onConfirm={handleConfirmAvailability}
      />
    );
  }

  return (
    <Box minH="100vh" bg="background">
      <Container maxW="6xl" py={12}>
        <Stack gap={8} align="stretch">
          <Heading size="lg" color="veniceBlue" fontFamily="heading" fontWeight={600}>
            Welcome to the Volunteer Dashboard!
          </Heading>
          <Text fontSize="lg" color="fieldGray" fontFamily="body">
            This is your dashboard. You have already set your availability.
          </Text>
          {/* Add more dashboard widgets/components here as needed */}
        </Stack>
      </Container>
    </Box>
  );
};

export default VolunteerDashboard; 