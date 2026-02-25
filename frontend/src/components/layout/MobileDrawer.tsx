'use client';

import React from 'react';
import { Box, VStack, HStack, Text, Image, Button, Separator } from '@chakra-ui/react';
import { FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerCloseTrigger,
  DrawerBody,
} from '@/components/ui/drawer';
import { Avatar } from '@/components/ui/avatar';
import { logout } from '@/APIClients/authAPIClient';

export interface NavItem {
  label: string;
  icon?: string;
  path: string;
  isActive: boolean;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  navItems: NavItem[];
  onEditProfile?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  userName,
  navItems,
  onEditProfile,
}) => {
  const t = useTranslations('dashboard');
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  const handleProfileClick = () => {
    if (onEditProfile) {
      onEditProfile();
      onClose();
    }
  };

  return (
    <DrawerRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="start">
      <DrawerBackdrop />
      <DrawerContent maxW="280px" bg="white">
        <DrawerCloseTrigger />
        <DrawerBody p={0}>
          <VStack align="stretch" h="100%" gap={0}>
            {/* User Profile Section */}
            <Box
              px={4}
              py={6}
              cursor={onEditProfile ? 'pointer' : 'default'}
              onClick={handleProfileClick}
              _hover={onEditProfile ? { bg: 'gray.50' } : undefined}
              transition="background 0.2s"
            >
              <HStack gap={3}>
                <Avatar
                  name={userName}
                  size="lg"
                  bg="rgba(179, 206, 209, 0.3)"
                  color="#056067"
                  fontWeight={500}
                />
                <Text
                  fontSize="16px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                >
                  {userName}
                </Text>
              </HStack>
            </Box>

            <Separator />

            {/* Navigation Items */}
            <VStack align="stretch" gap={1} px={2} py={4} flex={1}>
              {navItems.map((item) => (
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
                  px={3}
                  py={2}
                  borderRadius="6px"
                  _hover={{
                    bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#F1F5F9',
                  }}
                  _active={{
                    bg: item.isActive ? 'rgba(179, 206, 209, 0.3)' : '#E2E8F0',
                  }}
                >
                  <HStack gap={3} align="center">
                    {item.icon && <Image src={item.icon} alt={item.label} w="18px" h="18px" />}
                    <Text>{item.label}</Text>
                  </HStack>
                </Button>
              ))}
            </VStack>

            {/* Sign Out Button - At Bottom */}
            <Box px={2} pb={6}>
              <Button
                onClick={handleSignOut}
                bg="transparent"
                color="#6B7280"
                fontWeight={400}
                fontSize="14px"
                fontFamily="'Open Sans', sans-serif"
                justifyContent="flex-start"
                h="50px"
                px={3}
                py={2}
                borderRadius="6px"
                w="100%"
                _hover={{
                  bg: '#F1F5F9',
                }}
                _active={{
                  bg: '#E2E8F0',
                }}
              >
                <HStack gap={3} align="center">
                  <FiLogOut size={18} />
                  <Text>{t('signOut')}</Text>
                </HStack>
              </Button>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};

export default MobileDrawer;
