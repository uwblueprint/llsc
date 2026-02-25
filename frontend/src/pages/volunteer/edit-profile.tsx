import React, { useState, useEffect } from 'react';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import type { TimeSlot } from '@/components/dashboard/types';
import { Box, Heading, Text, VStack, HStack, Button, Tabs } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { BiArrowBack } from 'react-icons/bi';
import PersonalDetails from '@/components/dashboard/PersonalDetails';
import BloodCancerExperience from '@/components/dashboard/BloodCancerExperience';
import ActionButton from '@/components/dashboard/EditButton';
import { COLORS } from '@/constants/form';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserData,
  updateUserData,
  updateMyAvailability,
  AvailabilityTemplateResponse,
} from '@/APIClients/userDataAPIClient';
import { extractTimezoneAbbreviation, getTimezoneDisplayName } from '@/utils/timezoneUtils';
import { useTranslations } from 'next-intl';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const EditProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('dashboard');
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const isDesktop = useIsDesktop();
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>('Sunday');

  // Personal details state for profile
  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    email: '',
    birthday: '',
    gender: '',
    pronouns: '',
    timezone: 'EST',
    overview: '',
  });

  // Blood cancer experience state for profile
  const [cancerExperience, setCancerExperience] = useState({
    diagnosis: [] as string[],
    dateOfDiagnosis: '',
    treatments: [] as string[],
    experiences: [] as string[],
  });

  // Loved one details state
  const [lovedOneDetails, setLovedOneDetails] = useState<{
    birthday: string;
    gender: string;
  } | null>(null);

  // Loved one cancer experience state
  const [lovedOneCancerExperience, setLovedOneCancerExperience] = useState<{
    diagnosis: string;
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  } | null>(null);

  // Helper function to convert AvailabilityTemplates to TimeSlots for the scheduler
  const convertTemplatesToTimeSlots = (templates: AvailabilityTemplateResponse[]): TimeSlot[] => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots: TimeSlot[] = [];

    templates.forEach((template) => {
      const dayName = dayNames[template.dayOfWeek];

      // Parse time strings (format: "HH:MM:SS")
      const parseTime = (timeStr: string): { hour: number; minute: number } => {
        const parts = timeStr.split(':');
        return {
          hour: parseInt(parts[0], 10),
          minute: parseInt(parts[1], 10),
        };
      };

      const startTime = parseTime(template.startTime);
      const endTime = parseTime(template.endTime);

      // Create hourly time slots (TimeScheduler works with 1-hour blocks)
      for (let hour = startTime.hour; hour < endTime.hour; hour++) {
        timeSlots.push({
          day: dayName,
          time: `${hour}:00 - ${hour + 1}:00`,
          selected: true,
        });
      }
    });

    return timeSlots;
  };

  // Load user data from API
  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Wait for auth to be ready
    if (authLoading) return;

    const loadUserData = async () => {
      setLoading(true);
      try {
        const userData = await getUserData();

        if (userData) {
          // Format date from ISO (YYYY-MM-DD) to display format (DD/MM/YYYY)
          const formatDate = (isoDate: string | undefined | null): string => {
            if (!isoDate) {
              return 'Not provided';
            }
            try {
              const date = new Date(isoDate);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              const formatted = `${day}/${month}/${year}`;
              return formatted;
            } catch (error) {
              console.error('formatDate error:', error);
              return 'Not provided';
            }
          };

          // Populate personal details (using camelCase after axios conversion)
          const formattedBirthday = formatDate(userData.dateOfBirth);
          const formattedPronouns = userData.pronouns?.join(', ') || 'Not provided';

          setPersonalDetails({
            name:
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
              user?.email ||
              'Not provided',
            email: userData.email || user?.email || 'Not provided',
            birthday: formattedBirthday,
            gender: userData.genderIdentity || 'Not provided',
            pronouns: formattedPronouns,
            timezone: userData.timezone ? getTimezoneDisplayName(userData.timezone) : 'EST',
            overview:
              userData.volunteerExperience && userData.volunteerExperience.trim()
                ? userData.volunteerExperience
                : 'Not provided',
          });

          // Populate cancer experience
          setCancerExperience({
            diagnosis: userData.diagnosis ? [userData.diagnosis] : [],
            dateOfDiagnosis: userData.dateOfDiagnosis || '',
            treatments: userData.treatments || [],
            experiences: userData.experiences || [],
          });

          // Populate loved one details if caring for someone
          if (userData.caringForSomeone) {
            const lovedOneBirthday = userData.lovedOneAge || 'Not provided';
            const lovedOneGender = userData.lovedOneGenderIdentity || 'Not provided';

            setLovedOneDetails({
              birthday: lovedOneBirthday,
              gender: lovedOneGender,
            });

            // Populate loved one cancer experience
            setLovedOneCancerExperience({
              diagnosis: userData.lovedOneDiagnosis || 'Not provided',
              dateOfDiagnosis: userData.lovedOneDateOfDiagnosis || 'Not provided',
              treatments: userData.lovedOneTreatments || [],
              experiences: userData.lovedOneExperiences || [],
            });
          }

          // Convert and populate availability
          if (userData.availability && userData.availability.length > 0) {
            const timeSlots = convertTemplatesToTimeSlots(userData.availability);
            setProfileTimeSlots(timeSlots);
          }
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authLoading, user, router]);

  // Availability state for profile
  const [profileTimeSlots, setProfileTimeSlots] = useState<TimeSlot[]>([]);

  const handleTimeSlotsChange = (timeSlots: TimeSlot[]) => {
    setProfileTimeSlots(timeSlots);
  };

  // Save handler for PersonalDetails
  const handleSavePersonalDetail = async (field: string, value: string) => {
    const updateData: Partial<Record<string, unknown>> = {};

    // Map frontend field names to backend snake_case (axios will convert to camelCase on send)
    if (field === 'name') {
      const [firstName, ...lastNameParts] = value.split(' ');
      updateData.first_name = firstName || '';
      updateData.last_name = lastNameParts.join(' ') || '';
    } else if (field === 'birthday') {
      // Convert DD/MM/YYYY to YYYY-MM-DD for backend
      try {
        const [day, month, year] = value.split('/');
        updateData.date_of_birth = `${year}-${month}-${day}`;
      } catch {
        updateData.date_of_birth = value;
      }
    } else if (field === 'gender') {
      updateData.gender_identity = value;
    } else if (field === 'pronouns') {
      updateData.pronouns = value.split(',').map((p) => p.trim());
    } else if (field === 'timezone') {
      // Extract abbreviation from full name (e.g., "Eastern Standard Time (EST)" -> "EST")
      updateData.timezone = extractTimezoneAbbreviation(value);
    } else if (field === 'overview') {
      updateData.volunteer_experience = value;
    } else if (field === 'lovedOneBirthday') {
      // Loved one's age/birthday - store as is since backend expects lovedOneAge as string
      updateData.loved_one_age = value;
    } else if (field === 'lovedOneGender') {
      updateData.loved_one_gender_identity = value;
    }

    const result = await updateUserData(updateData);
    if (!result) {
      throw new Error('Failed to update');
    }
  };

  // Save handler for treatments
  const handleSaveTreatments = async () => {
    const result = await updateUserData({
      treatments: cancerExperience.treatments,
    });
    if (!result) {
      alert('Failed to save treatments');
    }
  };

  // Save handler for experiences
  const handleSaveExperiences = async () => {
    const result = await updateUserData({
      experiences: cancerExperience.experiences,
    });
    if (!result) {
      alert('Failed to save experiences');
    }
  };

  // Save handler for loved one treatments
  const handleSaveLovedOneTreatments = async () => {
    if (!lovedOneCancerExperience) return;
    const result = await updateUserData({
      lovedOneTreatments: lovedOneCancerExperience.treatments,
    });
    if (!result) {
      alert('Failed to save loved one treatments');
    }
  };

  // Save handler for loved one experiences
  const handleSaveLovedOneExperiences = async () => {
    if (!lovedOneCancerExperience) return;
    const result = await updateUserData({
      lovedOneExperiences: lovedOneCancerExperience.experiences,
    });
    if (!result) {
      alert('Failed to save loved one experiences');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditAvailability = () => {
    setIsEditingAvailability(true);
  };

  const handleClearAvailability = () => {
    // Clear the time slots state - TimeScheduler will update automatically
    setProfileTimeSlots([]);
  };

  const handleCancelEdit = () => {
    setIsEditingAvailability(false);
  };

  const handleSaveAvailability = async () => {
    // Convert TimeSlots to AvailabilityTemplates for API
    const convertToTemplates = (timeSlots: TimeSlot[]): AvailabilityTemplateResponse[] => {
      const dayToIndex: Record<string, number> = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

      const slotsByDay = timeSlots.reduce(
        (acc, slot) => {
          if (!acc[slot.day]) {
            acc[slot.day] = [];
          }
          acc[slot.day].push(slot);
          return acc;
        },
        {} as Record<string, TimeSlot[]>,
      );

      const templates: AvailabilityTemplateResponse[] = [];

      Object.entries(slotsByDay).forEach(([day, slots]) => {
        const sortedSlots = slots.sort((a, b) => {
          const aHour = parseInt(a.time.split(':')[0]);
          const bHour = parseInt(b.time.split(':')[0]);
          return aHour - bHour;
        });

        let rangeStart: number | null = null;
        let lastEndHour = -1;

        sortedSlots.forEach((slot, index) => {
          const [startTimeStr, endTimeStr] = slot.time.split(' - ');
          const startHour = parseInt(startTimeStr.split(':')[0]);
          const endHour = parseInt(endTimeStr.split(':')[0]);

          if (rangeStart === null) {
            rangeStart = startHour;
            lastEndHour = endHour;
          } else if (startHour === lastEndHour) {
            lastEndHour = endHour;
          } else {
            templates.push({
              dayOfWeek: dayToIndex[day],
              startTime: `${rangeStart.toString().padStart(2, '0')}:00:00`,
              endTime: `${lastEndHour.toString().padStart(2, '0')}:00:00`,
            });
            rangeStart = startHour;
            lastEndHour = endHour;
          }

          if (index === sortedSlots.length - 1) {
            templates.push({
              dayOfWeek: dayToIndex[day],
              startTime: `${rangeStart!.toString().padStart(2, '0')}:00:00`,
              endTime: `${lastEndHour.toString().padStart(2, '0')}:00:00`,
            });
          }
        });
      });

      return templates;
    };

    setSavingAvailability(true);

    try {
      const templates = convertToTemplates(profileTimeSlots);

      const success = await updateMyAvailability(templates);

      if (success) {
        setIsEditingAvailability(false);

        // Reload user data to refresh the display
        const userData = await getUserData();
        if (userData?.availability) {
          const timeSlots = convertTemplatesToTimeSlots(userData.availability);
          setProfileTimeSlots(timeSlots);
        }
      } else {
        console.error('❌ Failed to update availability');
        alert('Failed to save availability. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error updating availability:', err);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Show loading while auth initializes or data loads
  if (authLoading || loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        py={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="lg" color={COLORS.fieldGray}>
          Loading...
        </Text>
      </Box>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Mobile day abbreviations for availability selector
  const mobileDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayFullNames: Record<string, string> = {
    SUN: 'Sunday',
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
  };
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const formatMobileTime = (hour: number) => {
    if (hour <= 11) {
      return `${hour} AM`;
    } else if (hour === 12) {
      return `12 PM`;
    } else {
      return `${hour - 12} PM`;
    }
  };

  const isTimeSlotSelectedForDay = (day: string, hour: number) => {
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    return profileTimeSlots.some((slot) => slot.day === day && slot.time === timeStr);
  };

  const handleMobileTimeSlotToggle = (day: string, hour: number) => {
    if (!isEditingAvailability) return;
    const timeStr = `${hour}:00 - ${hour + 1}:00`;
    const existingSlotIndex = profileTimeSlots.findIndex(
      (slot) => slot.day === day && slot.time === timeStr,
    );

    let newSlots: TimeSlot[];
    if (existingSlotIndex >= 0) {
      newSlots = profileTimeSlots.filter((_, index) => index !== existingSlotIndex);
    } else {
      newSlots = [...profileTimeSlots, { day, time: timeStr, selected: true }];
    }

    setProfileTimeSlots(newSlots);
    if (handleTimeSlotsChange) {
      handleTimeSlotsChange(newSlots);
    }
  };

  // Render personal details content
  const renderPersonalDetails = () => (
    <PersonalDetails
      personalDetails={personalDetails}
      setPersonalDetails={setPersonalDetails}
      lovedOneDetails={lovedOneDetails}
      setLovedOneDetails={setLovedOneDetails}
      onSave={handleSavePersonalDetail}
    />
  );

  // Render blood cancer experience content
  const renderHistory = () => (
    <BloodCancerExperience
      cancerExperience={cancerExperience}
      setCancerExperience={setCancerExperience}
      lovedOneCancerExperience={lovedOneCancerExperience}
      setLovedOneCancerExperience={setLovedOneCancerExperience}
      onEditTreatments={handleSaveTreatments}
      onEditExperiences={handleSaveExperiences}
      onEditLovedOneTreatments={handleSaveLovedOneTreatments}
      onEditLovedOneExperiences={handleSaveLovedOneExperiences}
    />
  );

  // Render availability content for desktop
  const renderAvailabilityDesktop = () => (
    <Box bg="white" p={0} mt="116px" w="100%" h="1100px" pb={12}>
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
          {t('yourAvailabilityHeading')}
        </Heading>
        {!isEditingAvailability ? (
          <ActionButton onClick={handleEditAvailability}>{t('edit')}</ActionButton>
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
              _hover={{ bg: '#991B1B' }}
              _active={{ bg: '#7F1D1D' }}
              onClick={handleClearAvailability}
            >
              {t('clearAvailability')}
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
              _hover={{ bg: '#4B5563' }}
              _active={{ bg: '#374151' }}
              onClick={handleCancelEdit}
            >
              {t('cancel')}
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
              _hover={{ bg: '#044d52' }}
              _active={{ bg: '#033e42' }}
              onClick={handleSaveAvailability}
              disabled={savingAvailability}
            >
              {savingAvailability ? t('saving') : t('save')}
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
        {t('weRequire2Hours')}
      </Text>

      <Box h="900px" w="100%" mr={0}>
        <TimeScheduler
          showAvailability={true}
          onTimeSlotsChange={handleTimeSlotsChange}
          initialTimeSlots={profileTimeSlots}
          readOnly={!isEditingAvailability}
        />
      </Box>
    </Box>
  );

  // Render mobile availability with day selector and vertical time list
  const renderAvailabilityMobile = () => (
    <VStack align="stretch" gap={4}>
      <Text fontSize="16px" fontWeight={600} color="#1D3448" fontFamily="'Open Sans', sans-serif">
        {t('yourAvailabilityHeading')}
      </Text>
      <Text fontSize="14px" fontWeight={400} color="#495D6C" fontFamily="'Open Sans', sans-serif">
        {t('weRequire2Hours')}
      </Text>

      {/* Day selector pills */}
      <HStack gap={2} overflowX="auto" pb={2}>
        {mobileDays.map((day) => (
          <Box
            key={day}
            px={3}
            py={2}
            borderRadius="full"
            bg={selectedMobileDay === dayFullNames[day] ? '#1D3448' : 'white'}
            color={selectedMobileDay === dayFullNames[day] ? 'white' : '#1D3448'}
            border="1px solid"
            borderColor={selectedMobileDay === dayFullNames[day] ? '#1D3448' : '#E5E7EB'}
            cursor="pointer"
            onClick={() => setSelectedMobileDay(dayFullNames[day])}
            fontFamily="'Open Sans', sans-serif"
            fontSize="14px"
            fontWeight={500}
            flexShrink={0}
          >
            {day}
          </Box>
        ))}
      </HStack>

      {/* Vertical time slots list */}
      <VStack align="stretch" gap={0}>
        {hours.map((hour) => {
          const isSelected = isTimeSlotSelectedForDay(selectedMobileDay, hour);
          return (
            <Box
              key={hour}
              py={3}
              px={4}
              borderBottom="1px solid"
              borderColor="#E5E7EB"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              cursor={isEditingAvailability ? 'pointer' : 'default'}
              onClick={() => handleMobileTimeSlotToggle(selectedMobileDay, hour)}
              bg={isSelected ? 'rgba(255, 187, 138, 0.2)' : 'white'}
            >
              <Text
                fontSize="14px"
                fontWeight={400}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
              >
                {formatMobileTime(hour)}
              </Text>
              {isSelected && (
                <Box
                  bg="rgba(255, 187, 138, 0.5)"
                  color="#1D3448"
                  px={3}
                  py={1}
                  borderRadius="4px"
                  fontSize="12px"
                  fontWeight={500}
                  fontFamily="'Open Sans', sans-serif"
                >
                  {formatMobileTime(hour)} - {formatMobileTime(hour + 1)}
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Action buttons */}
      {!isEditingAvailability ? (
        <Button
          bg="#056067"
          color="white"
          w="100%"
          py={6}
          borderRadius="8px"
          fontFamily="'Open Sans', sans-serif"
          fontWeight={600}
          fontSize="16px"
          _hover={{ bg: '#044d52' }}
          _active={{ bg: '#033e42' }}
          onClick={handleEditAvailability}
        >
          {t('editAvailability')}
        </Button>
      ) : (
        <HStack gap={3}>
          <Button
            flex={1}
            bg="#B91C1C"
            color="white"
            py={6}
            borderRadius="8px"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            fontSize="14px"
            _hover={{ bg: '#991B1B' }}
            _active={{ bg: '#7F1D1D' }}
            onClick={handleClearAvailability}
          >
            {t('clearAvailability')}
          </Button>
          <Button
            flex={1}
            bg="#056067"
            color="white"
            py={6}
            borderRadius="8px"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            fontSize="14px"
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033e42' }}
            onClick={handleSaveAvailability}
            disabled={savingAvailability}
          >
            {savingAvailability ? t('saving') : t('saveChanges')}
          </Button>
        </HStack>
      )}
    </VStack>
  );

  // Mobile layout with tabs
  const renderMobileLayout = () => (
    <Box minH="100vh" bg="white" px={4} py={6}>
      <HStack gap={2} align="center" cursor="pointer" onClick={handleBack} mb={4}>
        <BiArrowBack color={COLORS.veniceBlue} />
        <Text fontSize="sm" color={COLORS.fieldGray} fontFamily="'Open Sans', sans-serif">
          {t('back')}
        </Text>
      </HStack>

      <Heading
        fontSize="24px"
        fontWeight={600}
        color={COLORS.veniceBlue}
        fontFamily="'Open Sans', sans-serif"
        letterSpacing="-0.015em"
        mb={6}
        textAlign="center"
      >
        {t('editProfile')}
      </Heading>

      <Tabs.Root defaultValue="personal" variant="line">
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="#E5E7EB" gap={0}>
          <Tabs.Trigger
            value="personal"
            flex={1}
            fontSize="14px"
            fontWeight={400}
            fontFamily="'Open Sans', sans-serif"
            color="#6B7280"
            pb={3}
            _selected={{
              color: '#1D3448',
              fontWeight: 600,
              borderBottomWidth: '2px',
              borderColor: '#1D3448',
            }}
          >
            {t('personalDetails')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="history"
            flex={1}
            fontSize="14px"
            fontWeight={400}
            fontFamily="'Open Sans', sans-serif"
            color="#6B7280"
            pb={3}
            _selected={{
              color: '#1D3448',
              fontWeight: 600,
              borderBottomWidth: '2px',
              borderColor: '#1D3448',
            }}
          >
            {t('history')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="availability"
            flex={1}
            fontSize="14px"
            fontWeight={400}
            fontFamily="'Open Sans', sans-serif"
            color="#6B7280"
            pb={3}
            _selected={{
              color: '#1D3448',
              fontWeight: 600,
              borderBottomWidth: '2px',
              borderColor: '#1D3448',
            }}
          >
            {t('availability')}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="personal">
          <VStack gap={0} align="stretch">
            {renderPersonalDetails()}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="history">
          <VStack gap={0} align="stretch">
            {renderHistory()}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="availability">{renderAvailabilityMobile()}</Tabs.Content>
      </Tabs.Root>
    </Box>
  );

  // Desktop layout (original)
  const renderDesktopLayout = () => (
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
                letterSpacing="-0.015em"
                color={COLORS.veniceBlue}
                fontFamily="'Open Sans', sans-serif"
              >
                Edit Profile
              </Heading>

              <Box mt="48px">
                <VStack gap={0} align="stretch">
                  {renderPersonalDetails()}
                  {renderHistory()}
                  {renderAvailabilityDesktop()}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );

  return isDesktop ? renderDesktopLayout() : renderMobileLayout();
};

export default EditProfile;
