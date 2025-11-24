import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack
} from '@chakra-ui/react';
import type { TimeSlot, TimeSchedulerProps } from './types';

const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TimeScheduler: React.FC<TimeSchedulerProps> = ({
  showAvailability = false,
  onTimeSlotsChange,
  initialTimeSlots = [],
  readOnly = false
}) => {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>(initialTimeSlots);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);

  // Update selectedTimeSlots when initialTimeSlots prop changes
  // This makes the component fully controlled by the parent
  useEffect(() => {
    setSelectedTimeSlots(initialTimeSlots);
  }, [initialTimeSlots]);

  const handleTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    const existingSlotIndex = selectedTimeSlots.findIndex(
      slot => slot.day === day && slot.time === timeStr
    );

    let newSlots: TimeSlot[];
    if (existingSlotIndex >= 0) {
      newSlots = selectedTimeSlots.filter((_, index) => index !== existingSlotIndex);
    } else {
      newSlots = [...selectedTimeSlots, { day, time: timeStr, selected: true }];
    }

    setSelectedTimeSlots(newSlots);

    // Notify parent of the change
    if (onTimeSlotsChange) {
      onTimeSlotsChange(newSlots);
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
          <Box w="220px" />
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
                  cursor={readOnly ? "default" : "pointer"}
                  bg={isTimeSlotSelected(dayFull, hour) ? "rgba(255, 187, 138, 0.2)" : "white"}
                  transition="background 0.2s"
                  borderTop="0.91px solid"
                  borderBottom="0.91px solid"
                  borderLeft={dayIndex === 0 ? "0.91px solid" : "none"}
                  borderRight="0.91px solid"
                  borderColor="#e3e3e3"
                  _hover={readOnly ? {} : {
                    bg: isTimeSlotSelected(dayFull, hour) ? "rgba(255, 187, 138, 0.2)" :"rgba(255, 187, 138, 0.1)"
                  }}
                  onMouseDown={readOnly ? undefined : () => handleMouseDown(dayFull, hour)}
                  onMouseEnter={readOnly ? undefined : () => handleMouseEnter(dayFull, hour)}
                  onMouseUp={readOnly ? undefined : handleMouseUp}
                  userSelect="none"
                  opacity={readOnly ? 0.7 : 1}
                />
              ))}
            </Box>
          ))}
        </Box>
        
                 {/* Availability List - positioned alongside time grid */}
         {showAvailability && (
           <Box w="220px" pt={0} pb={4} px={3} ml={6} mr={0} alignSelf="flex-start">
            <Text
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="1rem"
              lineHeight="1.5rem"
              letterSpacing="0%"
              textAlign="center"
              color="#1D3448"
              mb={3}
              mt={0}
            >
              Your Availability
            </Text>

            <VStack gap={3} align="stretch">
              {sortedDays.map((day) => (
                <Box key={day} display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Text
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                    fontSize="0.875rem"
                    lineHeight="100%"
                    letterSpacing="-1.5%"
                    color="#000000"
                    minW="fit-content"
                    mr={2}
                  >
                    {day}:
                  </Text>
                  <Box display="flex" flexDirection="column" gap={1.5} alignItems="flex-end">
                    {combineContiguousSlots(groupedSlots[day]).map((timeSlot, index) => (
                      <Box
                        key={`${day}-${index}`}
                        bg="rgba(179, 206, 209, 0.3)"
                        color="#1D3448"
                        px="8px"
                        py="1px"
                        borderRadius="12px"
                        fontSize="12px"
                        fontWeight={400}
                        lineHeight="1.2"
                        fontFamily="'Open Sans', sans-serif"
                        textAlign="center"
                        w="fit-content"
                        h="20px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text
                          fontSize="12px"
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
              ))}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  );



  return renderScheduleGrid();
};

export default TimeScheduler; 