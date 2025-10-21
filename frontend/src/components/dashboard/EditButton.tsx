import React from 'react';
import { Button } from '@chakra-ui/react';

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, children }) => {
  return (
    <Button
      onClick={onClick}
      w="hug"
      h="36px"
      px="18px"
      py="8px"
      borderRadius="8px"
      border="1px solid"
      borderColor="#056067"
      bg="#056067"
      color="white"
      fontSize="14px"
      fontWeight={500}
      fontFamily="'Open Sans', sans-serif"
      gap="8px"
      boxShadow="0 1px 2px 0 rgba(0, 173, 18, 0.05)"
      _hover={{
        bg: "#044d4d",
        borderColor: "#044d4d"
      }}
      _active={{
        bg: "#033d3d",
        borderColor: "#033d3d"
      }}
      _focus={{
        outline: "none",
        boxShadow: "0 0 0 2px rgba(5, 96, 103, 0.2)"
      }}
    >
      {children}
    </Button>
  );
};

export default ActionButton; 