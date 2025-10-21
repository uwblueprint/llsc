import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import ProfileHeader from '@/components/dashboard/ProfileHeader';
import type { TimeSlot } from '@/components/dashboard/types';

const SchedulePage: React.FC = () => {
  const router = useRouter();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);

  const [additionalInfo, setAdditionalInfo] = useState('');

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

  const handleChooseNewTimes = () => {
    setSelectedTimeSlots([]);
  };

  const handleSend = () => {
    // TODO: Save availability to backend API
    // Then redirect to dashboard
    router.push('/volunteer/dashboard');
  };

  return (
    <Box minH="100vh" bg="white" p={12}>
      <VStack gap={8} align="stretch" maxW="1400px" mx="auto">
        {/* Header */}
        <HStack gap={4} align="center">
          <BiArrowBack size={20} color="#1D3448" />
          <Text fontSize="sm" color="#6B7280" cursor="pointer" fontFamily="'Open Sans', sans-serif">
            Back
          </Text>
        </HStack>

        {/* Main Content */}
        <VStack gap={8} align="stretch">
          {/* Schedule Section Header */}
          <Box>
            <ProfileHeader>Select your availability</ProfileHeader>
            <Text
              color="#414651"
              fontSize="md"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              mb={8}
            >
              Drag to select all the times you will usually be available to meet with participants. You will also be able to edit later in your profile.
            </Text>
          </Box>

          {/* Main Grid Layout */}
          <TimeScheduler
            selectedTimeSlots={selectedTimeSlots}
            onTimeSlotToggle={handleTimeSlotToggle}
            showAvailability={true}
          />

          {/* Additional Information */}
          <Box>
            <Text fontWeight="medium" mb={3} color="veniceBlue" fontFamily="body">
              Additional information (optional)
            </Text>
            <Textarea
              placeholder="Enter any additional information..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              bg="background"
              border="1px solid"
              borderColor="border"
              fontFamily="body"
              _focus={{
                borderColor: 'brand.400',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
              }}
            />
          </Box>

          {/* Action Buttons */}
          <HStack justify="flex-end" gap={4}>
            <Button
              variant="outline"
              colorScheme="brand"
              fontFamily="body"
              onClick={handleChooseNewTimes}
            >
              Choose new times
            </Button>
            <Button
              bg="#056067"
              color="#fff"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              borderRadius="md"
              px={8}
              py={2}
              _hover={{ bg: "#044d4d" }}
              onClick={handleSend}
            >
              Confirm Availability
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default SchedulePage;

