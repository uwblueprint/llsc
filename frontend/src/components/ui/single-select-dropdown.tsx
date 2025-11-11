import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

interface SingleSelectDropdownProps {
  options: string[];
  selectedValue: string;
  onSelectionChange: (value: string) => void;
  placeholder: string;
  error?: boolean;
}

export const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  options,
  selectedValue,
  onSelectionChange,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onSelectionChange(option);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange('');
  };

  return (
    <Box position="relative" w="full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          minHeight: '40px',
          padding: selectedValue ? '4px 12px' : '0 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: COLORS.veniceBlue,
          textAlign: 'left',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          gap: '8px',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.teal;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.teal}20`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }}
      >
        <Box display="flex" alignItems="center" flex="1" gap="8px" flexWrap="wrap" minHeight="32px">
          {selectedValue ? (
            <Box
              display="inline-flex"
              alignItems="center"
              gap="6px"
              px="10px"
              py="4px"
              bg={COLORS.lightTeal}
              borderRadius="20px"
              border={`1px solid ${COLORS.teal}`}
            >
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14px"
                color={COLORS.teal}
                fontWeight={500}
              >
                {selectedValue}
              </Text>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.teal,
                  fontSize: '14px',
                  lineHeight: '1',
                  width: '16px',
                  height: '16px',
                }}
                aria-label="Remove selection"
              >
                ×
              </button>
            </Box>
          ) : (
            <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color="#9ca3af">
              {placeholder}
            </Text>
          )}
        </Box>
        <Box as="span" fontSize="12px" color="#9ca3af" ml="8px" flexShrink={0}>
          {isOpen ? '▲' : '▼'}
        </Box>
      </button>

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          bg="white"
          border="1px solid #d1d5db"
          borderRadius="6px"
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          zIndex={9999}
        >
          {options.map((option) => (
            <Box
              key={option}
              px={3}
              py={2}
              display="flex"
              alignItems="center"
              gap={2}
              bg={selectedValue === option ? COLORS.lightTeal : 'transparent'}
              _hover={{ bg: selectedValue === option ? COLORS.lightTeal : '#f9fafb' }}
              cursor="pointer"
              onClick={() => handleSelect(option)}
              borderBottom="1px solid #f3f4f6"
              _last={{ borderBottom: 'none' }}
            >
              <input
                type="checkbox"
                checked={selectedValue === option}
                readOnly
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  pointerEvents: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  border:
                    selectedValue === option ? `1px solid ${COLORS.teal}` : '1px solid #d1d5db',
                  borderRadius: '3px',
                  backgroundColor: selectedValue === option ? COLORS.teal : 'white',
                  backgroundImage:
                    selectedValue === option
                      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M10 3L4.5 8.5L2 6l1.5-1.5L4.5 6L8.5 2L10 3z'/%3E%3C/svg%3E\")"
                      : 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: '12px 12px',
                }}
              />
              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14px"
                color={COLORS.veniceBlue}
                cursor="pointer"
                flex="1"
                fontWeight={selectedValue === option ? 500 : 400}
              >
                {option}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
