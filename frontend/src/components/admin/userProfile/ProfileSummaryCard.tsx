import React, { useEffect, useState } from 'react';
import { Box, Text, VStack, HStack, Flex, Badge } from '@chakra-ui/react';
import { FiUser, FiHeart } from 'react-icons/fi';
import { UserData } from '@/types/userTypes';
import { rankingAPIClient, RankingPreference } from '@/APIClients/rankingAPIClient';

interface ProfileSummaryCardProps {
  userData: UserData | null | undefined;
  userEmail?: string;
  userId?: string | string[] | undefined;
}

export function ProfileSummaryCard({ userData, userEmail, userId }: ProfileSummaryCardProps) {
  const [preferences, setPreferences] = useState<RankingPreference[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  useEffect(() => {
    if (!userId || typeof userId !== 'string') {
      return;
    }

    const fetchPreferences = async () => {
      try {
        setLoadingPreferences(true);
        // Determine target role based on user data
        const target = userData?.caringForSomeone === 'yes' ? 'caregiver' : 'patient';
        const prefs = await rankingAPIClient.getPreferences(userId, target);
        setPreferences(prefs);
      } catch (err) {
        console.error('Failed to fetch preferences:', err);
      } finally {
        setLoadingPreferences(false);
      }
    };

    fetchPreferences();
  }, [userId, userData?.caringForSomeone]);

  const getInitials = () => {
    const first = userData?.firstName?.[0] || '';
    const last = userData?.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'JD';
  };

  const getPronouns = () => {
    if (!userData?.pronouns || userData.pronouns.length === 0) return 'she/her';
    return userData.pronouns[0];
  };

  const getBadgeColor = (rank: number) => {
    if (rank === 1) return { bg: '#F2EAFF', color: '#551FDD' };
    if (rank === 2) return { bg: '#FFFFFF', color: '#414651', border: '1px solid #D5D7DA' };
    if (rank === 3) return { bg: '#E3FFE0', color: '#157909' };
    if (rank === 4) return { bg: '#FDF2FA', color: '#C11574' };
    return { bg: '#EEF4FF', color: '#3538CD' };
  };

  return (
    <Box
      bg="white"
      border="1px solid #D5D7DA"
      borderRadius="8px"
      w="100%"
      p={7}
      boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
    >
      <VStack align="stretch" gap={7}>
        {/* User Info Section */}
        <HStack align="center" gap={8}>
          {/* Avatar */}
          <Box
            w="74px"
            h="74px"
            borderRadius="50%"
            bg="#F4F4F4"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="32px" fontWeight={600} color="#000000" opacity={0.8}>
              {getInitials()}
            </Text>
          </Box>

          {/* Name and Badges */}
          <VStack align="flex-start" gap={2} flex={1}>
            <VStack align="flex-start" gap={1}>
              <HStack gap={4}>
                <Text fontSize="16px" fontWeight={600} color="#1D3448" lineHeight="1.875em">
                  {userData?.firstName || ''} {userData?.lastName?.[0] || ''}.
                </Text>
                <Text fontSize="12px" fontWeight={400} color="#495D6C" lineHeight="1.36em">
                  {getPronouns()}
                </Text>
              </HStack>
            </VStack>

            {/* Role Badges */}
            <HStack gap={2} flexWrap="wrap">
              <Badge
                bg="rgba(179, 206, 209, 0.3)"
                color="#056067"
                borderRadius="16px"
                px={2.5}
                py={1}
                fontSize="10px"
                fontWeight={400}
                lineHeight="2em"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <FiUser size={12} />
                Match with: Person with Cancer
              </Badge>
              {userData?.caringForSomeone === 'yes' && (
                <Badge
                  bg="rgba(179, 206, 209, 0.3)"
                  color="#056067"
                  borderRadius="16px"
                  px={2.5}
                  py={1}
                  fontSize="10px"
                  fontWeight={400}
                  lineHeight="2em"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <FiHeart size={12} />
                  Caring for Loved One
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Match Preferences Section */}
        <VStack align="stretch" gap={2.5}>
          <Text fontSize="14px" fontWeight={600} color="#1D3448" lineHeight="2.14em">
            Match Preferences
          </Text>
          {loadingPreferences ? (
            <Text fontSize="12px" color="#495D6C">
              Loading...
            </Text>
          ) : preferences.length > 0 ? (
            <HStack gap={2.5} flexWrap="wrap">
              {preferences.map((pref) => {
                const colors = getBadgeColor(pref.rank);
                const scopePrefix = pref.scope === 'loved_one' ? 'LO: ' : '';
                return (
                  <Badge
                    key={`${pref.kind}-${pref.id}-${pref.rank}`}
                    bg={colors.bg}
                    color={colors.color}
                    borderRadius="16px"
                    px={2.5}
                    py={1.5}
                    fontSize="10px"
                    fontWeight={400}
                    lineHeight="1.8em"
                    display="flex"
                    alignItems="center"
                    gap={1}
                    border={colors.border}
                  >
                    <Box
                      w="14px"
                      h="18px"
                      bg="white"
                      borderRadius="7px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="8px"
                      fontWeight={600}
                      color={colors.color}
                    >
                      {pref.rank}
                    </Box>
                    {scopePrefix}
                    {pref.name}
                  </Badge>
                );
              })}
            </HStack>
          ) : (
            <Text fontSize="12px" color="#495D6C">
              No match preferences set
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}

