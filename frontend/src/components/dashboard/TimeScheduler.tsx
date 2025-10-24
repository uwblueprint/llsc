import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack
} from '@chakra-ui/react';
import type { TimeSlot, TimeSchedulerProps } from './types';
import { useAvailability } from '@/hooks/useAvailability';
import type { TimeBlockEntity } from '@/types/AvailabilityTypes';

const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TimeScheduler: React.FC<TimeSchedulerProps> = ({
  showAvailability = false,
  onTimeSlotsChange,
  prepopulateFromAPI = false
}) => {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  const { getAvailability, loading } = useAvailability();

  // Convert TimeBlockEntity from API to TimeSlot format
  const convertTimeBlocksToTimeSlots = (timeBlocks: TimeBlockEntity[]): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];

    timeBlocks.forEach(block => {
      const date = new Date(block.start_time);
      const dayIndex = date.getDay();
      const hour = date.getHours();

      // Map day index to full day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = dayNames[dayIndex];

      const timeStr = `${hour}:00 - ${hour + 1}:00`;

      timeSlots.push({
        day,
        time: timeStr,
        selected: true
      });
    });

    return timeSlots;
  };

  // Load availability from API on mount if prepopulateFromAPI is true
  useEffect(() => {
    const loadAvailability = async () => {
      if (prepopulateFromAPI) {
        const availability = await getAvailability();
        if (availability && availability.available_times) {
          const timeSlots = convertTimeBlocksToTimeSlots(availability.available_times);
          setSelectedTimeSlots(timeSlots);
          if (onTimeSlotsChange) {
            onTimeSlotsChange(timeSlots);
          }
        }
      }
    };

    loadAvailability();
  }, [prepopulateFromAPI]);

  // Notify parent when selectedTimeSlots change
  useEffect(() => {
    if (onTimeSlotsChange) {
      onTimeSlotsChange(selectedTimeSlots);
    }
  }, [selectedTimeSlots, onTimeSlotsChange]);

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

  const isTimeSlotSelected = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    return selectedTimeSlots.some(
      slot => slot.day === day && slot.time === timeStr
    );
  };

  const formatTime = (hour: number) => {
    if (hour <= 11) {
      return `${hour} AM`;
    } else if (hour === 12) {
      return '12 PM';
    } else {
      return `${hour - 12} PM`;
    }
  };

  const formatTimeSlot = (timeSlot: string) => {
    // Convert "17:00 - 18:00" to "5-6 PM"
    const [startTime, endTime] = timeSlot.split(' - ');
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    const formatHour = (hour: number) => {
      if (hour === 0) return 12;
      if (hour <= 12) return hour;
      return hour - 12;
    };
    
    const getPeriod = (hour: number) => {
      return hour < 12 ? 'AM' : 'PM';
    };
    
    const startFormatted = formatHour(startHour);
    const endFormatted = formatHour(endHour);
    const startPeriod = getPeriod(startHour);
    const endPeriod = getPeriod(endHour);
    
    return `${startFormatted}${startPeriod} - ${endFormatted}${endPeriod}`;
  };

  const combineContiguousSlots = (timeSlots: string[]) => {
    if (timeSlots.length <= 1) return timeSlots;
    
    // Parse and sort time slots
    const parsedSlots = timeSlots.map(slot => {
      const [startTime, endTime] = slot.split(' - ');
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      return { start: startHour, end: endHour, original: slot };
    }).sort((a, b) => a.start - b.start);
    
    const combined = [];
    let currentSlot = parsedSlots[0];
    
    for (let i = 1; i < parsedSlots.length; i++) {
      const nextSlot = parsedSlots[i];
      
      // Check if slots are contiguous
      if (currentSlot.end === nextSlot.start) {
        // Extend the current slot
        currentSlot.end = nextSlot.end;
      } else {
        // Add current slot and start a new one
        combined.push(`${currentSlot.start}:00 - ${currentSlot.end}:00`);
        currentSlot = nextSlot;
      }
    }
    
    // Add the last slot
    combined.push(`${currentSlot.start}:00 - ${currentSlot.end}:00`);
    
    return combined;
  };

  const handleMouseDown = (day: string, hour: number) => {
    const isSelected = isTimeSlotSelected(day, hour);
    setIsDragging(true);
    setDragValue(!isSelected);
    handleTimeSlotToggle(day, hour);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (isDragging && dragValue !== null) {
      const isSelected = isTimeSlotSelected(day, hour);
      if (isSelected !== dragValue) {
        handleTimeSlotToggle(day, hour);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  // Group time slots by day for availability display
  const groupedSlots = selectedTimeSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot.time);
    return acc;
  }, {} as Record<string, string[]>);

  // Define the order of days
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Sort the grouped slots by day order
  const sortedDays = Object.keys(groupedSlots).sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });



  const renderScheduleGrid = () => (
    <Box h="100%" w="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* Header Row */}
      <Box display="flex" h="10%" maxW="100%">
        <Box
          w={["16", "20", "24"]}
          minW={["16", "20", "24"]}
          color="gray.500"
          fontWeight="normal"
          fontSize={["xs", "sm"]}
          fontFamily="'Open Sans', sans-serif"
          display="flex"
          alignItems="center"
          opacity={0.4}
        >
          EST
        </Box>
        {days.map(day => (
          <Box
            key={day}
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.600"
            fontWeight="normal"
            fontSize={["md", "lg"]}
            fontFamily="'Open Sans', sans-serif"
          >
            {day}
          </Box>
        ))}
        {showAvailability && (
          <Box w="300px" />
        )}
      </Box>

      {/* Time Grid with Availability List */}
      <Box flex="1" display="flex" flexDirection="row" maxW="100%">
        {/* Time Grid */}
        <Box flex="1" display="flex" flexDirection="column" maxW="100%">
                     {hours.map(hour => (
             <Box key={hour} display="flex" h="6.92%" maxW="100%">
              {/* Time Label */}
              <Box
                w={["16", "20", "24"]}
                minW={["16", "20", "24"]}
                color="gray.600"
                fontWeight="normal"
                fontSize={["xs", "sm"]}
                fontFamily="'Open Sans', sans-serif"
                display="flex"
                alignItems="center"
                opacity={0.4}
              >
                {formatTime(hour)}
              </Box>

              {/* Day Cells */}
              {daysFull.map((dayFull, dayIndex) => (
                <Box
                  key={`${dayFull}-${hour}`}
                  flex="1"
                  cursor="pointer"
                  bg={isTimeSlotSelected(dayFull, hour) ? "rgba(255, 187, 138, 0.2)" : "white"}
                  transition="background 0.2s"
                  borderTop="0.91px solid"
                  borderBottom="0.91px solid"
                  borderLeft={dayIndex === 0 ? "0.91px solid" : "none"}
                  borderRight="0.91px solid"
                  borderColor="#e3e3e3"
                  _hover={{
                    bg: isTimeSlotSelected(dayFull, hour) ? "rgba(255, 187, 138, 0.2)" :"rgba(255, 187, 138, 0.1)"
                  }}
                  onMouseDown={() => handleMouseDown(dayFull, hour)}
                  onMouseEnter={() => handleMouseEnter(dayFull, hour)}
                  onMouseUp={handleMouseUp}
                  userSelect="none"
                />
              ))}
            </Box>
          ))}
        </Box>
        
                 {/* Availability List - positioned alongside time grid */}
         {showAvailability && (
           <Box w="300px" pt={0} pb={4} px={4} mr={0} alignSelf="flex-start">
            <Text 
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="1.125rem"
              lineHeight="1.875rem"
              letterSpacing="0%"
              textAlign="center"
              color="#1D3448"
              mb={4}
              mt={0}
            >
              Your Availability
            </Text>
            
            <VStack gap={4} align="stretch">
                             {sortedDays.length > 0 ? (
                 sortedDays.map((day) => (
                   <Box key={day} display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                     <Text 
                       fontFamily="'Open Sans', sans-serif"
                       fontWeight={400}
                       fontSize="1rem"
                       lineHeight="100%"
                       letterSpacing="-1.5%"
                       color="#000000"
                       minW="fit-content"
                       mr={4}
                     >
                       {day}:
                     </Text>
                     <Box display="flex" flexDirection="column" gap={2} alignItems="flex-end">
                       {combineContiguousSlots(groupedSlots[day]).map((timeSlot, index) => (
                         <Box
                           key={`${day}-${index}`}
                           bg="rgba(179, 206, 209, 0.3)"
                           color="#1D3448"
                           px="10px"
                           py="2px"
                           borderRadius="16px"
                           fontSize="14px"
                           fontWeight={400}
                           lineHeight="1.2"
                           fontFamily="'Open Sans', sans-serif"
                           textAlign="center"
                           w="fit-content"
                           h="24px"
                           display="flex"
                           alignItems="center"
                           justifyContent="center"
                         >
                           <Text 
                             fontSize="14px"
                             fontWeight={400}
                             lineHeight="1.2"
                             letterSpacing="0%"
                             textAlign="center"
                             color="#056067"
                             fontFamily="'Open Sans', sans-serif"
                             whiteSpace="normal"
                             wordBreak="break-word"
                           >
                             {formatTimeSlot(timeSlot)}
                           </Text>
                         </Box>
                       ))}
                     </Box>
                   </Box>
                 ))
               ) : (
                <Box 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="md" 
                  textAlign="center"
                  border="1px dashed"
                  borderColor="gray.300"
                >
                  <Text fontSize="sm" color="gray.500">
                    No time slots selected
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Click on the calendar to add your availability
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  );



  return renderScheduleGrid();
};

export default TimeScheduler; 