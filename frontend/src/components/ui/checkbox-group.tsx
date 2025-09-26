import React from 'react';
import { Box, Text, HStack, Input } from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { COLORS } from '@/constants/form';

export interface CheckboxGroupProps {
  options: string[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  maxSelections: number;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValues,
  onValueChange,
  maxSelections,
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
    </Box>
  );
};
