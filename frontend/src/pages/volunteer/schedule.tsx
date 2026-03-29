import React, { useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import type { TimeSlot } from '@/components/dashboard/types';
import { createAvailability, AvailabilityTemplate } from '@/APIClients/authAPIClient';
import { getCurrentUserId } from '@/utils/AuthUtils';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const SchedulePage: React.FC = () => {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>('Sunday');

  const handleTimeSlotsChange = (timeSlots: TimeSlot[]) => {
    setSelectedTimeSlots(timeSlots);
  };

  // Mobile day abbreviations for availability selector
  const mobileDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayFullNames: Record<string, string> = {
    SUN: 'Sunday',
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
  };
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const formatMobileTime = (hour: number) => {
    if (hour <= 11) {
      return `${hour} AM`;
    } else if (hour === 12) {
      return '12 PM';
    } else {
      return `${hour - 12} PM`;
    }
  };

  const isTimeSlotSelectedForDay = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    return selectedTimeSlots.some((slot) => slot.day === day && slot.time === timeStr);
  };

  const handleMobileTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    const existingSlotIndex = selectedTimeSlots.findIndex(
      (slot) => slot.day === day && slot.time === timeStr,
    );

    let newSlots: TimeSlot[];
    if (existingSlotIndex >= 0) {
      newSlots = selectedTimeSlots.filter((_, index) => index !== existingSlotIndex);
    } else {
      newSlots = [...selectedTimeSlots, { day, time: timeStr, selected: true }];
    }

    setSelectedTimeSlots(newSlots);
  };

  // Convert TimeSlots to AvailabilityTemplates for API (same logic as admin profile)
  const convertToTemplates = (timeSlots: TimeSlot[]): AvailabilityTemplate[] => {
    const dayToIndex: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    // Group slots by day
    const slotsByDay = timeSlots.reduce(
      (acc, slot) => {
        if (!acc[slot.day]) {
          acc[slot.day] = [];
        }
        acc[slot.day].push(slot);
        return acc;
      },
      {} as Record<string, TimeSlot[]>,
    );

    const templates: AvailabilityTemplate[] = [];

    // For each day, sort slots and combine contiguous hours into templates
    Object.entries(slotsByDay).forEach(([day, slots]) => {
      // Sort slots by start hour
      const sortedSlots = slots.sort((a, b) => {
        const aHour = parseInt(a.time.split(':')[0]);
        const bHour = parseInt(b.time.split(':')[0]);
        return aHour - bHour;
      });

      let rangeStart: string | null = null;
      let lastEndHour = -1;

      sortedSlots.forEach((slot, index) => {
        const [startTimeStr, endTimeStr] = slot.time.split(' - ');
        const startHour = parseInt(startTimeStr.split(':')[0]);
        const endHour = parseInt(endTimeStr.split(':')[0]);

        if (rangeStart === null) {
          // Start a new range
          rangeStart = startTimeStr;
          lastEndHour = endHour;
        } else if (startHour === lastEndHour) {
          // Contiguous slot, extend the range
          lastEndHour = endHour;
        } else {
          // Non-contiguous, save current range and start new one
          templates.push({
            dayOfWeek: dayToIndex[day],
            startTime: `${rangeStart}:00`,
            endTime: `${lastEndHour}:00:00`,
          });
          rangeStart = startTimeStr;
          lastEndHour = endHour;
        }

        // If this is the last slot, save the range
        if (index === sortedSlots.length - 1) {
          templates.push({
            dayOfWeek: dayToIndex[day],
            startTime: `${rangeStart}:00`,
            endTime: `${lastEndHour}:00:00`,
          });
        }
      });
    });

    return templates;
  };

  const handleSend = async () => {
    if (selectedTimeSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    setLoading(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        alert('User not authenticated. Please log in again.');
        return;
      }

      const templates = convertToTemplates(selectedTimeSlots);
      const result = await createAvailability({
        userId,
        templates,
      });

      if (result) {
        router.push('/volunteer/edit-profile');
      } else {
        alert('Failed to save availability. Please try again.');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMobileAvailability = () => (
    <VStack align="stretch" gap={4}>
      {/* Day selector pills */}
      <HStack gap={2} overflowX="auto" pb={2}>
        {mobileDays.map((day) => (
          <Box
            key={day}
            px={3}
            py={2}
            borderRadius="full"
            bg={selectedMobileDay === dayFullNames[day] ? '#1D3448' : 'white'}
            color={selectedMobileDay === dayFullNames[day] ? 'white' : '#1D3448'}
            border="1px solid"
            borderColor={selectedMobileDay === dayFullNames[day] ? '#1D3448' : '#E5E7EB'}
            cursor="pointer"
            onClick={() => setSelectedMobileDay(dayFullNames[day])}
            fontFamily="'Open Sans', sans-serif"
            fontSize="14px"
            fontWeight={500}
            flexShrink={0}
          >
            {day}
          </Box>
        ))}
      </HStack>

      {/* Vertical time slots list */}
      <VStack align="stretch" gap={0}>
        {hours.map((hour) => {
          const isSelected = isTimeSlotSelectedForDay(selectedMobileDay, hour);
          return (
            <Box
              key={hour}
              py={3}
              px={4}
              borderBottom="1px solid"
              borderColor="#E5E7EB"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              cursor="pointer"
              onClick={() => handleMobileTimeSlotToggle(selectedMobileDay, hour)}
              bg={isSelected ? 'rgba(255, 187, 138, 0.2)' : 'white'}
            >
              <Text
                fontSize="14px"
                fontWeight={400}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
              >
                {formatMobileTime(hour)}
              </Text>
              {isSelected && (
                <Box
                  bg="rgba(255, 187, 138, 0.5)"
                  color="#1D3448"
                  px={3}
                  py={1}
                  borderRadius="4px"
                  fontSize="12px"
                  fontWeight={500}
                  fontFamily="'Open Sans', sans-serif"
                >
                  {formatMobileTime(hour)} - {formatMobileTime(hour + 1)}
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );

  return (
    <Box minH="100vh" bg="white" p={{ base: 4, lg: 12 }}>
      {/* Centered container */}
      <Box w={{ base: '100%', lg: '70%' }} mx="auto" overflowX="hidden">
        <VStack gap={0} align="stretch" minW={0}>
          {/* Header and Text - Left Aligned */}
          <Box textAlign="left">
            <Heading
              fontSize={{ base: '24px', lg: '36px' }}
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              letterSpacing="-0.015em"
              mb="19px"
            >
              Select your availability
            </Heading>
            <VStack align="start" gap={2}>
              <Text
                color="#1D3448"
                fontSize={{ base: '14px', lg: '16px' }}
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                letterSpacing="-0.015em"
                lineHeight="140%"
              >
                Tap to select all the times you will usually be available to meet with participants.
                We require that availability be provided in sessions of at least 2 hours.
              </Text>
              <Text
                color="#1D3448"
                fontSize={{ base: '14px', lg: '16px' }}
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                letterSpacing="-0.015em"
                lineHeight="140%"
              >
                You will also be able to edit later in your profile.
              </Text>
            </VStack>
          </Box>

          {/* TimeScheduler / Mobile Availability */}
          {isDesktop ? (
            <Box h="700px" w="100%" minW={0} mt="49px">
              <TimeScheduler
                showAvailability={false}
                onTimeSlotsChange={handleTimeSlotsChange}
                readOnly={false}
              />
            </Box>
          ) : (
            <Box mt={6}>{renderMobileAvailability()}</Box>
          )}

          {/* Confirm Button */}
          <Box
            mt={4}
            display="flex"
            justifyContent={{ base: 'stretch', lg: 'flex-end' }}
            w="100%"
            minW={0}
          >
            <Button
              w={{ base: '100%', lg: 'auto' }}
              gap={2}
              bg="#056067"
              color="#fff"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              borderRadius="md"
              px={8}
              py={{ base: 6, lg: 2 }}
              fontSize={{ base: '16px', lg: '14px' }}
              _hover={{ bg: '#044d4d' }}
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Confirm Availability'}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default SchedulePage;
