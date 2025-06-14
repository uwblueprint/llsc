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
  onConfirm?: () => void;
}

const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TimeScheduler: React.FC<TimeSchedulerProps> = ({ 
  selectedTimeSlots, 
  onTimeSlotToggle,
  onConfirm 
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
    <Box bg="white" minH="100vh" w="100%">
      <Box maxW="1400px" mx="auto" py={20} px={[4, 6, 8]}>
        {/* Header */}
        <Stack align="start" gap={4} mb={12}>
          <Heading as="h1" fontSize={["xl", "2xl", "3xl"]} fontWeight="semibold" color="gray.800" fontFamily="'Open Sans', sans-serif">
            Select your availability
          </Heading>
          <Text fontSize={["sm", "md"]} color="gray.600" lineHeight="1.6" fontFamily="'Open Sans', sans-serif" maxW="2xl">
            Drag to select all the times you will usually be available to meet with participants.
            You will also be able to edit later in your profile.
          </Text>
        </Stack>

        {/* Availability Grid */}
        <Box overflowX="auto" mb={16}>
          {/* Header Row */}
          <Box display="flex" mb={4}>
            <Box 
              w={["16", "20", "24"]} 
              h={["3rem", "3.5rem", "4rem"]}
              color="gray.500" 
              fontWeight="normal" 
              fontSize={["sm", "md"]} 
              fontFamily="'Open Sans', sans-serif" 
              display="flex" 
              alignItems="center" 
              pr={4}
              opacity={0.4}
            >
              EST
            </Box>
            {days.map(day => (
              <Box
                key={day}
                flex="1"
                h={["3rem", "3.5rem", "4rem"]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.600"
                fontWeight="normal"
                fontSize={["lg", "xl"]}
                px={[2, 4]}
                fontFamily="'Open Sans', sans-serif"
                minW={["100px", "140px", "160px"]}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* Time Grid */}
          {hours.map(hour => (
            <Box key={hour} display="flex">
              {/* Time Label */}
              <Box
                w={["16", "20", "24"]}
                color="gray.600"
                fontWeight="normal"
                fontSize={["sm", "md"]}
                fontFamily="'Open Sans', sans-serif"
                display="flex"
                alignItems="center"
                pr={4}
                h={["3rem", "3.5rem", "4rem"]}
                opacity={0.4}
              >
                {formatTime(hour)}
              </Box>
              
              {/* Day Cells */}
              {daysFull.map((dayFull, dayIndex) => (
                <Box
                  key={`${dayFull}-${hour}`}
                  flex="1"
                  h={["3rem", "3.5rem", "4rem"]}
                  cursor="pointer"
                  bg={isTimeSlotSelected(dayFull, hour) ? "orange.100" : "white"}
                  transition="background 0.2s"
                  borderTop="1px solid"
                  borderBottom="1px solid"
                  borderLeft={dayIndex === 0 ? "1px solid" : "none"}
                  borderRight="1px solid"
                  borderColor="gray.200"
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

        {/* Confirm Button */}
        <Box display="flex" justifyContent="flex-end" w="100%">
          <Button
            bg="teal.700"
            color="white"
            fontWeight="medium"
            px={[6, 8]}
            py={[3, 4]}
            fontSize={["sm", "md"]}
            borderRadius="md"
            boxShadow="sm"
            fontFamily="'Open Sans', sans-serif"
            _hover={{
              bg: "teal.800"
            }}
            transition="background 0.2s"
            onClick={onConfirm}
          >
            Confirm Availability
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TimeScheduler; 