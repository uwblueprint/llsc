import React from 'react';
import {
  Box,
} from '@chakra-ui/react';
import { Field } from '@/components/ui/field';

interface ProfileDropdownProps {
  label: string;
  value: string;
  onChange: (e: any) => void;
  options: readonly { readonly value: string; readonly label: string }[];
  flex?: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  flex = "1",
}) => {
  const styledLabel = (
    <Box
      w="100%"
      h="30px"
      fontSize="1rem"
      fontWeight={600}
      lineHeight="30px"
      letterSpacing="0%"
      color="#1D3448"
      fontFamily="'Open Sans', sans-serif"
      mb={2}
    >
      {label}
    </Box>
  );

  return (
    <Field label={styledLabel} flex={flex}>
      <select
        value={value}
        onChange={onChange}
        style={{
          background: 'white',
          borderColor: '#D5D7DA',
          fontFamily: "'Open Sans', sans-serif",
          border: '1px solid #D5D7DA',
          borderRadius: '8px',
          height: '44px',
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingTop: '10px',
          paddingBottom: '10px',
          fontSize: '1rem',
          fontWeight: 400,
          lineHeight: '24px',
          letterSpacing: '0%',
          color: '#181D27',
          width: '100%',
          appearance: 'none',
          backgroundImage: 'url("/icons/chevron-down.png")',
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '24px 24px',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#319795';
          e.target.style.boxShadow = '0 0 0 2px rgba(49, 151, 149, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D5D7DA';
          e.target.style.boxShadow = 'none';
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
};

export default ProfileDropdown; 