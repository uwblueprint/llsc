import React, { useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Button, Textarea } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import type { TimeSlot } from '@/components/dashboard/types';
import { createAvailability, AvailabilityTemplate } from '@/APIClients/authAPIClient';
import { getCurrentUserId } from '@/utils/AuthUtils';
import { useTranslations } from 'next-intl';

const SchedulePage: React.FC = () => {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTimeSlotsChange = (timeSlots: TimeSlot[]) => {
    setSelectedTimeSlots(timeSlots);
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
      alert(t('selectAtLeastOneTimeSlot'));
      return;
    }

    setLoading(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        alert(t('userNotAuthenticated'));
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
        alert(t('failedToSaveAvailability'));
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert(t('failedToSaveAvailability'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="white" p={12}>
      {/* Centered container with 70% width */}
      <Box w="70%" mx="auto" overflowX="hidden">
        <VStack gap={0} align="stretch" minW={0}>
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
              {t('selectYourAvailability')}
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
                {t('dragToSelect')}
              </Text>
            </VStack>
          </Box>

          {/* TimeScheduler - Centered */}
          <Box h="700px" w="100%" minW={0} mt="49px">
            <TimeScheduler
              showAvailability={false}
              onTimeSlotsChange={handleTimeSlotsChange}
              readOnly={false}
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
              _hover={{ bg: '#044d4d' }}
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? t('saving') : t('confirmAvailability')}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default SchedulePage;
