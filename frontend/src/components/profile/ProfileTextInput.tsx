import React from 'react';
import {
  Box,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Field } from '@/components/ui/field';

interface ProfileTextInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isTextarea?: boolean;
  rows?: number;
  flex?: string;
  helperText?: string;
}

const ProfileTextInput: React.FC<ProfileTextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  isTextarea = false,
  rows = 2,
  flex = "1",
  helperText,
}) => {
  const styledLabel = (
    <Box>
      <Box
        w="100%"
        h="30px"
        fontSize="1rem"
        fontWeight={600}
        lineHeight="30px"
        letterSpacing="0%"
        color="#1D3448"
        fontFamily="'Open Sans', sans-serif"
      >
        {label}
      </Box>
      {helperText && (
        <Text 
          w="580px"
          h="22px"
          fontSize="16px" 
          fontWeight={400}
          lineHeight="100%"
          letterSpacing="0%"
          color="#495D6C" 
          fontFamily="'Open Sans', sans-serif" 
          mt={1} 
          mb={2}
        >
          {helperText}
        </Text>
      )}
    </Box>
  );

  const inputStyles = {
    background: 'white',
    borderColor: '#D5D7DA',
    fontFamily: "'Open Sans', sans-serif",
    border: '1px solid #D5D7DA',
    borderRadius: '8px',
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
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  if (isTextarea) {
    return (
      <Field label={styledLabel} flex={flex}>
        <Textarea
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          rows={rows}
          style={{
            ...inputStyles,
            resize: 'vertical',
            minHeight: `${rows * 20 + 24}px`,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#319795';
            e.target.style.boxShadow = '0 0 0 2px rgba(49, 151, 149, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D5D7DA';
            e.target.style.boxShadow = 'none';
          }}
        />
      </Field>
    );
  }

  return (
    <Field label={styledLabel} flex={flex}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...inputStyles,
          height: '44px',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#319795';
          e.target.style.boxShadow = '0 0 0 2px rgba(49, 151, 149, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D5D7DA';
          e.target.style.boxShadow = 'none';
        }}
      />
    </Field>
  );
};

export default ProfileTextInput; 