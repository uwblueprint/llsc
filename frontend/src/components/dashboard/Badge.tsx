import React from 'react';
import { Box, Text, HStack, Image } from '@chakra-ui/react';

interface BadgeProps {
  icon?: React.ReactNode | string;
  iconSrc?: string;
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
}

const Badge: React.FC<BadgeProps> = ({
  icon,
  iconSrc,
  children,
  bgColor = 'rgba(179, 206, 209, 0.3)',
  textColor = '#056067',
}) => {
  return (
    <Box
      bg={bgColor}
      borderRadius="16px"
      py="4px"
      pl="12px"
      pr="10px"
      display="inline-flex"
      alignItems="center"
      gap="4px"
      height="28px"
      minW="fit-content"
    >
      <HStack gap="4px" align="center">
        {iconSrc ? (
          <Image src={iconSrc} alt="" w="12px" h="12px" />
        ) : (
          icon && <Box fontSize="0.75rem">{icon}</Box>
        )}
        <Text
          fontSize="0.875rem"
          color={textColor}
          fontFamily="'Open Sans', sans-serif"
          fontWeight={400}
          lineHeight="100%"
          whiteSpace="nowrap"
        >
          {children}
        </Text>
      </HStack>
    </Box>
  );
};

export default Badge;
