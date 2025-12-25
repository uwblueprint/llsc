'use client';

import { Box, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface RadioOption {
  value: string;
  label: ReactNode;
}

interface CustomRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
}

export function CustomRadioGroup({ value, onChange, options }: CustomRadioGroupProps) {
  return (
    <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 4, sm: 10 }} mb={6}>
      {options.map((option) => (
        <Flex
          key={option.value}
          align="center"
          gap={2}
          cursor="pointer"
          fontSize="sm"
          color="brand.fieldText"
          fontWeight={600}
          onClick={() => onChange(option.value)}
          _hover={{
            '& > .radio-circle': {
              borderColor: 'brand.primary',
              bg: 'rgba(5, 96, 103, 0.05)',
            },
          }}
        >
          <Box
            className="radio-circle"
            w="18px"
            h="18px"
            border="2px solid"
            borderColor={value === option.value ? 'brand.primary' : 'gray.400'}
            borderRadius="full"
            bg={value === option.value ? 'brand.primary' : 'white'}
            position="relative"
            flexShrink={0}
            transition="all 0.2s"
          >
            {value === option.value && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="6px"
                h="6px"
                bg="white"
                borderRadius="full"
              />
            )}
          </Box>
          {option.label}
        </Flex>
      ))}
    </Flex>
  );
}
