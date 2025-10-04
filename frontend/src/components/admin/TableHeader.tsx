import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { LabelBold } from '@/components/ui/text-styles';
import { gray300, headerText } from '@/constants/colors';

interface TableHeaderProps {
  showTypeColumn?: boolean;
  sortColumn: 'name' | 'startDate' | 'endDate' | 'priority' | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: 'name' | 'startDate' | 'endDate' | 'priority') => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  showTypeColumn = true,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <Box mb="18px">
      <Flex align="center" gap="0" px="0" pb="18px" w="full">
        {/* Name Column Header */}
        <Flex
          align="center"
          gap="6px"
          flex="1 0 280px"
          cursor="pointer"
          onClick={() => onSort('name')}
          _hover={{ opacity: 0.7 }}
        >
          <LabelBold color={headerText}>Name</LabelBold>
          {sortColumn === 'name' ? (
            sortDirection === 'asc' ? (
              <FiChevronUp size="16px" color={headerText} />
            ) : (
              <FiChevronDown size="16px" color={headerText} />
            )
          ) : (
            <FiChevronDown size="16px" color={headerText} opacity={0.3} />
          )}
        </Flex>

        {/* Type Column Header (conditional) */}
        {showTypeColumn && (
          <Flex align="center" gap="6px" flex="1 0 260px">
            <LabelBold color={headerText}>Type</LabelBold>
          </Flex>
        )}

        {/* Start Date Column Header */}
        <Flex
          align="center"
          gap="6px"
          flex="0.8 0 160px"
          cursor="pointer"
          onClick={() => onSort('startDate')}
          _hover={{ opacity: 0.7 }}
        >
          <LabelBold color={headerText}>Start Date</LabelBold>
          {sortColumn === 'startDate' ? (
            sortDirection === 'asc' ? (
              <FiChevronUp size="16px" color={headerText} />
            ) : (
              <FiChevronDown size="16px" color={headerText} />
            )
          ) : (
            <FiChevronDown size="16px" color={headerText} opacity={0.3} />
          )}
        </Flex>

        {/* End Date Column Header */}
        <Flex
          align="center"
          gap="6px"
          flex="0.8 0 160px"
          cursor="pointer"
          onClick={() => onSort('endDate')}
          _hover={{ opacity: 0.7 }}
        >
          <LabelBold color={headerText}>End Date</LabelBold>
          {sortColumn === 'endDate' ? (
            sortDirection === 'asc' ? (
              <FiChevronUp size="16px" color={headerText} />
            ) : (
              <FiChevronDown size="16px" color={headerText} />
            )
          ) : (
            <FiChevronDown size="16px" color={headerText} opacity={0.3} />
          )}
        </Flex>

        {/* Priority Column Header */}
        <Flex
          align="center"
          gap="6px"
          flex={showTypeColumn ? '0.7 0 140px' : '0.8 0 160px'}
          cursor="pointer"
          onClick={() => onSort('priority')}
          _hover={{ opacity: 0.7 }}
        >
          <LabelBold color={headerText}>Priority</LabelBold>
          {sortColumn === 'priority' ? (
            sortDirection === 'asc' ? (
              <FiChevronUp size="16px" color={headerText} />
            ) : (
              <FiChevronDown size="16px" color={headerText} />
            )
          ) : (
            <FiChevronDown size="16px" color={headerText} opacity={0.3} />
          )}
        </Flex>

        {/* Assignee Column Header */}
        <Flex align="center" gap="6px" flex="0 0 120px">
          <LabelBold color={headerText}>Assignee</LabelBold>
        </Flex>
      </Flex>
      <Box h="1px" bg={gray300} />
    </Box>
  );
};
