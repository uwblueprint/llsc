import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';

interface DaySelectionCalendarProps {
  selectedDays: Date[];
  onDaysChange: (days: Date[]) => void;
  maxDays?: number; // Maximum number of days to allow selection (default: 8)
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DaySelectionCalendar({
  selectedDays,
  onDaysChange,
  maxDays = 7,
}: DaySelectionCalendarProps) {
  // Get the next 7 days starting from tomorrow
  const getAvailableDays = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < maxDays; i++) {
      const date = new Date(tomorrow);
      date.setDate(tomorrow.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const availableDays = getAvailableDays();

  const isDaySelected = (date: Date): boolean => {
    return selectedDays.some(
      (selected) =>
        selected.getDate() === date.getDate() &&
        selected.getMonth() === date.getMonth() &&
        selected.getFullYear() === date.getFullYear(),
    );
  };

  const toggleDay = (date: Date) => {
    const isSelected = isDaySelected(date);
    if (isSelected) {
      onDaysChange(selectedDays.filter((d) => d.getTime() !== date.getTime()));
    } else {
      if (selectedDays.length < maxDays) {
        onDaysChange([...selectedDays, date].sort((a, b) => a.getTime() - b.getTime()));
      }
    }
  };

  const formatDayLabel = (date: Date): string => {
    return date.getDate().toString();
  };

  const formatMonthYear = (): string => {
    const firstDay = availableDays[0];
    const lastDay = availableDays[availableDays.length - 1];
    const firstMonth = MONTHS[firstDay.getMonth()];
    const firstYear = firstDay.getFullYear();
    const lastMonth = MONTHS[lastDay.getMonth()];
    const lastYear = lastDay.getFullYear();

    if (firstMonth === lastMonth && firstYear === lastYear) {
      return `${firstMonth} ${firstYear}`;
    }
    return `${firstMonth} ${firstYear} - ${lastMonth} ${lastYear}`;
  };

  // Group days by calendar week (rows)
  const groupByWeek = (): Date[][] => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    availableDays.forEach((date) => {
      const dayOfWeek = date.getDay();

      // If it's Sunday and we have dates in currentWeek, start a new week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(date);
    });

    // Add the last week if it has dates
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = groupByWeek();

  // Create a map of date to its position in the week for quick lookup
  const dateToWeekPosition: { [key: string]: { weekIndex: number; dayIndex: number } } = {};
  weeks.forEach((week, weekIndex) => {
    week.forEach((date, dayIndex) => {
      const dateKey = date.toISOString().split('T')[0];
      dateToWeekPosition[dateKey] = { weekIndex, dayIndex };
    });
  });

  return (
    <VStack align="stretch" gap={12}>
      {/* Month/Year Header */}
      <Text
        fontSize="22px"
        fontWeight={600}
        color="#1D3448"
        fontFamily="'Open Sans', sans-serif"
        lineHeight="1.36181640625em"
        letterSpacing="-1.5%"
      >
        {formatMonthYear()}
      </Text>

      {/* Calendar Grid */}
      <Box position="relative">
        {/* Day of week headers */}
        <Flex gap="141px" justifyContent="center" alignItems="flex-start" mb="100px">
          {DAYS_OF_WEEK.map((dayName) => (
            <Box key={dayName} minW="37px" textAlign="center">
              <Text
                fontSize="24px"
                fontWeight={400}
                color="#000000"
                fontFamily="'Open Sans', sans-serif"
                lineHeight="1.36181640625em"
                letterSpacing="-3%"
                opacity={0.85}
              >
                {dayName}
              </Text>
            </Box>
          ))}
        </Flex>

        {/* Calendar rows (weeks) */}
        <VStack gap="75px" align="stretch">
          {weeks.map((week, weekIndex) => (
            <Flex key={weekIndex} gap="141px" justifyContent="center" alignItems="flex-start">
              {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                // Find the date for this day of week in this week
                const dateForCell = week.find((date) => date.getDay() === dayIndex);

                if (!dateForCell) {
                  // Empty cell - might need to show next month indicator
                  const isFirstWeek = weekIndex === 0;
                  const shouldShowNextMonth =
                    isFirstWeek &&
                    dayIndex === 0 &&
                    availableDays[availableDays.length - 1].getDate() > 7;

                  return (
                    <Box
                      key={`${weekIndex}-${dayIndex}-empty`}
                      minW="37px"
                      minH="52px"
                      position="relative"
                    >
                      {shouldShowNextMonth && (
                        <Text
                          fontSize="20px"
                          fontWeight={400}
                          color="#000000"
                          fontFamily="'Open Sans', sans-serif"
                          lineHeight="1.36181640625em"
                          letterSpacing="-3%"
                          opacity={0.3}
                          position="absolute"
                          top="66.5px"
                        >
                          {MONTHS[availableDays[availableDays.length - 1].getMonth()].substring(
                            0,
                            3,
                          )}
                        </Text>
                      )}
                    </Box>
                  );
                }

                const selected = isDaySelected(dateForCell);
                // Create a unique key using the date's ISO string to ensure uniqueness
                const dateKey = dateForCell.toISOString().split('T')[0];
                return (
                  <Box
                    key={`${weekIndex}-${dayIndex}-${dateKey}`}
                    position="relative"
                    cursor="pointer"
                    onClick={() => {
                      // Create a new Date object to ensure we're working with a fresh instance
                      const dateToToggle = new Date(dateForCell);
                      toggleDay(dateToToggle);
                    }}
                    _hover={{
                      opacity: 1,
                    }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minW="37px"
                    minH="52px"
                  >
                    <Text
                      fontSize="24px"
                      fontWeight={400}
                      color="#000000"
                      fontFamily="'Open Sans', sans-serif"
                      lineHeight="1.36181640625em"
                      letterSpacing="-1.5%"
                      opacity={selected ? 1 : 0.85}
                      textAlign="center"
                      position="relative"
                      zIndex={1}
                    >
                      {formatDayLabel(dateForCell)}
                    </Text>
                    {selected && (
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        w="52px"
                        h="52px"
                        borderRadius="full"
                        bg="rgba(179, 206, 209, 0.3)"
                        zIndex={0}
                      />
                    )}
                  </Box>
                );
              })}
            </Flex>
          ))}
        </VStack>

        {/* Divider line */}
        <Box position="absolute" left={0} top="74px" w="100%" h="1px" bg="#D9D9D9" opacity={0.4} />
      </Box>
    </VStack>
  );
}
