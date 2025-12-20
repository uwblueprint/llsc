import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { FiUserPlus } from 'react-icons/fi';
import { Task, Admin } from '@/types/adminTypes';
import { getTypeColor, getPriorityColor } from '@/utils/taskHelpers';
import { gray300, textPrimary, black } from '@/constants/colors';
import { getParticipantLink } from '@/utils/taskLinkHelpers';
import Link from 'next/link';

interface TaskRowProps {
  task: Task;
  onCheck: (id: string) => void;
  onTaskClick: (task: Task) => void;
  admins: Admin[];
  showTypeColumn?: boolean;
  showDivider?: boolean;
}

const getAdminByName = (name: string, admins: Admin[]): Admin | undefined => {
  return admins.find((admin) => admin.name === name);
};

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onCheck,
  onTaskClick,
  admins,
  showTypeColumn = true,
  showDivider = false,
}) => {
  return (
    <>
      <Flex align="center" gap="0" py="10px" cursor="pointer" onClick={() => onTaskClick(task)}>
        {/* Name with Checkbox */}
        <Flex align="center" gap="18px" flex="1 0 280px">
          <Box onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={task.completed} onCheckedChange={() => onCheck(task.id)} />
          </Box>
          {task.participantId ? (
            <Link
              href={getParticipantLink(task)}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: 'none' }}
            >
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="20px"
                color={textPrimary}
                _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                {task.name}
              </Text>
            </Link>
          ) : (
            <Text
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              fontSize="20px"
              color={textPrimary}
            >
              {task.name}
            </Text>
          )}
        </Flex>

        {/* Type Badge (conditional) */}
        {showTypeColumn && (
          <Box flex="1 0 260px">
            <Box
              bg={getTypeColor(task.type).bg}
              color={getTypeColor(task.type).color}
              px="14px"
              py="6px"
              borderRadius="16px"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              fontSize="16px"
              display="inline-block"
            >
              {task.type}
            </Box>
          </Box>
        )}

        {/* Start Date */}
        <Flex flex="0.8 0 160px">
          <Text
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="20px"
            color={textPrimary}
          >
            {task.startDate}
          </Text>
        </Flex>

        {/* End Date */}
        <Flex flex="0.8 0 160px">
          <Text
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="20px"
            color={textPrimary}
          >
            {task.endDate}
          </Text>
        </Flex>

        {/* Priority Badge */}
        <Flex flex={showTypeColumn ? '0.7 0 140px' : '0.8 0 160px'}>
          <Box
            bg={getPriorityColor(task.priority).bg}
            color={getPriorityColor(task.priority).color}
            px="14px"
            py="6px"
            borderRadius="16px"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="16px"
            display="inline-block"
          >
            {task.priority}
          </Box>
        </Flex>

        {/* Assignee */}
        <Flex flex="0 0 120px" justify="flex-start">
          {task.assignee ? (
            <Box
              w="31px"
              h="31px"
              bg={getAdminByName(task.assignee, admins)?.bgColor || '#F4F4F4'}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontFamily="Inter"
                fontWeight={600}
                fontSize="16px"
                lineHeight="1.2102272727272727em"
                letterSpacing="-1.5%"
                color={black}
              >
                {getAdminByName(task.assignee, admins)?.initial ||
                  task.assignee.charAt(0).toUpperCase()}
              </Text>
            </Box>
          ) : (
            <Box
              w="31px"
              h="31px"
              bg="#F4F4F4"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FiUserPlus size="18px" color={textPrimary} />
            </Box>
          )}
        </Flex>
      </Flex>

      {/* Optional divider */}
      {showDivider && <Box h="1px" bg={gray300} />}
    </>
  );
};
