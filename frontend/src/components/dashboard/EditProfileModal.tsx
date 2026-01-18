import React, { useState, useEffect } from 'react';
import TimeScheduler from '@/components/dashboard/TimeScheduler';
import type { TimeSlot } from '@/components/dashboard/types';
import { Box, Heading, Text, VStack, HStack, Button, Image } from '@chakra-ui/react';
import PersonalDetails from '@/components/dashboard/PersonalDetails';
import BloodCancerExperience from '@/components/dashboard/BloodCancerExperience';
import VolunteerAccountSettings from '@/components/volunteer/VolunteerAccountSettings';
import ActionButton from '@/components/dashboard/EditButton';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserData,
  updateUserData,
  updateMyAvailability,
  AvailabilityTemplateResponse,
} from '@/APIClients/userDataAPIClient';
import { extractTimezoneAbbreviation, getTimezoneDisplayName } from '@/utils/timezoneUtils';
import { useTranslations } from 'next-intl';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations('dashboard');
  const { user, loading: authLoading } = useAuth();
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [hasBloodCancer, setHasBloodCancer] = useState(false);

  // Personal details state for profile
  const [personalDetails, setPersonalDetails] = useState<{
    name: string;
    email: string;
    birthday: string;
    gender: string;
    pronouns: string;
    timezone: string;
    overview: string;
    preferredLanguage?: string;
  }>({
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
    if (!isOpen) return;

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
              return '';
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
              return '';
            }
          };

          // Populate personal details (using camelCase after axios conversion)
          const formattedBirthday = formatDate(userData.dateOfBirth);
          const formattedPronouns = userData.pronouns?.join(', ') || '';
          const userLanguage = user?.language || undefined;

          setPersonalDetails({
            name:
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user?.email || '',
            email: userData.email || user?.email || '',
            birthday: formattedBirthday,
            gender: userData.genderIdentity || '',
            pronouns: formattedPronouns,
            timezone: userData.timezone ? getTimezoneDisplayName(userData.timezone) : 'EST',
            overview:
              userData.volunteerExperience && userData.volunteerExperience.trim()
                ? userData.volunteerExperience
                : '',
            preferredLanguage:
              userLanguage === 'fr' ? 'fr' : userLanguage === 'en' ? 'en' : undefined,
          });

          // Determine if user has blood cancer
          const hasBloodCancerValue = userData.hasBloodCancer;
          const userHasBloodCancer =
            hasBloodCancerValue === true ||
            (hasBloodCancerValue !== undefined &&
              hasBloodCancerValue !== null &&
              String(hasBloodCancerValue).toLowerCase() === 'yes');

          setHasBloodCancer(userHasBloodCancer);

          // Populate cancer experience (only if user has cancer)
          if (userHasBloodCancer) {
            setCancerExperience({
              diagnosis: userData.diagnosis ? [userData.diagnosis] : [],
              dateOfDiagnosis: userData.dateOfDiagnosis || '',
              treatments: userData.treatments || [],
              experiences: userData.experiences || [],
            });
          }

          // Populate loved one details if caring for someone
          if (userData.caringForSomeone) {
            const lovedOneBirthday = userData.lovedOneAge || '';
            const lovedOneGender = userData.lovedOneGenderIdentity || '';

            setLovedOneDetails({
              birthday: lovedOneBirthday,
              gender: lovedOneGender,
            });

            // Populate loved one cancer experience
            setLovedOneCancerExperience({
              diagnosis: userData.lovedOneDiagnosis || '',
              dateOfDiagnosis: userData.lovedOneDateOfDiagnosis || '',
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
  }, [isOpen, authLoading, user]);

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
    } else if (field === 'overview') {
      updateData.volunteer_experience = value;
    } else if (field === 'timezone') {
      // Extract abbreviation from full name (e.g., "Eastern Standard Time (EST)" -> "EST")
      updateData.timezone = extractTimezoneAbbreviation(value);
    } else if (field === 'preferredLanguage') {
      updateData.language = value; // Backend expects 'language' field
    } else if (field === 'lovedOneBirthday') {
      // Loved one's age/birthday - store as is since backend expects lovedOneAge as string
      updateData.loved_one_age = value;
    } else if (field === 'lovedOneGender') {
      updateData.loved_one_gender_identity = value;
    }

    const result = await updateUserData(updateData);
    if (!result) {
      throw new Error(t('failedToUpdate'));
    }
  };

  // Save handler for treatments
  const handleSaveTreatments = async () => {
    const result = await updateUserData({
      treatments: cancerExperience.treatments,
    });
    if (!result) {
      alert(t('failedToSave'));
    }
  };

  // Save handler for experiences
  const handleSaveExperiences = async () => {
    const result = await updateUserData({
      experiences: cancerExperience.experiences,
    });
    if (!result) {
      alert(t('failedToSave'));
    }
  };

  // Save handler for loved one treatments
  const handleSaveLovedOneTreatments = async () => {
    if (!lovedOneCancerExperience) return;
    const result = await updateUserData({
      lovedOneTreatments: lovedOneCancerExperience.treatments,
    });
    if (!result) {
      alert(t('failedToSave'));
    }
  };

  // Save handler for loved one experiences
  const handleSaveLovedOneExperiences = async () => {
    if (!lovedOneCancerExperience) return;
    const result = await updateUserData({
      lovedOneExperiences: lovedOneCancerExperience.experiences,
    });
    if (!result) {
      alert(t('failedToSave'));
    }
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
        alert(t('failedToSaveAvailability'));
      }
    } catch (err) {
      console.error('❌ Error updating availability:', err);
      alert(t('errorSavingAvailability'));
    } finally {
      setSavingAvailability(false);
    }
  };

  if (!isOpen) return null;

  // Show loading while auth initializes or data loads
  if (authLoading || loading) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="white"
        zIndex={9999}
        overflowY="auto"
      >
        <Box
          minH="100vh"
          bg="white"
          p={12}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize="16px" color="#6B7280" fontFamily="'Open Sans', sans-serif">
            {t('loading')}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="white"
      zIndex={9999}
      overflowY="auto"
    >
      <Box minH="100vh" bg="white" p={12}>
        <Box w="70%" mx="auto" overflowX="hidden">
          <HStack gap={2} mb={4} cursor="pointer" onClick={onClose}>
            <Image src="/icons/chevron-left.png" alt={t('back')} w="20px" h="20px" />
            <Text
              fontSize="16px"
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
            >
              {t('back')}
            </Text>
          </HStack>

          <Heading
            fontSize="36px"
            fontWeight={600}
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            letterSpacing="-1.5%"
            mb="48px"
          >
            {t('editProfile')}
          </Heading>

          <VStack gap={0} align="stretch">
            <PersonalDetails
              personalDetails={personalDetails}
              setPersonalDetails={setPersonalDetails}
              lovedOneDetails={lovedOneDetails}
              setLovedOneDetails={setLovedOneDetails}
              onSave={handleSavePersonalDetail}
              isVolunteer={true}
            />
            <BloodCancerExperience
              cancerExperience={cancerExperience}
              setCancerExperience={setCancerExperience}
              lovedOneCancerExperience={lovedOneCancerExperience}
              setLovedOneCancerExperience={setLovedOneCancerExperience}
              onEditTreatments={handleSaveTreatments}
              onEditExperiences={handleSaveExperiences}
              onEditLovedOneTreatments={handleSaveLovedOneTreatments}
              onEditLovedOneExperiences={handleSaveLovedOneExperiences}
              hasBloodCancer={hasBloodCancer}
            />
            <Box bg="white" p={0} mt="116px" w="100%" pb={12}>
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
            <VolunteerAccountSettings />
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default EditProfileModal;
