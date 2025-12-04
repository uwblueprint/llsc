import { Box, Button, HStack, Image, Text, VStack, Icon } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiLogOut } from 'react-icons/fi';
import { logout } from '@/APIClients/authAPIClient';

export function DashboardSidebar() {
  const router = useRouter();
  const currentPath = router.asPath;

  const navItems = [
    {
      label: 'Matches',
      icon: '/icons/user-primary.png',
      path: '/participant/dashboard',
      isActive: currentPath === '/participant/dashboard',
    },
    {
      label: 'Contact',
      icon: '/icons/calendar.png',
      path: '/participant/dashboard/contact',
      isActive: currentPath === '/participant/dashboard/contact',
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <Box
      w={{ base: '100%', lg: '279px' }}
      flexShrink={0}
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

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          bg="transparent"
          color="#6B7280"
          fontWeight={400}
          fontSize="14px"
          fontFamily="'Open Sans', sans-serif"
          justifyContent="flex-start"
          h="50px"
          px="12px"
          py="8px"
          borderRadius="6px"
          _hover={{
            bg: '#F1F5F9',
          }}
          _active={{
            bg: '#E2E8F0',
          }}
        >
          <HStack gap="8px" align="center">
            <Icon as={FiLogOut} w="14px" h="14px" />
            <Text>Sign Out</Text>
          </HStack>
        </Button>
      </VStack>
    </Box>
  );
}
