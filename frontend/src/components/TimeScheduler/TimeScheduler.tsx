import React from 'react';
import { Box, Grid, Text } from '@chakra-ui/react';
import { TimeSlotComponent } from './';
import { TimeSchedulerProps } from './types';

const TimeScheduler: React.FC<TimeSchedulerProps> = ({
  selectedTimeSlots,
  onTimeSlotToggle,
}) => {
  const days = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const isTimeSlotSelected = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    return selectedTimeSlots.some(
      slot => slot.day === day && slot.time === timeStr
    );
  };

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      overflow="hidden"
    >
      {/* Header Row */}
      <Grid templateColumns="80px repeat(7, 1fr)" bg="gray.50">
        <Box p={3} borderRight="1px solid" borderColor="gray.200">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            
          </Text>
        </Box>
        {days.map((day, index) => (
          <Box
            key={day}
            p={3}
            borderRight={index < days.length - 1 ? "1px solid" : "none"}
            borderColor="gray.200"
            textAlign="center"
          >
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {day}
            </Text>
          </Box>
        ))}
      </Grid>

      {/* Time Rows */}
      {hours.map((hour, hourIndex) => (
        <Grid key={hour} templateColumns="80px repeat(7, 1fr)">
          {/* Time Label */}
          <Box
            p={3}
            borderRight="1px solid"
            borderTop="1px solid"
            borderColor="gray.200"
            bg="gray.50"
            display="flex"
            alignItems="center"
          >
            <Text fontSize="sm" color="gray.600">
              {hour}:00
            </Text>
          </Box>

          {/* Time Slots for each day */}
          {daysFull.map((dayFull, dayIndex) => (
            <TimeSlotComponent
              key={`${dayFull}-${hour}`}
              day={dayFull}
              hour={hour}
              isSelected={isTimeSlotSelected(dayFull, hour)}
              onClick={() => onTimeSlotToggle(dayFull, hour)}
              isLastColumn={dayIndex === daysFull.length - 1}
            />
          ))}
        </Grid>
      ))}
    </Box>
  );
};

export default TimeScheduler; 