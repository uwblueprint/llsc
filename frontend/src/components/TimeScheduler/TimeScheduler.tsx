import React, { useState, useCallback } from 'react';
import {
  Box,
  Table,
  Text,
  Button,
  Heading,
  Stack,
} from '@chakra-ui/react';
import type { TimeSlot } from './types';

interface TimeSchedulerProps {
  selectedTimeSlots: TimeSlot[];
  onTimeSlotToggle: (day: string, hour: number) => void;
}

const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TimeScheduler: React.FC<TimeSchedulerProps> = ({ 
  selectedTimeSlots, 
  onTimeSlotToggle
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

  return (
    <Box h="100%" w="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* Header Row */}
      <Box display="flex" h="10%">
        <Box 
          w="80px" 
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
      </Box>

      {/* Time Grid */}
      <Box flex="1" display="flex" flexDirection="column">
        {hours.map(hour => (
          <Box key={hour} display="flex" h="7%">
            {/* Time Label */}
            <Box
              w={["16", "20", "24"]}
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
                bg={isTimeSlotSelected(dayFull, hour) ? "orange.100" : "white"}
                transition="background 0.2s"
                borderTop="0.91px solid"
                borderBottom="0.91px solid"
                borderLeft={dayIndex === 0 ? "0.91px solid" : "none"}
                borderRight="0.91px solid"
                borderColor="#e3e3e3"
                _hover={{
                  bg: isTimeSlotSelected(dayFull, hour) ? "orange.100" : "orange.50"
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
};

export default TimeScheduler; 