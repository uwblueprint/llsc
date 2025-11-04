import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { NavText } from '@/components/ui/text-styles';
import { gray700, divider, hoverBg, shadow } from '@/constants/colors';

type ViewMode = 'list' | 'grouped';

interface ViewDropdownProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewDropdown: React.FC<ViewDropdownProps> = ({ viewMode, onViewModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (mode: ViewMode) => {
    onViewModeChange(mode);
    setIsOpen(false);
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      <Box
        as="button"
        display="flex"
        alignItems="center"
        gap="8px"
        px="14px"
        py="14px"
        border="1px solid #E2E8F0"
        borderRadius="8px"
        bg="white"
        boxShadow={shadow.sm}
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <NavText color={gray700}>View</NavText>
        {isOpen ? (
          <FiChevronUp size="20px" color={gray700} />
        ) : (
          <FiChevronDown size="20px" color={gray700} />
        )}
      </Box>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          bg="white"
          border={`1px solid ${divider}`}
          borderRadius="8px"
          boxShadow={shadow.md}
          w="240px"
          zIndex={1000}
        >
          <Flex direction="column">
            {/* List option */}
            <Flex
              align="center"
              gap="12px"
              px="16px"
              py="18px"
              cursor="pointer"
              onClick={() => handleSelect('list')}
              _hover={{ bg: hoverBg }}
            >
              {viewMode === 'list' && <FiCheck size="16px" color={gray700} />}
              {viewMode !== 'list' && <Box w="16px" h="16px" />}
              <NavText color={gray700}>List</NavText>
            </Flex>

            {/* Divider */}
            <Box h="1px" bg={divider} />

            {/* Grouped option */}
            <Flex
              align="center"
              gap="12px"
              px="16px"
              py="18px"
              cursor="pointer"
              onClick={() => handleSelect('grouped')}
              _hover={{ bg: hoverBg }}
            >
              {viewMode === 'grouped' && <FiCheck size="16px" color={gray700} />}
              {viewMode !== 'grouped' && <Box w="16px" h="16px" />}
              <NavText color={gray700}>Grouped</NavText>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
