import React, { useEffect, useState } from 'react';
import { Box, Input } from '@chakra-ui/react';
import { FormField } from '@/components/ui/form-field';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import { InputGroup } from '@/components/ui/input-group';
import { GENDER_IDENTITY_OPTIONS } from '@/constants/form';
import { deriveGenderSelection } from '@/utils/adminFormHelpers/intake';
import { INPUT_STYLES } from './shared';

interface GenderIdentityFieldProps {
  label?: string;
  customLabel?: string;
  placeholder?: string;
  customPlaceholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const GenderIdentityField: React.FC<GenderIdentityFieldProps> = ({
  label = 'Gender Identity',
  customLabel = 'Please specify',
  placeholder = 'Gender identity',
  customPlaceholder = 'Custom gender identity',
  value,
  onChange,
}) => {
  const [selection, setSelection] = useState(() => deriveGenderSelection(value));

  useEffect(() => {
    setSelection(deriveGenderSelection(value));
  }, [value]);

  const handleSelectionChange = (nextSelection: string) => {
    setSelection(nextSelection);
    if (nextSelection === 'Self-describe') {
      const isPreset =
        value &&
        (GENDER_IDENTITY_OPTIONS as readonly string[]).includes(
          value as (typeof GENDER_IDENTITY_OPTIONS)[number],
        );
      if (!value || isPreset) {
        onChange('');
      }
      return;
    }

    onChange(nextSelection);
  };

  const customValue = selection === 'Self-describe' ? value : '';

  return (
    <>
      <Box flex="1" minW="260px">
        <FormField label={label}>
          <SingleSelectDropdown
            options={[...GENDER_IDENTITY_OPTIONS]}
            selectedValue={selection}
            allowClear={false}
            onSelectionChange={handleSelectionChange}
            placeholder={placeholder}
          />
        </FormField>
      </Box>
      {selection === 'Self-describe' && (
        <Box flex="1" minW="260px">
          <FormField label={customLabel}>
            <InputGroup>
              <Input
                {...INPUT_STYLES}
                placeholder={customPlaceholder}
                value={customValue}
                onChange={(event) => onChange(event.target.value)}
              />
            </InputGroup>
          </FormField>
        </Box>
      )}
    </>
  );
};
