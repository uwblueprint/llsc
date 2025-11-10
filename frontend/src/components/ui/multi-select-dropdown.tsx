import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { COLORS } from '@/constants/form';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  error?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
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

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter((val) => val !== option));
    }
  };

  const handleRemoveChip = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    onSelectionChange(selectedValues.filter((val) => val !== option));
  };

  return (
    <Box position="relative" w="full" ref={dropdownRef} zIndex={1}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          minHeight: '40px',
          padding: selectedValues.length > 0 ? '4px 12px' : '0 12px',
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
        <Box
          display="flex"
          alignItems="center"
          flex="1"
          gap="8px"
          flexWrap="wrap"
          minHeight="32px"
        >
          {selectedValues.length > 0 ? (
            selectedValues.map((value) => (
              <Box
                key={value}
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
                  {value}
                </Text>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(e, value)}
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
                  aria-label={`Remove ${value}`}
                >
                  ×
                </button>
              </Box>
            ))
          ) : (
            <Text
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="14px"
              color="#9ca3af"
            >
              {placeholder}
            </Text>
          )}
        </Box>
        <Box
          as="span"
          fontSize="12px"
          color="#9ca3af"
          ml="8px"
          flexShrink={0}
        >
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
          zIndex={1000}
        >
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <Box
                key={option}
                px={3}
                py={2}
                display="flex"
                alignItems="center"
                gap={2}
                bg={isSelected ? COLORS.lightTeal : 'transparent'}
                _hover={{ bg: isSelected ? COLORS.lightTeal : '#f9fafb' }}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(option, !isSelected);
                }}
                borderBottom="1px solid #f3f4f6"
                _last={{ borderBottom: 'none' }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    pointerEvents: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    border: isSelected ? `1px solid ${COLORS.teal}` : '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: isSelected ? COLORS.teal : 'white',
                    backgroundImage: isSelected
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
                  fontWeight={isSelected ? 500 : 400}
                >
                  {option}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
