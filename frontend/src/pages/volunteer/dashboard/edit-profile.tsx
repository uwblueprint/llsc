import React, { useState } from 'react';
import { TimeScheduler } from '../../../components/TimeScheduler';
import type { TimeSlot } from '../../../components/TimeScheduler/types';
import { useAvailability } from '../../../hooks/useAvailability';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import PersonalDetails from '../../../components/profile/PersonalDetails';
import BloodCancerExperience from '../../../components/profile/BloodCancerExperience';
import ActionButton from '../../../components/profile/EditButton';
import { COLORS } from '@/constants/form';

const EditProfile: React.FC = () => {
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const { updateAvailability } = useAvailability();
  const router = useRouter();

  // Personal details state for profile
  const [personalDetails, setPersonalDetails] = useState({
    name: 'John Doe',
    email: 'john@llsc.ca',
    birthday: 'May 22, 2004',
    gender: 'Male',
    pronouns: 'he/him',
    timezone: 'Eastern Standard Time (EST)',
    overview: 'My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing. My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing.'
  });

  // Blood cancer experience state for profile
  const [cancerExperience, setCancerExperience] = useState({
    diagnosis: ['Acute Myeloid Leukemia', 'Chronic Myeloid Leukemia'],
    dateOfDiagnosis: '',
    treatments: ['Chemotherapy'],
    experiences: ['Brain Fog', 'Fertility Issues', 'Speaking to your family or friends about the diagnosis']
  });

  // Availability state for profile
  const [profileTimeSlots, setProfileTimeSlots] = useState<TimeSlot[]>([]);

  // Helper function to convert day name to day number (Monday = 1, Sunday = 0)
  const getDayNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  // Convert selectedTimeSlots to API format with actual datetime strings
  const convertTimeSlotsToAvailableTimes = (timeSlots: TimeSlot[]) => {
    const baseMonday = new Date('1970-01-05T00:00:00.000Z');

    return timeSlots
      .filter(slot => slot.selected)
      .map(slot => {
        const [startTime, endTime] = slot.time.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const dayOffset = getDayNumber(slot.day) === 0 ? 6 : getDayNumber(slot.day) - 1;
        
        const startDateTime = new Date(baseMonday);
        startDateTime.setDate(baseMonday.getDate() + dayOffset);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(baseMonday);
        endDateTime.setDate(baseMonday.getDate() + dayOffset);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        return {
          startTime: startDateTime,
          endTime: endDateTime
        };
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

  const handleEditTreatments = () => {
    console.log('Edit treatments');
  };

  const handleEditExperiences = () => {
    console.log('Edit experiences');
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditAvailability = () => {
    setIsEditingAvailability(true);
  };

  const handleClearAvailability = () => {
    setProfileTimeSlots([]);
  };

  const handleCancelEdit = () => {
    setIsEditingAvailability(false);
  };

  const handleSaveAvailability = async () => {
    const availableTimes = convertTimeSlotsToAvailableTimes(profileTimeSlots);
    
    try {
      const result = await updateAvailability(availableTimes);
      
      if (result) {
        console.log('Availability updated successfully:', result);
        setIsEditingAvailability(false);
      } else {
        console.error('Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  return (
    <Box minH="100vh" bg="white" py={6} display="flex" justifyContent="center">
      <Box minH="2409px" overflow="auto" w="85%">
        <VStack gap={6} align="stretch" p={6}>
          {/* Back Button */}
          <HStack gap={2} align="center" cursor="pointer" onClick={handleBack}>
            <BiArrowBack color={COLORS.veniceBlue} />
            <Text fontSize="sm" color={COLORS.fieldGray} fontFamily="'Open Sans', sans-serif">
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
                color={COLORS.veniceBlue}
                fontFamily="'Open Sans', sans-serif"
              >
                Edit Profile
              </Heading>

              <Box mt="48px">
                <VStack gap={0} align="stretch">
                  <PersonalDetails
                    personalDetails={personalDetails}
                    setPersonalDetails={setPersonalDetails}
                  />
                  <BloodCancerExperience
                    cancerExperience={cancerExperience}
                    setCancerExperience={setCancerExperience}
                    onEditTreatments={handleEditTreatments}
                    onEditExperiences={handleEditExperiences}
                  />
                  <Box bg="white" p={0} mt="116px" w="100%" h="1000px">
                    <HStack justify="space-between" align="center" mb={0}>
                      <Heading 
                        w="519px"
                        h="40px"
                        fontSize="1.625rem"
                        fontWeight={600}
                        lineHeight="40px"
                        letterSpacing="0%"
                        color="#1D3448"
                        fontFamily="'Open Sans', sans-serif"
                        mb="8px"
                      >
                        Your availability
                      </Heading>
                      {!isEditingAvailability ? (
                        <ActionButton onClick={handleEditAvailability}>
                          Edit
                        </ActionButton>
                      ) : (
                        <HStack gap={3}>
                          <Button
                            bg="#B91C1C"
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="6px"
                            fontFamily="'Open Sans', sans-serif"
                            fontWeight={600}
                            fontSize="0.875rem"
                            _hover={{ bg: "#991B1B" }}
                            _active={{ bg: "#7F1D1D" }}
                            onClick={handleClearAvailability}
                          >
                            Clear Availability
                          </Button>
                          <Button
                            bg="#6B7280"
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="6px"
                            fontFamily="'Open Sans', sans-serif"
                            fontWeight={600}
                            fontSize="0.875rem"
                            _hover={{ bg: "#4B5563" }}
                            _active={{ bg: "#374151" }}
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            bg="#056067"
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="6px"
                            fontFamily="'Open Sans', sans-serif"
                            fontWeight={600}
                            fontSize="0.875rem"
                            _hover={{ bg: "#044d52" }}
                            _active={{ bg: "#033e42" }}
                            onClick={handleSaveAvailability}
                          >
                            Save
                          </Button>
                        </HStack>
                      )}
                    </HStack>
                    
                    <Text 
                      fontSize="1rem" 
                      fontWeight={400}
                      lineHeight="100%"
                      letterSpacing="0%"
                      color="#495D6C" 
                      mb={4} 
                      mt={0} 
                      fontFamily="'Open Sans', sans-serif"
                    >
                      We require that availability be provided in sessions of at least 2 hours.
                    </Text>

                    <Box h="800px" w="100%" mr={0}>
                      <TimeScheduler
                        selectedTimeSlots={profileTimeSlots}
                        onTimeSlotToggle={handleProfileTimeSlotToggle}
                        showAvailability={true}
                      />
                    </Box>
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

export default EditProfile; 