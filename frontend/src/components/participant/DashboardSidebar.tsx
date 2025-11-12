import { Box, Flex, Image, Text, VStack } from '@chakra-ui/react';
import { FiMail, FiUser, FiLogOut } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';

interface DashboardSidebarProps {
  activeTab: 'matches' | 'contact';
  onTabChange: (tab: 'matches' | 'contact') => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const navItems = [
    { key: 'matches' as const, label: 'Matches', icon: FiUser },
    { key: 'contact' as const, label: 'Contact', icon: FiMail },
  ];

  return (
    <Box
      w={{ base: '100%', lg: '280px' }}
      flexShrink={0}
      bg="white"
      border="1px solid"
      borderColor="#E2E8F0"
      borderRadius="lg"
      p={6}
    >
      <VStack align="stretch" spacing={6}>
        {/* Logo */}
        <Box>
          <Image
            src="/llsc-logo.png"
            alt="Leukemia & Lymphoma Society of Canada"
            maxW="140px"
            objectFit="contain"
          />
        </Box>

        {/* Navigation - single light grey panel */}
        <Box
          bg="#F3F5F6"
          border="1px solid"
          borderColor="#E2E8EB"
          borderRadius="lg"
          overflow="hidden"
        >
          <VStack align="stretch" spacing={0}>
            {navItems.map((item) => {
              const isActive = item.key === activeTab;

              return (
                <Flex
                  key={item.key}
                  align="center"
                  gap={3}
                  px={5}
                  py={3}
                  role="button"
                  cursor="pointer"
                  bg={isActive ? '#B3CED14D' : 'transparent'}
                  color={isActive ? '#3538CD' : '#697380'}
                  _hover={{
                    bg: isActive ? '#B3CED14D' : '#E5E7EB',
                  }}
                  onClick={() => onTabChange(item.key)}
                >
                  <Icon as={item.icon} boxSize={4} />
                  <Text fontWeight={isActive ? '600' : '500'} fontSize="sm">
                    {item.label}
                  </Text>
                </Flex>
              );
            })}

            {/* Sign Out - in same panel */}
            <Flex
              align="center"
              gap={3}
              px={5}
              py={3}
              color="#697380"
              cursor="pointer"
              fontWeight="500"
              _hover={{
                bg: '#E5E7EB',
              }}
            >
              <Icon as={FiLogOut} boxSize={4} />
              <Text fontSize="sm">Sign Out</Text>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
