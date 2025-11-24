import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import type { TimeSlot } from '@/components/dashboard/types';
import { useAvailability } from '@/hooks/useAvailability';
import type { TimeRange } from '@/types/AvailabilityTypes';

const SchedulePage: React.FC = () => {
  const router = useRouter();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const { createAvailability, loading, error } = useAvailability();

  const handleTimeSlotsChange = (timeSlots: TimeSlot[]) => {
    setSelectedTimeSlots(timeSlots);
  };

  // Convert TimeSlots to TimeRanges for API
  const convertToTimeRanges = (timeSlots: TimeSlot[]): TimeRange[] => {
    const dayToIndex: Record<string, number> = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0,
    };

    // Group slots by day
    const slotsByDay = timeSlots.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);

    const timeRanges: TimeRange[] = [];

    // For each day, sort slots and combine contiguous hours into ranges
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
          timeRanges.push({
            start_time: getNextDayOfWeek(dayToIndex[day], rangeStart),
            end_time: getNextDayOfWeek(dayToIndex[day], `${lastEndHour}:00`),
          });
          rangeStart = startTimeStr;
          lastEndHour = endHour;
        }

        // If this is the last slot, save the range
        if (index === sortedSlots.length - 1) {
          timeRanges.push({
            start_time: getNextDayOfWeek(dayToIndex[day], rangeStart!),
            end_time: getNextDayOfWeek(dayToIndex[day], `${lastEndHour}:00`),
          });
        }
      });
    });

    return timeRanges;
  };

  // Get the next occurrence of a day of the week as ISO string
  const getNextDayOfWeek = (dayOfWeek: number, timeStr: string): string => {
    const [hour] = timeStr.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();

    // Calculate days until target day
    let daysUntilTarget = dayOfWeek - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Go to next week
    }

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hour, 0, 0, 0);

    return targetDate.toISOString();
  };

  const handleSend = async () => {
    if (selectedTimeSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    const timeRanges = convertToTimeRanges(selectedTimeSlots);
    const result = await createAvailability(timeRanges);

    if (result) {
      router.push('/volunteer/edit-profile');
    } else {
      alert(error || 'Failed to save availability. Please try again.');
    }
  };

  return (
    <Box minH="100vh" bg="white" p={12}>
      {/* Centered container with 70% width */}
      <Box w="70%" mx="auto" overflowX="hidden">
        <VStack gap={0} align="stretch"  minW={0}>
          {/* Header and Text - Left Aligned */}
          <Box textAlign="left">
            <Heading
              fontSize="36px"
              fontWeight={600}
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              letterSpacing="-1.5%"
              mb="19px"
            >
              Select your availability
            </Heading>
            <VStack align="start" gap={2}>
              <Text
                color="#1D3448"
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                letterSpacing="-1.5%"
                lineHeight="100%"
              >
                Drag to select all the times you will usually be available to meet with participants. We require that availability be provided in sessions of at least 2 hours.
              </Text>
              <Text
                color="#1D3448"
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                letterSpacing="-1.5%"
                lineHeight="100%"
              >
                You will also be able to edit later in your profile.
              </Text>
            </VStack>
          </Box>

          {/* TimeScheduler - Centered */}
          <Box h="700px" w="100%" minW={0} mt="49px">
            <TimeScheduler
              showAvailability={false}
              onTimeSlotsChange={handleTimeSlotsChange}
            />
          </Box>

          {/* Confirm Button - Right Aligned */}
          <Box mt={4} display="flex" justifyContent="flex-end" w="100%" minW={0}>
            <Button
              gap={2}
              bg="#056067"
              color="#fff"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              borderRadius="md"
              px={8}
              py={2}
              _hover={{ bg: "#044d4d" }}
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
