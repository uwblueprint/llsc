import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';

interface ProfileMultiSelectDropdownProps {
  label: string;
  value: string[];
  onChange: (selectedValues: string[]) => void;
  options: { value: string; label: string }[];
  maxSelections?: number;
  flex?: string;
}

const ProfileMultiSelectDropdown: React.FC<ProfileMultiSelectDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  maxSelections = 3,
  flex = "1",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badgeContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownHeight, setDropdownHeight] = useState(44);

  const handleOptionToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : value.length < maxSelections
        ? [...value, optionValue]
        : value;
    
    onChange(newValue);
  };



  const renderSelectedBadges = () => {
    if (value.length === 0) return null;
    
    return (
      <Box ref={badgeContainerRef} display="flex" flexWrap="wrap" gap={2}>
        {value.map((selectedValue, index) => (
          <Box
            key={index}
            bg="rgba(179, 206, 209, 0.3)"
            color="#1D3448"
            px="10px"
            py="4px"
            borderRadius="16px"
            fontSize="14px"
            fontWeight={400}
            lineHeight="1.2"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
            minW="auto"
            minH="28px"
            display="flex"
            alignItems="center"
            title={selectedValue}
          >
            <Text 
              fontSize="14px"
              fontWeight={400}
              lineHeight="1.2"
              letterSpacing="0%"
              textAlign="center"
              color="#056067"
              fontFamily="'Open Sans', sans-serif"
              whiteSpace="normal"
              wordBreak="break-word"
            >
              {selectedValue}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  // Calculate dropdown height based on content
  useEffect(() => {
    if (value.length === 0) {
      setDropdownHeight(44);
      return;
    }

    // Use a timeout to ensure the DOM is updated
    const timeout = setTimeout(() => {
      if (badgeContainerRef.current) {
        const containerHeight = badgeContainerRef.current.scrollHeight;
        // Add padding (20px total: 10px top + 10px bottom)
        const calculatedHeight = Math.max(44, containerHeight + 20);
        setDropdownHeight(calculatedHeight);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Box flex={flex}>
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
      <Box position="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'white',
            borderColor: '#D5D7DA',
            fontFamily: "'Open Sans', sans-serif",
            border: '1px solid #D5D7DA',
            borderRadius: '8px',
            height: `${dropdownHeight}px`,
            paddingLeft: '14px',
            paddingRight: '40px',
            paddingTop: '10px',
            paddingBottom: '10px',
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: '24px',
            letterSpacing: '0%',
            color: '#181D27',
            width: '100%',
            textAlign: 'left',
            justifyContent: 'flex-start',
            position: 'relative',
            cursor: 'pointer',
            alignItems: dropdownHeight > 60 ? 'flex-start' : 'center',
          }}
          _hover={{
            bg: 'white',
          }}
          _active={{
            bg: 'white',
          }}
          _focus={{
            borderColor: '#319795',
            boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
          }}
        >
          {value.length > 0 ? (
            renderSelectedBadges()
          ) : (
            <Text color="#9CA3AF">
              Select diagnoses...
            </Text>
          )}
          <Box
            position="absolute"
            right="12px"
            top="50%"
            transform="translateY(-50%)"
            pointerEvents="none"
          >
            <img 
              src="/icons/chevron-down.png" 
              alt="dropdown arrow" 
              style={{ width: '24px', height: '24px' }}
            />
          </Box>
        </Button>

        {isOpen && (
          <Box
            position="absolute"
            top="100%"
            left="0"
            right="0"
            bg="white"
            border="1px solid #D5D7DA"
            borderRadius="8px"
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            zIndex={10}
            mt={1}
            py={2}
          >
            <VStack align="stretch" gap={0}>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabled = !isSelected && value.length >= maxSelections;
                
                return (
                  <HStack
                    key={option.value}
                    w="578px"
                    h="40px"
                    px="10px"
                    py="7px"
                    gap="8px"
                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
                    opacity={isDisabled ? 0.5 : 1}
                    _hover={!isDisabled ? { bg: '#F7FAFC' } : {}}
                    onClick={() => !isDisabled && handleOptionToggle(option.value)}
                    align="center"
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleOptionToggle(option.value)}
                    />
                    <Text 
                      w="329.5px"
                      h="24px"
                      fontSize="16px"
                      fontWeight={400}
                      lineHeight="24px"
                      letterSpacing="0%"
                      color="#717680"
                      fontFamily="'Open Sans', sans-serif"
                      flex={1}
                    >
                      {option.label}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
            
            <Box px={4} pt={2} mt={2} borderTop="1px solid #E2E8F0">
              <Text fontSize="xs" color="#6B7280" fontFamily="'Open Sans', sans-serif">
                You can select a maximum of {maxSelections}.
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProfileMultiSelectDropdown; 