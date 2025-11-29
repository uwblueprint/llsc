import React, { useEffect, useState } from 'react';
import { Box, VStack, HStack, Text, Image, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/APIClients/authAPIClient';
import EditProfileModal from './EditProfileModal';

interface VolunteerDashboardLayoutProps {
  children: React.ReactNode;
}

export const VolunteerDashboardLayout: React.FC<VolunteerDashboardLayoutProps> = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      setUserName(fullName || user.email);
    }
  }, []);

  const router = useRouter();
  const currentPath = router.asPath;

  const navigationItems = [
    {
      icon: '/icons/user-primary.png',
      label: 'Matches',
      path: '/volunteer/dashboard',
      isActive: currentPath === '/volunteer/dashboard',
    },
    {
      icon: '/icons/phone-call.png',
      label: 'Scheduled Calls',
      path: '/volunteer/dashboard/scheduled-calls',
      isActive: currentPath === '/volunteer/dashboard/scheduled-calls',
    },
    {
      icon: '/icons/calendar.png',
      label: 'Contact',
      path: '/volunteer/dashboard/contact',
      isActive: currentPath === '/volunteer/dashboard/contact',
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Box minH="100vh" bg="white" p={6} position="relative">
      {/* Sidebar positioned with equal gaps */}
      <Box
        position="absolute"
        left="max(24px, calc((100vw - 1269px) / 4))"
        top="80px"
        w="279px"
        bg="white"
        borderRadius="8px"
        border="1px solid rgba(187, 194, 200, 0.5)"
        p={2}
        display="flex"
        flexDirection="column"
        overflow="visible"
      >
        {/* Logo */}
        <Box mb={0} w="100%" display="flex" alignItems="center" justifyContent="flex-start" pl={4}>
          <Image
            src="/llsc-logo.png"
            alt="Leukemia & Lymphoma Society of Canada"
            w="220px"
            h="150px"
            objectFit="contain"
          />
        </Box>

        {/* Navigation */}
        <VStack align="stretch" gap="8px" flex={1}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              bg={item.isActive ? 'rgba(179, 206, 209, 0.3)' : 'transparent'}
              color={item.isActive ? '#1D3448' : '#6B7280'}
              fontWeight={item.isActive ? 600 : 400}
              fontSize="14px"
              fontFamily="'Open Sans', sans-serif"
              justifyContent="flex-start"
              h="50px"
              px="12px"
              py="8px"
              borderRadius="6px"
              _hover={{
                bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#F1F5F9',
              }}
              _active={{
                bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#E2E8F0',
              }}
            >
              <HStack gap="8px" align="center">
                {item.icon && <Image src={item.icon} alt={item.label} w="14px" h="14px" />}
                <Text>{item.label}</Text>
              </HStack>
            </Button>
          ))}
        </VStack>
      </Box>

      {/* Profile Icon positioned at top right */}
      <Box
        position="absolute"
        top="80px"
        right="80px"
        cursor="pointer"
        zIndex={10000}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditProfileOpen(true);
        }}
        _hover={{ opacity: 0.8 }}
        transition="opacity 0.2s"
      >
        <Avatar
          name={userName}
          size="lg"
          bg="rgba(179, 206, 209, 0.3)"
          color="#056067"
          fontWeight={500}
        />
      </Box>

      {/* Main Content centered */}
      <Box
        display="flex"
        justifyContent="center"
        w="100%"
        position="absolute"
        top="80px"
        left="0"
        right="0"
      >
        <Box w="711px">{children}</Box>
      </Box>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </Box>
  );
};
