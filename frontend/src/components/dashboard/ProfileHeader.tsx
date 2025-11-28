import React from 'react';
import { Heading } from '@chakra-ui/react';

interface ProfileHeaderProps {
  children: React.ReactNode;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ children }) => {
  return (
    <Heading
      w="519px"
      h="40px"
      fontSize="1.625rem"
      fontWeight={600}
      lineHeight="40px"
      letterSpacing="0%"
      color="#1D3448"
      fontFamily="'Open Sans', sans-serif"
      mb="16px"
    >
      {children}
    </Heading>
  );
};

export default ProfileHeader;
