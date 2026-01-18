import React, { useEffect, useState } from 'react';
import { Box, Text, VStack, Button } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import ProfileHeader from '@/components/dashboard/ProfileHeader';
import {
  getCurrentUser,
  deactivateUser,
  reactivateUser,
  getUserById,
} from '@/APIClients/authAPIClient';
import { UserResponse } from '@/types/userTypes';
import { useRouter } from 'next/router';

const AccountSettings: React.FC = () => {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (typeof window !== 'undefined') {
        const currentUser = getCurrentUser();
        if (currentUser?.id) {
          try {
            const fullProfile = await getUserById(currentUser.id);
            setUser(fullProfile);
          } catch (error) {
            console.error('Error loading user profile:', error);
          }
        }
      }
    };
    loadUserProfile();
  }, []);

  const handleBecomeVolunteer = () => {
    void router.push('/participant/become-volunteer');
  };

  const handleOptOut = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      if (user.active) {
        await deactivateUser(user.id);
      } else {
        await reactivateUser(user.id);
      }
      // Refetch user to get updated status
      const updatedUser = await getUserById(user.id);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error toggling account status:', error);
      alert(t('failedToUpdateStatus'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box bg="white" p={0} mt="116px" minH="200px">
      <ProfileHeader>{t('accountSettings')}</ProfileHeader>

      <VStack gap={6} mt="32px" align="stretch">
        {/* Preferred Language - This is now in Personal Details, but keeping structure for future fields */}

        {/* Becoming a Volunteer */}
        <Box>
          <Text
            fontSize="1rem"
            fontWeight={600}
            lineHeight="30px"
            letterSpacing="0%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            mb={2}
          >
            {t('becomingVolunteer')}
          </Text>
          <Text
            fontSize="0.875rem"
            fontWeight={400}
            lineHeight="1.5"
            color="#495D6C"
            fontFamily="'Open Sans', sans-serif"
            mb={4}
          >
            {t('completeVolunteerApplication')}
          </Text>
          <Button
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="0.875rem"
            fontFamily="'Open Sans', sans-serif"
            px={4}
            py={2}
            borderRadius="6px"
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033e42' }}
            onClick={handleBecomeVolunteer}
          >
            {t('volunteerApplicationForm')}
          </Button>
        </Box>

        {/* Opt Out / Opt In */}
        {user && (
          <Box>
            <Text
              fontSize="1rem"
              fontWeight={600}
              lineHeight="30px"
              letterSpacing="0%"
              color="#1D3448"
              fontFamily="'Open Sans', sans-serif"
              mb={2}
            >
              {user.active ? t('optOutTitle') : t('optInToProgram')}
            </Text>
            <Text
              fontSize="0.875rem"
              fontWeight={400}
              lineHeight="1.5"
              color="#495D6C"
              fontFamily="'Open Sans', sans-serif"
              mb={4}
            >
              {t('optOutDescription')}
            </Text>
            <Button
              bg={user.active ? '#A70000' : '#059669'}
              color="white"
              fontWeight={600}
              fontSize="0.875rem"
              fontFamily="'Open Sans', sans-serif"
              px={4}
              py={2}
              borderRadius="6px"
              _hover={{ bg: user.active ? '#8B0000' : '#047857' }}
              _active={{ bg: user.active ? '#750000' : '#065f46' }}
              onClick={handleOptOut}
              disabled={isProcessing}
              loading={isProcessing}
            >
              {isProcessing
                ? user.active
                  ? t('optingOut')
                  : t('optingIn')
                : user.active
                  ? t('optOut')
                  : t('optIn')}
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default AccountSettings;
