import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';

interface DirectoryProgressSliderProps {
  value: number; // 0-100
}

export const DirectoryProgressSlider: React.FC<DirectoryProgressSliderProps> = ({ value }) => {
  const milestones = [25, 50, 75, 100];

  return (
    <Flex align="center" gap={3} w="full">
      <Box position="relative" flex="1" h="24px" display={{ base: 'none', lg: 'block' }}>
        {/* Track */}
        <Box
          position="absolute"
          top="50%"
          left="0"
          right="0"
          h="2px"
          bg="gray.300"
          transform="translateY(-50%)"
          zIndex={0}
        />

        {/* Filled Track */}
        <Box
          position="absolute"
          top="50%"
          left="0"
          h="2px"
          bg="teal.500"
          transform="translateY(-50%)"
          width={`${value}%`}
          zIndex={0}
        />

        {/* Milestone Markers */}
        <Flex
          position="absolute"
          top="50%"
          left="0"
          right="0"
          transform="translateY(-50%)"
          justify="space-between"
          align="center"
          zIndex={1}
        >
          {milestones.map((milestone) => {
            const isCompleted = value >= milestone;
            const isCurrent =
              value < milestone && value >= (milestones[milestones.indexOf(milestone) - 1] || 0);

            return (
              <Flex
                key={milestone}
                align="center"
                justify="center"
                w="16px"
                h="16px"
                borderRadius="full"
                bg={isCompleted ? 'teal.500' : 'gray.300'}
                border="3px solid white"
                boxShadow="sm"
              >
                {isCompleted && <FiCheck size={14} color="white" strokeWidth={3} />}
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* Percentage Display */}
      <Text
        fontFamily="'Open Sans', sans-serif"
        fontSize="14px"
        fontWeight={600}
        lineHeight="1.429em"
        color="#495D6C"
        minW="60px"
      >
        {value}%
      </Text>
    </Flex>
  );
};
