import React from 'react';
import { Box, Text, HStack, Input } from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { COLORS } from '@/constants/form';

export interface CheckboxGroupProps {
  options: string[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  maxSelections: number;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValues,
  onValueChange,
  maxSelections,
  showOther = false,
  otherValue = '',
  onOtherChange,
}) => {
  const handleCheckboxChange = (option: string) => {
    if (selectedValues.includes(option)) {
      onValueChange(selectedValues.filter((item) => item !== option));
    } else if (selectedValues.length < maxSelections) {
      onValueChange([...selectedValues, option]);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {options.map((option) => (
        <Checkbox
          key={option}
          checked={selectedValues.includes(option)}
          onChange={() => handleCheckboxChange(option)}
          disabled={!selectedValues.includes(option) && selectedValues.length >= maxSelections}
          colorScheme="teal"
        >
          <Text fontSize="14px" color={COLORS.veniceBlue}>
            {option}
          </Text>
        </Checkbox>
      ))}

      {showOther && (
        <HStack w="full">
          <Checkbox
            checked={selectedValues.includes('other')}
            onChange={() => handleCheckboxChange('other')}
            disabled={!selectedValues.includes('other') && selectedValues.length >= maxSelections}
            colorScheme="teal"
          >
            <Text fontSize="14px" color={COLORS.veniceBlue} mr={2}>
              Other:
            </Text>
          </Checkbox>
          <Input
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder=""
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color={COLORS.veniceBlue}
            borderColor="#d1d5db"
            borderRadius="6px"
            h="32px"
            maxW="200px"
            _placeholder={{ color: '#9ca3af' }}
            _focus={{ borderColor: COLORS.teal, boxShadow: `0 0 0 3px ${COLORS.teal}20` }}
            disabled={!selectedValues.includes('other')}
          />
        </HStack>
      )}
    </Box>
  );
};
