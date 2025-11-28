import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, HStack, Textarea, Image } from '@chakra-ui/react';
import TimeScheduler from './TimeScheduler';
import type { TimeSlot } from './types';
import {
  getUserData,
  updateMyAvailability,
  AvailabilityTemplateResponse,
} from '@/APIClients/userDataAPIClient';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  onSend: (timeSlots: TimeSlot[], additionalInfo: string) => void;
}

const ScheduleCallModal: React.FC<ScheduleCallModalProps> = ({
  isOpen,
  onClose,
  participantName,
  onSend,
}) => {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [availabilityTimeSlots, setAvailabilityTimeSlots] = useState<TimeSlot[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Helper function to convert AvailabilityTemplates to TimeSlots
  const convertTemplatesToTimeSlots = (templates: AvailabilityTemplateResponse[]): TimeSlot[] => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots: TimeSlot[] = [];

    templates.forEach((template) => {
      const dayName = dayNames[template.dayOfWeek];
      const parseTime = (timeStr: string): { hour: number; minute: number } => {
        const parts = timeStr.split(':');
        return {
          hour: parseInt(parts[0], 10),
          minute: parseInt(parts[1], 10),
        };
      };

      const startTime = parseTime(template.startTime);
      const endTime = parseTime(template.endTime);

      for (let hour = startTime.hour; hour < endTime.hour; hour++) {
        timeSlots.push({
          day: dayName,
          time: `${hour}:00 - ${hour + 1}:00`,
          selected: true,
        });
      }
    });

    return timeSlots;
  };

  // Load availability when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingAvailability(true);
      const loadAvailability = async () => {
        try {
          const userData = await getUserData();
          if (userData?.availability && userData.availability.length > 0) {
            const timeSlots = convertTemplatesToTimeSlots(userData.availability);
            setAvailabilityTimeSlots(timeSlots);
          }
        } catch (error) {
          console.error('Error loading availability:', error);
        } finally {
          setLoadingAvailability(false);
        }
      };
      loadAvailability();
    }
  }, [isOpen]);

  const handleAvailabilityChange = (timeSlots: TimeSlot[]) => {
    setAvailabilityTimeSlots(timeSlots);
  };

  const handleSend = () => {
    onSend(selectedTimeSlots, additionalInfo);
    setSelectedTimeSlots([]);
    setAdditionalInfo('');
  };

  const handleEditAvailability = () => {
    setIsEditingAvailability(true);
  };

  const handleCancelEdit = () => {
    setIsEditingAvailability(false);
    // Reload availability from backend
    const loadAvailability = async () => {
      try {
        const userData = await getUserData();
        if (userData?.availability && userData.availability.length > 0) {
          const timeSlots = convertTemplatesToTimeSlots(userData.availability);
          setAvailabilityTimeSlots(timeSlots);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    };
    loadAvailability();
  };

  const handleSaveAvailability = async () => {
    const convertToTemplates = (timeSlots: TimeSlot[]): AvailabilityTemplateResponse[] => {
      const dayToIndex: Record<string, number> = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

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

      const templates: AvailabilityTemplateResponse[] = [];

      Object.entries(slotsByDay).forEach(([day, slots]) => {
        const sortedSlots = slots.sort((a, b) => {
          const aHour = parseInt(a.time.split(':')[0]);
          const bHour = parseInt(b.time.split(':')[0]);
          return aHour - bHour;
        });

        let rangeStart: number | null = null;
        let lastEndHour = -1;

        sortedSlots.forEach((slot, index) => {
          const [startTimeStr, endTimeStr] = slot.time.split(' - ');
          const startHour = parseInt(startTimeStr.split(':')[0]);
          const endHour = parseInt(endTimeStr.split(':')[0]);

          if (rangeStart === null) {
            rangeStart = startHour;
            lastEndHour = endHour;
          } else if (startHour === lastEndHour) {
            lastEndHour = endHour;
          } else {
            templates.push({
              dayOfWeek: dayToIndex[day],
              startTime: `${rangeStart.toString().padStart(2, '0')}:00:00`,
              endTime: `${lastEndHour.toString().padStart(2, '0')}:00:00`,
            });
            rangeStart = startHour;
            lastEndHour = endHour;
          }

          if (index === sortedSlots.length - 1) {
            templates.push({
              dayOfWeek: dayToIndex[day],
              startTime: `${rangeStart!.toString().padStart(2, '0')}:00:00`,
              endTime: `${lastEndHour.toString().padStart(2, '0')}:00:00`,
            });
          }
        });
      });

      return templates;
    };

    setSavingAvailability(true);

    try {
      const templates = convertToTemplates(availabilityTimeSlots);
      const success = await updateMyAvailability(templates);

      if (success) {
        setIsEditingAvailability(false);
        // Reload availability
        const userData = await getUserData();
        if (userData?.availability) {
          const timeSlots = convertTemplatesToTimeSlots(userData.availability);
          setAvailabilityTimeSlots(timeSlots);
        }
      } else {
        alert('Failed to save availability. Please try again.');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSavingAvailability(false);
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="white"
      zIndex={9999}
      overflowY="auto"
    >
      <Box minH="100vh" bg="white" p={12}>
        <Box w="70%" mx="auto" overflowX="hidden">
          <HStack gap={2} mb={4} cursor="pointer" onClick={onClose}>
            <Image src="/icons/chevron-left.png" alt="Back" w="20px" h="20px" />
            <Text
              fontSize="16px"
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
            >
              Back
            </Text>
          </HStack>

          <Heading
            fontSize="36px"
            fontWeight={600}
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            letterSpacing="-1.5%"
            mb="8px"
          >
            Schedule call with your availability
          </Heading>

          {loadingAvailability ? (
            <Box
              h="700px"
              w="100%"
              minW={0}
              mt="49px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="16px" color="#6B7280" fontFamily="'Open Sans', sans-serif">
                Loading availability...
              </Text>
            </Box>
          ) : !isEditingAvailability ? (
            <>
              <Text
                color="#6B7280"
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                mb={6}
              >
                Please review your general availability before sending.
              </Text>

              <Box h="700px" w="100%" minW={0} mt="49px">
                <TimeScheduler
                  showAvailability={true}
                  onTimeSlotsChange={handleAvailabilityChange}
                  initialTimeSlots={availabilityTimeSlots}
                  readOnly={true}
                />
              </Box>

              <Textarea
                placeholder="Additional information (optional)"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                mt={4}
                mb={4}
                minH="100px"
                fontFamily="'Open Sans', sans-serif"
                border="1.01px solid"
                borderColor="#D9D9D9"
                borderRadius="9.11px"
                p={4}
                _focus={{
                  borderColor: '#D9D9D9',
                  boxShadow: 'none',
                }}
                _hover={{
                  borderColor: '#D9D9D9',
                }}
              />

              <HStack justify="flex-end" w="100%" gap="16px">
                <Button
                  onClick={handleEditAvailability}
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  fontSize="16px"
                  borderRadius="8px"
                  px={6}
                  py={2}
                  h="44px"
                  border="1px solid"
                  borderColor="#D5D7DA"
                  color="#495D6C"
                  bg="#B3CED1"
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: '#A0BFC2' }}
                >
                  Edit General Availability
                </Button>
                <Button
                  bg="#056067"
                  color="#fff"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  fontSize="16px"
                  borderRadius="8px"
                  px={8}
                  py={2}
                  h="44px"
                  _hover={{ bg: '#044d4d' }}
                  onClick={handleSend}
                >
                  Send
                </Button>
              </HStack>
            </>
          ) : (
            <>
              <Text
                color="#1D3448"
                fontSize="16px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                letterSpacing="-1.5%"
                lineHeight="100%"
                mb={6}
              >
                Drag to select all the times you will usually be available to meet with
                participants.
              </Text>

              <Box h="700px" w="100%" minW={0} mt="49px">
                <TimeScheduler
                  showAvailability={true}
                  onTimeSlotsChange={handleAvailabilityChange}
                  initialTimeSlots={availabilityTimeSlots}
                  readOnly={false}
                />
              </Box>

              <HStack justify="flex-end" w="100%" gap="16px" mt={4}>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  borderRadius="8px"
                  px={8}
                  py={2}
                  h="44px"
                >
                  Cancel
                </Button>
                <Button
                  bg="#056067"
                  color="#fff"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  borderRadius="8px"
                  px={8}
                  py={2}
                  h="44px"
                  _hover={{ bg: '#044d4d' }}
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                >
                  {savingAvailability ? 'Saving...' : 'Save Changes'}
                </Button>
              </HStack>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ScheduleCallModal;
