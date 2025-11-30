import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Container, Flex, Heading, Text, VStack, Spinner } from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { DaySelectionCalendar } from '@/components/participant/DaySelectionCalendar';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import { RequestNewTimesSuccessModal } from '@/components/participant/RequestNewTimesSuccessModal';
import { participantMatchAPIClient } from '@/APIClients/participantMatchAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { Match } from '@/types/matchTypes';
import type { TimeSlot } from '@/components/dashboard/types';

type Step = 'select-days' | 'select-times';

export default function RequestNewTimesPage() {
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('select-days');
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const data = await participantMatchAPIClient.getMyMatches();
      const foundMatch = data.matches.find((m) => m.id === parseInt(matchId as string));

      if (!foundMatch) {
        router.push('/participant/dashboard');
        return;
      }

      setMatch(foundMatch);
    } catch (err) {
      console.error('Error loading match:', err);
      router.push('/participant/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDaysSelected = () => {
    if (selectedDays.length > 0) {
      setStep('select-times');
    }
  };

  const handleBackFromTimes = () => {
    setStep('select-days');
    setSelectedTimeSlots([]);
  };

  const handleTimesSelected = async () => {
    if (selectedTimeSlots.length > 0 && matchId) {
      await handleConfirm();
    }
  };

  const convertTimeSlotsToTimeRanges = (
    timeSlots: TimeSlot[],
  ): Array<{ startTime: string; endTime: string }> => {
    // Create a map of day names to Date objects
    const dayNameToDate: { [dayName: string]: Date } = {};
    selectedDays.forEach((day) => {
      const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
      dayNameToDate[dayName] = day;
    });

    // Group time slots by day
    const slotsByDay: { [day: string]: TimeSlot[] } = {};
    timeSlots.forEach((slot) => {
      if (!slotsByDay[slot.day]) {
        slotsByDay[slot.day] = [];
      }
      slotsByDay[slot.day].push(slot);
    });

    const timeRanges: Array<{ startTime: string; endTime: string }> = [];

    // For each selected day, find the corresponding time slots
    Object.keys(dayNameToDate).forEach((dayName) => {
      const day = dayNameToDate[dayName];
      const daySlots = slotsByDay[dayName] || [];

      if (daySlots.length === 0) return;

      // Sort slots by time
      daySlots.sort((a, b) => {
        const aHour = parseInt(a.time.split(':')[0]);
        const bHour = parseInt(b.time.split(':')[0]);
        return aHour - bHour;
      });

      // Combine contiguous time slots into ranges
      let currentRange: { start: number; end: number } | null = null;

      daySlots.forEach((slot) => {
        const [startStr] = slot.time.split(' - ');
        const hour = parseInt(startStr.split(':')[0]);
        const endHour = hour + 1;

        if (!currentRange) {
          currentRange = { start: hour, end: endHour };
        } else if (hour === currentRange.end) {
          // Contiguous - extend range
          currentRange.end = endHour;
        } else {
          // Not contiguous - save current range and start new one
          const rangeToSave = currentRange;
          const startDate = new Date(day);
          startDate.setHours(rangeToSave.start, 0, 0, 0);
          startDate.setMinutes(0, 0, 0);
          const endDate = new Date(day);
          endDate.setHours(rangeToSave.end, 0, 0, 0);
          endDate.setMinutes(0, 0, 0);

          timeRanges.push({
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          });

          currentRange = { start: hour, end: endHour };
        }
      });

      // Save the last range
      if (currentRange) {
        const finalRange = currentRange as { start: number; end: number };
        const startDate = new Date(day);
        startDate.setHours(finalRange.start, 0, 0, 0);
        startDate.setMinutes(0, 0, 0);
        const endDate = new Date(day);
        endDate.setHours(finalRange.end, 0, 0, 0);
        endDate.setMinutes(0, 0, 0);

        timeRanges.push({
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        });
      }
    });

    return timeRanges;
  };

  const handleConfirm = async () => {
    if (!matchId || selectedTimeSlots.length === 0) return;

    try {
      setIsSubmitting(true);
      const timeRanges = convertTimeSlotsToTimeRanges(selectedTimeSlots);
      await participantMatchAPIClient.requestNewTimes(parseInt(matchId as string), timeRanges);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error('Error requesting new times:', err);
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    router.push('/participant/dashboard');
  };

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
        <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
          <Box minH="100vh" bg="white" py={10}>
            <Container maxW="container.xl">
              <Flex justify="center" align="center" minH="50vh">
                <Spinner size="xl" color="#056067" />
              </Flex>
            </Container>
          </Box>
        </FormStatusGuard>
      </ProtectedPage>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" bg="white" py={10}>
          <Container maxW="container.xl">
            <VStack align="stretch" gap={8}>
              {/* Back button */}
              <Flex
                align="center"
                gap={2}
                cursor="pointer"
                onClick={() => {
                  if (step === 'select-times') {
                    // Go back to date selection step
                    setStep('select-days');
                    setSelectedTimeSlots([]);
                  } else {
                    // Go back to previous page
                    router.back();
                  }
                }}
                alignSelf="flex-start"
                color="#1D3448"
                fontSize="16px"
                fontWeight={600}
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.25em"
              >
                <FiChevronLeft size={20} />
                <Text>Back</Text>
              </Flex>

              {/* Header */}
              <VStack align="stretch" gap={4}>
                <Heading
                  fontSize="36px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.36181640625em"
                  letterSpacing="-1.5%"
                >
                  Request a new time
                </Heading>
                <Text
                  fontSize="18px"
                  fontWeight={400}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  lineHeight="1.36181640625em"
                  letterSpacing="-1.5%"
                  opacity={0.85}
                >
                  If the volunteer&apos;s available times don&apos;t work, you&apos;re able to send
                  a request with your available times.
                </Text>
              </VStack>

              {/* Step 1: Select Days */}
              {step === 'select-days' && (
                <VStack align="stretch" gap={8}>
                  <DaySelectionCalendar
                    selectedDays={selectedDays}
                    onDaysChange={setSelectedDays}
                    maxDays={7}
                  />
                  <Flex justify="flex-end">
                    <Button
                      bg="#056067"
                      color="white"
                      fontWeight={600}
                      fontSize="20px"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="1em"
                      px={10.5}
                      py={4.5}
                      borderRadius="8px"
                      onClick={handleDaysSelected}
                      disabled={selectedDays.length === 0}
                      _hover={{
                        bg: '#044d52',
                      }}
                      _active={{
                        bg: '#033a3e',
                      }}
                    >
                      Select these days
                    </Button>
                  </Flex>
                </VStack>
              )}

              {/* Step 2: Select Times */}
              {step === 'select-times' && (
                <VStack align="stretch" gap={8}>
                  {/* Time Scheduler - Show only selected days */}
                  <Box h="900px" w="100%">
                    <TimeScheduler
                      onTimeSlotsChange={setSelectedTimeSlots}
                      initialTimeSlots={selectedTimeSlots}
                      readOnly={false}
                      visibleDays={selectedDays.map((day) =>
                        day.toLocaleDateString('en-US', { weekday: 'long' }),
                      )}
                      selectedDaysDates={selectedDays}
                    />
                  </Box>

                  <Flex justify="flex-end" gap={3}>
                    <Button
                      bg="rgba(179, 206, 209, 0.3)"
                      color="#495D6C"
                      fontWeight={600}
                      fontSize="16px"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="1.5em"
                      px={4.5}
                      py={2.5}
                      borderRadius="8px"
                      onClick={handleBackFromTimes}
                      _hover={{
                        bg: 'rgba(179, 206, 209, 0.4)',
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      bg="#056067"
                      color="white"
                      fontWeight={600}
                      fontSize="20px"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="1em"
                      px={10.5}
                      py={4.5}
                      borderRadius="8px"
                      onClick={handleTimesSelected}
                      disabled={selectedTimeSlots.length === 0 || isSubmitting}
                      loading={isSubmitting}
                      loadingText="Sending..."
                      _hover={{
                        bg: '#044d52',
                      }}
                      _active={{
                        bg: '#033a3e',
                      }}
                    >
                      Confirm availability
                    </Button>
                  </Flex>
                </VStack>
              )}
            </VStack>
          </Container>
        </Box>

        {/* Success Modal */}
        <RequestNewTimesSuccessModal isOpen={isSuccessModalOpen} onClose={handleSuccessClose} />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
