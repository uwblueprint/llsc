import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Button,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { COLORS } from '@/constants/form';
import UserAvatar from '../UserAvatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userInitials?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName = "John",
  userInitials = "JD"
}) => {
  const router = useRouter();
  const currentPath = router.asPath;

  const navigationItems = [
    {
      icon: '/icons/user-primary.png',
      label: 'Matches',
      path: '/volunteer/dashboard',
      isActive: currentPath === '/volunteer/dashboard'
    },
    {
      icon: '/icons/phone-call.png',
      label: 'Scheduled Calls',
      path: '/volunteer/dashboard/scheduled-calls',
      isActive: currentPath === '/volunteer/dashboard/scheduled-calls'
    },
    {
      icon: '/icons/calendar.png',
      label: 'Match History',
      path: '/volunteer/dashboard/match-history',
      isActive: currentPath === '/volunteer/dashboard/match-history'
    },
    {
      icon: '/icons/info.png',
      label: 'FAQs',
      path: '/volunteer/dashboard/faqs',
      isActive: currentPath === '/volunteer/dashboard/faqs'
    }
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
        <Box mb={0} w="100%" display="flex" alignItems="center" justifyContent="center">
          <Image 
            src="/logo.png" 
            alt="Leukemia & Lymphoma Society of Canada" 
            width="220px"
            height="150px"
            objectFit="contain"
            onError={(e) => {
              console.log('Logo failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
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
                bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#F1F5F9'
              }}
              _active={{
                bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#E2E8F0'
              }}
            >
              <HStack gap="8px" align="center">
                {item.icon && (
                  <Image 
                    src={item.icon} 
                    alt={item.label} 
                    w="14px" 
                    h="14px"
                  />
                )}
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
      >
        <UserAvatar
          initials={userInitials}
          size="64px"
          bgColor="rgba(179, 206, 209, 0.3)"
          textColor="#056067"
          fontSize="1.5rem"
          fontWeight={500}
          onClick={() => handleNavigation('/volunteer/dashboard/edit-profile')}
        />
      </Box>

      {/* Main Content centered */}
      <Box display="flex" justifyContent="center" w="100%" mt="80px">
        <Box w="711px">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 