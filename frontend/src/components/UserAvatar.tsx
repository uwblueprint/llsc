import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

interface UserAvatarProps {
  initials: string;
  size?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: number;
  onClick?: () => void;
  opacity?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  initials,
  size = "90px",
  bgColor = "#F4F4F4",
  textColor = "#000000",
  fontSize = "36.52px",
  fontWeight = 600,
  onClick,
  opacity = 1
}) => {
  return (
    <Box
      w={size}
      h={size}
      bg={bgColor}
      borderRadius="50%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor={onClick ? "pointer" : "default"}
      opacity={opacity}
      onClick={onClick}
      py="16.36px"
      px="12.27px"
      _hover={onClick ? {
        opacity: 0.8
      } : {}}
    >
      <Text 
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={textColor}
        className={inter.className}
        lineHeight="100%"
        letterSpacing="-1.5%"
      >
        {initials}
      </Text>
    </Box>
  );
};

export default UserAvatar; 