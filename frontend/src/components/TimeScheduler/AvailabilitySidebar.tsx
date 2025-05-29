import React from 'react';
import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { AvailabilitySidebarProps } from './types';

const AvailabilitySidebar: React.FC<AvailabilitySidebarProps> = ({
  selectedTimeSlots,
}) => {
  // Group time slots by day
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

  return (
    <Box>
      <Text fontWeight="bold" mb={4} fontSize="md">
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
};

export default AvailabilitySidebar; 