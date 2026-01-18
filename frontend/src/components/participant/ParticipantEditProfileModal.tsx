import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, HStack, Image } from '@chakra-ui/react';
import PersonalDetails from '@/components/dashboard/PersonalDetails';
import BloodCancerExperience from '@/components/dashboard/BloodCancerExperience';
import AccountSettings from '@/components/participant/AccountSettings';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, updateUserData } from '@/APIClients/userDataAPIClient';
import { Language } from '@/types/authTypes';
import { useTranslations } from 'next-intl';

interface ParticipantEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantEditProfileModal: React.FC<ParticipantEditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useTranslations('dashboard');
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // Personal details state for profile
  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    email: '',
    birthday: '',
    gender: '',
    pronouns: '',
    timezone: 'Eastern Standard Time (EST)',
    overview: '',
    preferredLanguage: 'en' as Language,
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

  // Track if user has blood cancer
  const [hasBloodCancer, setHasBloodCancer] = useState(false);

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

          // Determine if user has blood cancer
          const hasBloodCancerValue = userData.hasBloodCancer;
          const caringForSomeoneValue = userData.caringForSomeone;
          const userHasBloodCancer =
            hasBloodCancerValue === true ||
            (hasBloodCancerValue !== undefined &&
              hasBloodCancerValue !== null &&
              String(hasBloodCancerValue).toLowerCase() === 'yes');
          const userCaringForSomeone =
            caringForSomeoneValue === true ||
            (caringForSomeoneValue !== undefined &&
              caringForSomeoneValue !== null &&
              String(caringForSomeoneValue).toLowerCase() === 'yes');

          setHasBloodCancer(userHasBloodCancer);

          // Populate personal details (using camelCase after axios conversion)
          const formattedBirthday = formatDate(userData.dateOfBirth);
          const formattedPronouns = userData.pronouns?.join(', ') || '';
          const userLanguage = user?.language || 'en';

          setPersonalDetails({
            name:
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user?.email || '',
            email: userData.email || user?.email || '',
            birthday: formattedBirthday,
            gender: userData.genderIdentity || '',
            pronouns: formattedPronouns,
            timezone: 'Eastern Standard Time (EST)', // TODO: Add timezone field to backend
            overview: '', // Participants don't have overview
            preferredLanguage: userLanguage === 'fr' ? Language.FRENCH : Language.ENGLISH,
          });

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
          if (userCaringForSomeone) {
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
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isOpen, authLoading, user]);

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
      updateData.timezone = value;
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
              personalDetails={{
                ...personalDetails,
                preferredLanguage:
                  personalDetails.preferredLanguage === Language.FRENCH ? 'fr' : 'en',
              }}
              setPersonalDetails={(updater) => {
                if (typeof updater === 'function') {
                  setPersonalDetails((prev) => {
                    const updated = updater({
                      ...prev,
                      preferredLanguage: prev.preferredLanguage === Language.FRENCH ? 'fr' : 'en',
                    });
                    return {
                      ...updated,
                      preferredLanguage: (updated.preferredLanguage === 'fr'
                        ? Language.FRENCH
                        : Language.ENGLISH) as Language,
                    };
                  });
                } else {
                  setPersonalDetails({
                    ...updater,
                    preferredLanguage: (updater.preferredLanguage === 'fr'
                      ? Language.FRENCH
                      : Language.ENGLISH) as Language,
                  });
                }
              }}
              lovedOneDetails={lovedOneDetails}
              setLovedOneDetails={setLovedOneDetails}
              onSave={handleSavePersonalDetail}
              isVolunteer={false}
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
            <AccountSettings />
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default ParticipantEditProfileModal;
