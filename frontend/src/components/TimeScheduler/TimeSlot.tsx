import React from 'react';
import { Box } from '@chakra-ui/react';
import { TimeSlotProps } from './types';

const TimeSlot: React.FC<TimeSlotProps> = ({
  day,
  hour,
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
      bg={isSelected ? 'orange.200' : 'transparent'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: isSelected ? 'orange.300' : 'gray.100',
      }}
      onClick={onClick}
      position="relative"
    >
      {/* Visual indicator for selected state */}
      {isSelected && (
        <Box
          position="absolute"
          inset={1}
          bg="orange.400"
          borderRadius="sm"
          opacity={0.7}
        />
      )}
    </Box>
  );
};

export default TimeSlot; 