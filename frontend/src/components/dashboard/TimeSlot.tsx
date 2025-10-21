import React from 'react';
import { Box } from '@chakra-ui/react';
import { TimeSlotProps } from './types';

const TimeSlot: React.FC<TimeSlotProps> = ({
  isSelected,
  onClick,
  isLastColumn = false,
}) => {
  return (
    <Box
      h="50px"
      borderTop="1px solid"
      borderRight={!isLastColumn ? "1px solid" : "none"}
      borderColor="gray.200"
      bg={isSelected ? 'rgba(255, 187, 138, 0.2)' : 'transparent'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: isSelected ? 'rgba(255, 187, 138, 0.2)' : 'gray.100',
      }}
      onClick={onClick}
      position="relative"
    >
      {/* Visual indicator for selected state */}
      {isSelected && (
        <Box
          position="absolute"
          inset={1}
          bg="rgba(255, 187, 138, 0.2)"
          borderRadius="sm"
          opacity={0.7}
        />
      )}
    </Box>
  );
};

export default TimeSlot; 