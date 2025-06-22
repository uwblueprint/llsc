import React, { useState, useEffect } from 'react';
import { TimeScheduler } from '../../components/TimeScheduler';
import type { TimeSlot } from '../../components/TimeScheduler/types';
import { useAvailability } from '../../hooks/useAvailability';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Stack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import PersonalDetails from '../../components/profile/PersonalDetails';
import BloodCancerExperience from '../../components/profile/BloodCancerExperience';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

const VolunteerDashboard: React.FC = () => {
  // Placeholder: Replace with real logic (API/localStorage) for first-time check
  const [showSchedule, setShowSchedule] = useState(true);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);

  const { createAvailability, getAvailability, updateAvailability, loading, error } = useAvailability();
  const router = useRouter();

  // Personal details state for profile
  const [personalDetails, setPersonalDetails] = useState({
    name: 'John Doe',
    email: 'john@llsc.ca',
    birthday: 'May 22, 2004',
    gender: 'Male',
    timezone: 'Eastern Standard Time (EST) • 11:40 AM',
    overview: 'My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing. My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing.'
  });

  // Blood cancer experience state for profile
  const [cancerExperience, setCancerExperience] = useState({
    diagnosis: 'Acute Myeloid Leukemia',
    dateOfDiagnosis: '',
    treatments: ['Chemotherapy'],
    experiences: ['Brain Fog', 'Fertility Issues', 'Speaking to your family or friends about the diagnosis']
  });

  // Availability state for profile
  const [profileTimeSlots, setProfileTimeSlots] = useState<TimeSlot[]>([
    { day: 'Monday', time: '12:00 - 1:00', selected: true },
    { day: 'Monday', time: '1:00 - 2:00', selected: true },
    { day: 'Monday', time: '2:00 - 3:00', selected: true },
    { day: 'Monday', time: '3:00 - 4:00', selected: true },
    { day: 'Monday', time: '4:00 - 5:00', selected: true },
  ]);

  useEffect(() => {
    // Example: Check localStorage for a flag
    const hasSetAvailability = localStorage.getItem('hasSetAvailability');
    if (hasSetAvailability === 'true') {
      setShowSchedule(false);
    }
  }, []);

  // Helper function to convert day name to day number (Monday = 1, Sunday = 0)
  const getDayNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  // Convert selectedTimeSlots to API format with actual datetime strings
  const convertTimeSlotsToAvailableTimes = (timeSlots: TimeSlot[]) => {
    // Use the week of 1970-01-05 (Monday) as the base date
    // 1970-01-05 = Monday, 1970-01-06 = Tuesday, etc.
    const baseMonday = new Date('1970-01-05T00:00:00.000Z');

    return timeSlots
      .filter(slot => slot.selected)
      .map(slot => {
        // Parse the time string (e.g., "13:00 - 14:00")
        const [startTime, endTime] = slot.time.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Get the day offset from Monday (Monday = 0, Tuesday = 1, etc.)
        const dayOffset = getDayNumber(slot.day) === 0 ? 6 : getDayNumber(slot.day) - 1; // Sunday = 6, Monday = 0
        
        // Create start datetime
        const startDateTime = new Date(baseMonday);
        startDateTime.setDate(baseMonday.getDate() + dayOffset);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        // Create end datetime
        const endDateTime = new Date(baseMonday);
        endDateTime.setDate(baseMonday.getDate() + dayOffset);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        return {
          startTime: startDateTime,
          endTime: endDateTime
        };
      });
  };

  const handleTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    
    setSelectedTimeSlots(prev => {
      const existingSlotIndex = prev.findIndex(
        slot => slot.day === day && slot.time === timeStr
      );

      if (existingSlotIndex >= 0) {
        // Remove the time slot if it exists
        return prev.filter((_, index) => index !== existingSlotIndex);
      } else {
        // Add the time slot if it doesn't exist
        return [...prev, { day, time: timeStr, selected: true }];
      }
    });
  };

  const handleProfileTimeSlotToggle = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    
    setProfileTimeSlots(prev => {
      const existingSlotIndex = prev.findIndex(
        slot => slot.day === day && slot.time === timeStr
      );

      if (existingSlotIndex >= 0) {
        return prev.filter((_, index) => index !== existingSlotIndex);
      } else {
        return [...prev, { day, time: timeStr, selected: true }];
      }
    });
  };

  const handleConfirmAvailability = async () => {
    // Convert time slots to API format
    const availableTimes = convertTimeSlotsToAvailableTimes(selectedTimeSlots);
    
    try {
      const result = await createAvailability(availableTimes);
      
      if (result) {
        console.log('Availability created successfully:', result);
        // Set flag so schedule doesn't show again
        localStorage.setItem('hasSetAvailability', 'true');
        // Show profile instead of redirecting
        setShowSchedule(false);
      } else {
        console.error('Failed to create availability');
      }
    } catch (err) {
      console.error('Error creating availability:', err);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditTreatments = () => {
    console.log('Edit treatments');
  };

  const handleEditExperiences = () => {
    console.log('Edit experiences');
  };

  const handleEditAvailability = () => {
    console.log('Edit availability');
  };

  if (showSchedule) {
    return (
      <Box bg="white" h="100vh" w="100vw" display="flex" flexDirection="column" alignItems="center" justifyContent="space-evenly" py={8}>
        {/* Header */}
        <Stack align="start" gap="1.85vh" w="1240px">
          <Heading as="h1" fontSize="2.25rem" fontWeight="600" color="#1D3448" lineHeight="1" letterSpacing="-1.5%" fontFamily="'Open Sans', sans-serif">
            Select your availability
          </Heading>
          <Text fontSize="1.125rem" fontWeight="400" color="gray.600" lineHeight="1" letterSpacing="-1.5%" fontFamily="'Open Sans', sans-serif" maxW="2xl" whiteSpace="nowrap">
            Drag to select all the times you will usually be available to meet with participants.
            You will also be able to edit later in your profile.
          </Text>
        </Stack>
        
        {/* TimeScheduler Container */}
        <Box w="1240px" h="787px">
          <TimeScheduler
            selectedTimeSlots={selectedTimeSlots}
            onTimeSlotToggle={handleTimeSlotToggle}
          />
        </Box>
        
        {/* Button */}
        <Box display="flex" justifyContent="flex-end" w="1240px">
          <Button
            size="2xl"
            bg="#056067"
            color="white"
            fontWeight="medium"
            w="227px"
            h="52px"
            px="28px"
            py="16px"
            fontSize="lg"
            borderRadius="8px"
            border="1px solid #056067"
            boxShadow="sm"
            fontFamily="'Open Sans', sans-serif"
            _hover={{
              bg: "#044953"
            }}
            transition="background 0.2s"
            onClick={handleConfirmAvailability}
          >
            Confirm Availability
          </Button>
        </Box>
      </Box>
    );
  }

  // Profile Page Content
  return (
    <Box minH="100vh" bg="white" py={6} display="flex" justifyContent="center">
      <Box minH="2409px" overflow="auto">
        <VStack gap={6} align="stretch" p={6}>
          {/* Back Button */}
          <HStack gap={2} align="center" cursor="pointer" onClick={handleBack}>
            <BiArrowBack color={veniceBlue} />
            <Text fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
              Back
            </Text>
          </HStack>

          {/* Main Content Wrapper */}
          <Box h="2050px">
            <VStack gap={6} align="stretch">
              {/* Title */}
              <Heading 
                w="630px"
                h="49px"
                fontSize="2.25rem"
                fontWeight={600}
                lineHeight="100%"
                letterSpacing="-1.5%"
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
              >
                Edit Profile
              </Heading>

              {/* Wrapper for Personal Details, Blood Cancer Experience, and Availability */}
              <Box mt="48px">
                <VStack gap={0} align="stretch">
                  {/* Personal Details Section - Using Component */}
                  <PersonalDetails
                    personalDetails={personalDetails}
                    setPersonalDetails={setPersonalDetails}
                  />

                  {/* Blood Cancer Experience Section - Using Component */}
                  <BloodCancerExperience
                    cancerExperience={cancerExperience}
                    setCancerExperience={setCancerExperience}
                    onEditTreatments={handleEditTreatments}
                    onEditExperiences={handleEditExperiences}
                  />

                  {/* Availability Section - Reusing TimeScheduler */}
                  <Box bg="white" p={6}>
                    <HStack justify="space-between" align="center" mb={6}>
                      <Heading 
                        size="md" 
                        color={veniceBlue} 
                        fontFamily="'Open Sans', sans-serif"
                        fontWeight={600}
                      >
                        Your availability
                      </Heading>
                      <Button 
                        size="sm" 
                        bg={teal} 
                        color="white" 
                        onClick={handleEditAvailability}
                        fontFamily="'Open Sans', sans-serif"
                        _hover={{ bg: "#044d4d" }}
                      >
                        Edit
                      </Button>
                    </HStack>
                    
                    <Text fontSize="sm" color={fieldGray} mb={4} fontFamily="'Open Sans', sans-serif">
                      We require that availability be provided in sessions of at least 2 hours.
                    </Text>

                    <HStack gap={8} align="start">
                      {/* Time Grid - Reusing TimeScheduler */}
                      <Box flex="2" h="400px">
                        <TimeScheduler
                          selectedTimeSlots={profileTimeSlots}
                          onTimeSlotToggle={handleProfileTimeSlotToggle}
                        />
                      </Box>

                      {/* Availability Summary */}
                      <Box flex="1">
                        <Text fontWeight="bold" mb={4} fontSize="md" color={veniceBlue} fontFamily="'Open Sans', sans-serif">
                          Your Availability
                        </Text>
                        
                        <VStack gap={2} align="stretch">
                          <Text fontWeight="medium" fontSize="sm" color={fieldGray} fontFamily="'Open Sans', sans-serif">
                            Monday
                          </Text>
                          {profileTimeSlots
                            .filter(slot => slot.day === 'Monday')
                            .map((slot, index) => (
                              <HStack key={index}>
                                <Text fontSize="sm" color="blue.600" fontFamily="'Open Sans', sans-serif">
                                  {slot.time}
                                </Text>
                              </HStack>
                            ))}
                        </VStack>
                      </Box>
                    </HStack>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default VolunteerDashboard; 