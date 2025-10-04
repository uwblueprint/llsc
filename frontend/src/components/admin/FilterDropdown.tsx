import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';
import { Checkbox } from '@/components/ui/checkbox';
import { NavText, LabelSmall } from '@/components/ui/text-styles';
import {
  textPrimary,
  borderLightGray,
  borderTopGray,
  teal,
  tealDarker,
  hoverBg,
  shadow,
} from '@/constants/colors';

interface FilterState {
  participant: boolean;
  volunteer: boolean;
  high: boolean;
  medium: boolean;
  low: boolean;
  noStatus: boolean;
}

interface FilterDropdownProps {
  appliedFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  appliedFilters,
  onApplyFilters,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(appliedFilters);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const handleFilterChange = (filterName: keyof FilterState) => {
    setTempFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const handleApply = () => {
    onApplyFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleClearAll = () => {
    const clearedFilters: FilterState = {
      participant: false,
      volunteer: false,
      high: false,
      medium: false,
      low: false,
      noStatus: false,
    };
    setTempFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    setIsFilterOpen(false);
  };

  return (
    <Box position="relative" ref={filterRef}>
      <Flex
        align="center"
        gap="8px"
        cursor="pointer"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <FiFilter size="24px" color={textPrimary} />
        <NavText color={textPrimary}>Filter</NavText>
      </Flex>

      {isFilterOpen && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          right="0"
          bg="white"
          border={`1px solid ${borderLightGray}`}
          borderRadius="8px"
          boxShadow={shadow.filter}
          w="240px"
          zIndex={100}
        >
          <Flex direction="column">
            {/* 1. User type - Title with gap */}
            <Flex px="16px" py="10px" gap="12px">
              <LabelSmall color="Gray/700">User type</LabelSmall>
            </Flex>

            {/* 2. Participant - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.participant}
                onCheckedChange={() => handleFilterChange('participant')}
              />
              <LabelSmall color="Gray/700">Participant</LabelSmall>
            </Flex>

            {/* 3. Volunteer - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.volunteer}
                onCheckedChange={() => handleFilterChange('volunteer')}
              />
              <LabelSmall color="Gray/700">Volunteer</LabelSmall>
            </Flex>

            {/* 4. Status - Title with top border and gap */}
            <Flex px="16px" py="10px" gap="12px" borderTop={`2px solid ${borderTopGray}`}>
              <LabelSmall color="Gray/700">Status</LabelSmall>
            </Flex>

            {/* 5. High - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.high}
                onCheckedChange={() => handleFilterChange('high')}
              />
              <LabelSmall color="Gray/700">High</LabelSmall>
            </Flex>

            {/* 6. Medium - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.medium}
                onCheckedChange={() => handleFilterChange('medium')}
              />
              <LabelSmall color="Gray/700">Medium</LabelSmall>
            </Flex>

            {/* 7. Low - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.low}
                onCheckedChange={() => handleFilterChange('low')}
              />
              <LabelSmall color="Gray/700">Low</LabelSmall>
            </Flex>

            {/* 8. No status - Checkbox item */}
            <Flex px="16px" py="10px" gap="12px" align="center">
              <Checkbox
                checked={tempFilters.noStatus}
                onCheckedChange={() => handleFilterChange('noStatus')}
              />
              <LabelSmall color="Gray/700">No status</LabelSmall>
            </Flex>

            {/* 9. Apply Button - Green box with white border */}
            <Flex
              as="button"
              w="240px"
              h="40px"
              bg={teal}
              color="white"
              border="6px solid white"
              borderRadius="12px"
              px="16px"
              py="10px"
              cursor="pointer"
              onClick={handleApply}
              alignItems="center"
              justifyContent="center"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              fontSize="14px"
              lineHeight="1.4285714285714286em"
              _hover={{ bg: tealDarker }}
            >
              Apply
            </Flex>

            {/* 10. Clear all Button */}
            <Flex
              as="button"
              w="240px"
              h="40px"
              bg="white"
              px="16px"
              py="10px"
              cursor="pointer"
              onClick={handleClearAll}
              alignItems="center"
              justifyContent="center"
              _hover={{ bg: hoverBg }}
            >
              <LabelSmall color={textPrimary}>Clear all</LabelSmall>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
