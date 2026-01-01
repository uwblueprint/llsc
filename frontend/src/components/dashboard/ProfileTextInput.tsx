import React, { useState } from 'react';
import { Box, Text, Textarea, Button, Flex } from '@chakra-ui/react';
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
  edit?: boolean;
  onFocus?: () => void;
  error?: string;
  onBlur?: () => void;
  icon?: React.ReactNode;
  readOnly?: boolean;
}

const ProfileTextInput: React.FC<ProfileTextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  isTextarea = false,
  rows = 2,
  flex = '1',
  helperText,
  onFocus,
  error,
  onBlur,
  icon,
  readOnly = false,
}) => {
  const styledLabel = (
    <Box>
      <Flex align="center" gap={2} h="30px" mb={2}>
        {icon && (
          <Box display="flex" alignItems="center">
            {icon}
          </Box>
        )}
        <Box
          fontSize="1rem"
          fontWeight={600}
          lineHeight="30px"
          letterSpacing="0%"
          color="#1D3448"
          fontFamily="'Open Sans', sans-serif"
        >
          {label}
        </Box>
      </Flex>
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
    background: readOnly ? '#F6F6F6' : 'white',
    borderColor: error ? '#EF4444' : '#D5D7DA',
    fontFamily: "'Open Sans', sans-serif",
    border: `1px solid ${error ? '#EF4444' : '#D5D7DA'}`,
    borderRadius: '8px',
    paddingLeft: '14px',
    paddingRight: '14px',
    paddingTop: '10px',
    paddingBottom: '10px',
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0%',
    color: readOnly ? '#9E9E9E' : '#181D27',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    cursor: readOnly ? 'not-allowed' : 'text',
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
            e.target.style.borderColor = error ? '#EF4444' : '#319795';
            e.target.style.boxShadow = error
              ? '0 0 0 2px rgba(239, 68, 68, 0.2)'
              : '0 0 0 2px rgba(49, 151, 149, 0.2)';
            onFocus?.();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#EF4444' : '#D5D7DA';
            e.target.style.boxShadow = 'none';
            onBlur?.();
          }}
        />
        {error && (
          <Text color="#EF4444" fontSize="0.875rem" mt={1} fontFamily="'Open Sans', sans-serif">
            {error}
          </Text>
        )}
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
        readOnly={readOnly}
        style={{
          ...inputStyles,
          height: '44px',
        }}
        onFocus={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = error ? '#EF4444' : '#319795';
            e.target.style.boxShadow = error
              ? '0 0 0 2px rgba(239, 68, 68, 0.2)'
              : '0 0 0 2px rgba(49, 151, 149, 0.2)';
            onFocus?.();
          }
        }}
        onBlur={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = error ? '#EF4444' : '#D5D7DA';
            e.target.style.boxShadow = 'none';
            onBlur?.();
          }
        }}
      />
      {error && (
        <Text color="#EF4444" fontSize="0.875rem" mt={1} fontFamily="'Open Sans', sans-serif">
          {error}
        </Text>
      )}
    </Field>
  );
};

export default ProfileTextInput;
