import React, { useEffect, useMemo, useState } from 'react';
import { Box, Link, Text, VStack } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';
import type { AuthenticatedUser, UserRole } from '@/types/authTypes';
import { UserRole as UserRoleEnum } from '@/types/authTypes';
import { getCurrentUser, syncCurrentUser } from '@/APIClients/authAPIClient';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { useTranslations } from 'next-intl';

// X mark icon component
const XMarkIcon: React.FC = () => (
  <Box
    w="80px"
    h="80px"
    borderRadius="50%"
    bg="white"
    border={`4px solid ${COLORS.teal}`}
    display="flex"
    alignItems="center"
    justifyContent="center"
    mb={6}
  >
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke={COLORS.teal}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

export function RejectionScreen() {
  const t = useTranslations('intake');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const resolveRole = (user: AuthenticatedUser): UserRole | null => {
      if (!user) return null;
      if ('role' in user && user.role) {
        return user.role as UserRole;
      }
      const roleId = user.user?.roleId ?? (user.roleId as unknown as number | undefined) ?? null;
      return roleIdToUserRole(roleId);
    };

    const hydrateRole = async () => {
      const localUser = getCurrentUser();
      let resolved = resolveRole(localUser);
      if (!resolved) {
        const synced = await syncCurrentUser();
        resolved = resolveRole(synced);
      }
      setUserRole(resolved ?? UserRoleEnum.PARTICIPANT);
    };

    void hydrateRole();
  }, []);

  const isVolunteer = userRole === UserRoleEnum.VOLUNTEER;
  const contactEmail = t('contactEmail');

  return (
    <Box minH="100vh" bg="white" display="flex" alignItems="center" justifyContent="center" py={12}>
      <VStack gap={6}>
        <XMarkIcon />

        <Text
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="24px"
          fontWeight={600}
          color={COLORS.veniceBlue}
          mb={2}
        >
          {t('unableToContinue')}
        </Text>

        <VStack gap={1} maxW="640px">
          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="18px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
            textAlign="center"
          >
            {isVolunteer ? (
              <>
                {t('thankYouForInterestVolunteer').split(contactEmail)[0]}
                <Link
                  href={`mailto:${contactEmail}`}
                  color={COLORS.teal}
                  textDecoration="underline"
                  fontWeight={600}
                >
                  {contactEmail}
                </Link>
                {t('thankYouForInterestVolunteer').split(contactEmail)[1]}
              </>
            ) : (
              <>
                {t('thankYouForInterestParticipant').split(contactEmail)[0]}
                <Link
                  href={`mailto:${contactEmail}`}
                  color={COLORS.teal}
                  textDecoration="underline"
                  fontWeight={600}
                >
                  {contactEmail}
                </Link>
                {t('thankYouForInterestParticipant').split(contactEmail)[1]}
              </>
            )}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
