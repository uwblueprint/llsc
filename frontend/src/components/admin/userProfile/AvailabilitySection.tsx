import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { COLORS } from '@/constants/colors';
import { UserResponse } from '@/types/userTypes';

interface AvailabilitySectionProps {
  user: UserResponse;
  isEditing: boolean;
  isSaving: boolean;
  selectedTimeSlots: Set<string>;
  isDragging: boolean;
  dragStart: { dayIndex: number; timeIndex: number } | null;
  getDragRangeSlots: () => Set<string>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onMouseDown: (dayIndex: number, timeIndex: number) => void;
  onMouseMove: (dayIndex: number, timeIndex: number) => void;
  onMouseUp: () => void;
}

export function AvailabilitySection({
  user,
  isEditing,
  isSaving,
  selectedTimeSlots,
  isDragging,
  dragStart,
  getDragRangeSlots,
  onStartEdit,
  onCancelEdit,
  onSave,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: AvailabilitySectionProps) {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading 
          color={COLORS.veniceBlue} 
          fontWeight={600}
          fontSize="22px"
          lineHeight="1.82em"
        >
          Availability
        </Heading>
        {isEditing ? (
          <HStack gap={2}>
            <Button 
              size="sm" 
              variant="ghost"
              fontSize="sm" 
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              bg={COLORS.teal} 
              color="white" 
              fontSize="sm" 
              fontWeight={500} 
              px={4.5}
              py={2}
              borderRadius="md"
              border="1px solid"
              borderColor={COLORS.teal}
              boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
              _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
              onClick={onSave}
              disabled={isSaving}
            >
              Save
            </Button>
          </HStack>
        ) : (
          <Button 
            size="sm" 
            bg={COLORS.teal} 
            color="white" 
            fontSize="sm" 
            fontWeight={500} 
            px={4.5}
            py={2}
            borderRadius="md"
            border="1px solid"
            borderColor={COLORS.teal}
            boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
            _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
            onClick={onStartEdit}
          >
            Edit
          </Button>
        )}
      </Flex>
      
      <Flex gap={8} align="flex-start">
        {/* Grid */}
        <Box 
          flex="1" 
          overflowX="auto"
          onMouseLeave={() => {
            // Cancel drag if mouse leaves the grid - handled by hook
          }}
          onMouseUp={() => {
            // Handle mouse up anywhere in the grid - handled by hook
          }}
        >
          <Grid templateColumns="80px repeat(7, 1fr)" gap={0} border="1px solid" borderColor={COLORS.grayBorder} borderRadius="md">
            {/* Header Row */}
            <GridItem p={2} borderBottom="1px solid" borderColor={COLORS.grayBorder} bg="gray.50">
              <Text fontSize="xs" color={COLORS.textSecondary} fontWeight="bold">EST</Text>
            </GridItem>
            {['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <GridItem key={day} p={2} borderBottom="1px solid" borderLeft="1px solid" borderColor={COLORS.grayBorder} bg="gray.50" textAlign="center">
                <Text fontSize="xs" color={COLORS.textSecondary} fontWeight="bold">{day}</Text>
              </GridItem>
            ))}

            {/* Time Rows */}
            {[
              '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
              '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
              '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
            ].map((time, timeIndex) => {
              const isHour = timeIndex % 2 === 0;
              return (
                <React.Fragment key={time}>
                  {/* Time Label */}
                  <GridItem 
                    p={1} 
                    pl={2}
                    borderTop={timeIndex > 0 ? (isHour ? "1px solid" : "1px dashed") : "none"} 
                    borderColor={COLORS.grayBorder} 
                    bg="white"
                    display="flex"
                    alignItems="center"
                  >
                    <Text fontSize="xs" color={COLORS.textSecondary} fontWeight={isHour ? "bold" : "normal"}>{time}</Text>
                  </GridItem>
                  
                  {/* Days */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const slotKey = `${dayIndex}-${timeIndex}`;
                    let isAvailable = false;
                    
                    if (isEditing) {
                      // In edit mode, check selectedTimeSlots
                      isAvailable = selectedTimeSlots.has(slotKey);
                    } else {
                      // In view mode, check user.availability templates
                      isAvailable = user.availability?.some(template => {
                        // Parse time strings (format: "HH:MM:SS" or "HH:MM")
                        const parseTime = (timeStr: string): { hour: number; minute: number } => {
                          const parts = timeStr.split(':');
                          return {
                            hour: parseInt(parts[0], 10),
                            minute: parseInt(parts[1], 10),
                          };
                        };
                        
                        const startTime = parseTime(template.startTime);
                        const endTime = parseTime(template.endTime);
                        
                        // Calculate time indices
                        const startTimeIndex = (startTime.hour - 8) * 2 + (startTime.minute === 30 ? 1 : 0);
                        const endTimeIndex = (endTime.hour - 8) * 2 + (endTime.minute === 30 ? 1 : 0);
                        
                        // Check if this slot is within the template's range
                        return template.dayOfWeek === dayIndex && 
                               timeIndex >= startTimeIndex && 
                               timeIndex < endTimeIndex;
                      }) || false;
                    }

                    // Check if this slot is in the drag range
                    const dragRangeSlots = getDragRangeSlots();
                    const isInDragRange = isDragging && dragRangeSlots.has(slotKey);
                    const dragStartKey = dragStart ? `${dragStart.dayIndex}-${dragStart.timeIndex}` : '';
                    const willBeSelected = isInDragRange && dragStartKey && !selectedTimeSlots.has(dragStartKey);
                    const willBeDeselected = isInDragRange && dragStartKey && selectedTimeSlots.has(dragStartKey);

                    // Determine background color
                    let bgColor = isAvailable ? '#FFF4E6' : 'white';
                    if (isDragging && isInDragRange) {
                      bgColor = willBeSelected ? '#E6F3FF' : willBeDeselected ? '#FFE6E6' : '#FFF4E6';
                    }

                    return (
                      <GridItem 
                        key={dayIndex} 
                        borderTop={timeIndex > 0 ? (isHour ? "1px solid" : "1px dashed") : "none"} 
                        borderLeft="1px solid" 
                        borderColor={COLORS.grayBorder}
                        bg={bgColor}
                        h="30px"
                        cursor={isEditing ? 'pointer' : 'default'}
                        onMouseDown={isEditing ? (e) => {
                          e.preventDefault();
                          onMouseDown(dayIndex, timeIndex);
                        } : undefined}
                        onMouseEnter={isEditing && isDragging ? () => {
                          onMouseMove(dayIndex, timeIndex);
                        } : undefined}
                        onMouseUp={isEditing ? () => {
                          onMouseUp();
                        } : undefined}
                        _hover={isEditing && !isDragging ? { bg: isAvailable ? '#FFE8CC' : '#F5F5F5' } : {}}
                        transition="background-color 0.1s"
                        userSelect="none"
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </Grid>
        </Box>

        {/* Summary Sidebar */}
        <Box w="200px">
          <Heading size="xs" mb={4} color={COLORS.veniceBlue}>Your Availability</Heading>
          <VStack align="stretch" gap={4}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
              // Filter templates for this day (index 0=Monday, 6=Sunday)
              const dayTemplates = user.availability?.filter(template => {
                return template.dayOfWeek === index;
              }) || [];

              if (dayTemplates.length === 0) {
                return null;
              }

              // Parse time string to minutes since midnight
              const parseTimeToMinutes = (timeStr: string): number => {
                const parts = timeStr.split(':');
                const hour = parseInt(parts[0], 10);
                const minute = parseInt(parts[1], 10);
                return hour * 60 + minute;
              };

              // Convert minutes since midnight back to time string
              const minutesToTimeString = (minutes: number): string => {
                const hour = Math.floor(minutes / 60);
                const minute = minutes % 60;
                const date = new Date();
                date.setHours(hour, minute, 0);
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              };

              // Expand templates into 30-minute blocks
              const blocks: number[] = [];
              dayTemplates.forEach(template => {
                const startMinutes = parseTimeToMinutes(template.startTime);
                const endMinutes = parseTimeToMinutes(template.endTime);
                
                // Add each 30-minute block
                for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
                  if (!blocks.includes(minutes)) {
                    blocks.push(minutes);
                  }
                }
              });

              // Sort blocks by time
              blocks.sort((a, b) => a - b);

              // Group consecutive blocks into ranges
              const ranges: { start: number; end: number }[] = [];
              if (blocks.length > 0) {
                let rangeStart = blocks[0];
                let rangeEnd = blocks[0] + 30; // Each block is 30 minutes

                for (let i = 1; i < blocks.length; i++) {
                  const currentBlock = blocks[i];
                  // If this block is contiguous with the current range, extend it
                  if (currentBlock === rangeEnd) {
                    rangeEnd = currentBlock + 30;
                  } else {
                    // Gap found, save current range and start new one
                    ranges.push({ start: rangeStart, end: rangeEnd });
                    rangeStart = currentBlock;
                    rangeEnd = currentBlock + 30;
                  }
                }
                // Don't forget the last range
                ranges.push({ start: rangeStart, end: rangeEnd });
              }

              return (
                <Box key={day}>
                  <Text fontSize="xs" mb={1} color={COLORS.textPrimary}>{day}:</Text>
                  <Flex gap={2} flexWrap="wrap">
                    {ranges.map((range, i) => (
                      <Badge key={i} bg={COLORS.bgTealLight} color={COLORS.tealDarker} fontSize="xs" textTransform="none" borderRadius="full">
                        {minutesToTimeString(range.start)} - {minutesToTimeString(range.end)}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}

