'use client';

import React from 'react';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import { Avatar } from '@/components/ui/avatar';

interface MobileHeaderProps {
  userName: string;
  onMenuOpen: () => void;
  onAvatarClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  userName,
  onMenuOpen,
  onAvatarClick,
}) => {
  return (
    <Flex
      w="100%"
      h="56px"
      px={4}
      align="center"
      justify="space-between"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.100"
      position="sticky"
      top={0}
      zIndex={10}
    >
      {/* Hamburger Menu Button */}
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        size="lg"
        onClick={onMenuOpen}
        color="#1D3448"
        _hover={{ bg: 'gray.100' }}
      >
        <FiMenu size={24} />
      </IconButton>

      {/* User Avatar */}
      <Box
        cursor={onAvatarClick ? 'pointer' : 'default'}
        onClick={onAvatarClick}
        _hover={onAvatarClick ? { opacity: 0.8 } : undefined}
        transition="opacity 0.2s"
      >
        <Avatar
          name={userName}
          size="md"
          bg="rgba(179, 206, 209, 0.3)"
          color="#056067"
          fontWeight={500}
        />
      </Box>
    </Flex>
  );
};

export default MobileHeader;
