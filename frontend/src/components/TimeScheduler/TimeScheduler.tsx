import React, { useState, useCallback } from 'react';
import {
  Box,
  Table,
  Text,
  Button,
  Heading,
  Stack,
  HStack,
  VStack,
  Badge,
} from '@chakra-ui/react';
import type { TimeSlot } from './types';

interface TimeSchedulerProps {
  selectedTimeSlots: TimeSlot[];
  onTimeSlotToggle: (day: string, hour: number) => void;
  showAvailability?: boolean;
}

const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TimeScheduler: React.FC<TimeSchedulerProps> = ({ 
  selectedTimeSlots, 
  onTimeSlotToggle,
  showAvailability = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);

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

  const handleMouseDown = (day: string, hour: number) => {
    const isSelected = isTimeSlotSelected(day, hour);
    setIsDragging(true);
    setDragValue(!isSelected);
    onTimeSlotToggle(day, hour);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (isDragging && dragValue !== null) {
      const isSelected = isTimeSlotSelected(day, hour);
      if (isSelected !== dragValue) {
        onTimeSlotToggle(day, hour);
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

  const getTimeDisplayColor = (day: string) => {
    const colors = {
      'Monday': 'blue',
      'Tuesday': 'green',
      'Wednesday': 'purple',
      'Thursday': 'orange',
      'Friday': 'teal',
      'Saturday': 'pink',
      'Sunday': 'cyan',
    };
    return colors[day as keyof typeof colors] || 'gray';
  };

  const renderScheduleGrid = () => (
    <Box h="100%" w="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* Header Row */}
      <Box display="flex" h="10%">
        <Box 
          w={["16", "20", "24"]}
          maxW="160px"
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
            maxW="160px"
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
      </Box>

      {/* Time Grid */}
      <Box flex="1" display="flex" flexDirection="column">
        {hours.map(hour => (
          <Box key={hour} display="flex" h="7%">
            {/* Time Label */}
            <Box
              w={["16", "20", "24"]}
              maxW="160px"
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
                maxW="160px"
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
    </Box>
  );

  const renderAvailabilityList = () => (
    <Box>
      <Text fontWeight="medium" fontSize="md" color="#1D3448" fontFamily="'Open Sans', sans-serif" mb={4}>
        Your Availability
      </Text>
      
      <VStack gap={4} align="stretch">
        {sortedDays.length > 0 ? (
          sortedDays.map((day) => (
            <Box key={day}>
              <Text fontWeight="medium" fontSize="sm" mb={2} color="gray.700">
                {day}
              </Text>
              <VStack gap={2} align="stretch">
                {groupedSlots[day].map((timeSlot, index) => (
                  <HStack key={`${day}-${index}`} justify="space-between">
                    <Badge
                      colorScheme={getTimeDisplayColor(day)}
                      variant="subtle"
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                    >
                      {timeSlot}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
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
  );

  if (!showAvailability) {
    return renderScheduleGrid();
  }

  return (
    <HStack justify="space-between" align="start" h="100%" w="100%">
      {/* Schedule Grid - Fixed width */}
      <Box w="63.5%">
        {renderScheduleGrid()}
      </Box>

      {/* Availability List - Pushed to far right */}
      <Box w="300px">
        {renderAvailabilityList()}
      </Box>
    </HStack>
  );
};

export default TimeScheduler; 