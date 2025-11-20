import { Box, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { FiUser, FiFileText, FiUsers } from 'react-icons/fi';
import { COLORS } from '@/constants/colors';

interface ProfileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileNavigation({ activeTab, onTabChange }: ProfileNavigationProps) {
  const isProfileActive = activeTab === 'profile' || !activeTab;
  const isFormsActive = activeTab === 'forms';
  const isMatchesActive = activeTab === 'matches';

  return (
    <Box
      border="1px solid"
      borderColor={COLORS.grayBorder}
      borderRadius="md"
      overflow="hidden"
      mb={8}
    >
      <VStack align="stretch" gap={0}>
        <Button
          variant="ghost"
          justifyContent="flex-start"
          bg={isProfileActive ? 'blue.50' : 'transparent'}
          color={isProfileActive ? COLORS.veniceBlue : COLORS.textSecondary}
          fontWeight={isProfileActive ? 600 : 400}
          fontSize="sm"
          px={4}
          py={3}
          borderRadius={0}
          _hover={{ bg: isProfileActive ? 'blue.100' : COLORS.hoverBg }}
          _active={{ bg: isProfileActive ? 'blue.100' : COLORS.hoverBg }}
          onClick={() => onTabChange('profile')}
        >
          <HStack gap={3}>
            <FiUser size={16} />
            <Text>Profile Information</Text>
          </HStack>
        </Button>
        <Button
          variant="ghost"
          justifyContent="flex-start"
          bg={isFormsActive ? 'blue.50' : 'transparent'}
          color={isFormsActive ? COLORS.veniceBlue : COLORS.textSecondary}
          fontWeight={isFormsActive ? 600 : 400}
          fontSize="sm"
          px={4}
          py={3}
          borderRadius={0}
          _hover={{ bg: isFormsActive ? 'blue.100' : COLORS.hoverBg }}
          _active={{ bg: isFormsActive ? 'blue.100' : COLORS.hoverBg }}
          onClick={() => onTabChange('forms')}
        >
          <HStack gap={3}>
            <FiFileText size={16} />
            <Text>Forms</Text>
          </HStack>
        </Button>
        <Button
          variant="ghost"
          justifyContent="flex-start"
          bg={isMatchesActive ? 'blue.50' : 'transparent'}
          color={isMatchesActive ? COLORS.veniceBlue : COLORS.textSecondary}
          fontWeight={isMatchesActive ? 600 : 400}
          fontSize="sm"
          px={4}
          py={3}
          borderRadius={0}
          _hover={{ bg: isMatchesActive ? 'blue.100' : COLORS.hoverBg }}
          _active={{ bg: isMatchesActive ? 'blue.100' : COLORS.hoverBg }}
          onClick={() => onTabChange('matches')}
        >
          <HStack gap={3}>
            <FiUsers size={16} />
            <Text>Matches</Text>
          </HStack>
        </Button>
      </VStack>
    </Box>
  );
}
