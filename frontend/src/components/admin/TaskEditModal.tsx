import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import { FiX, FiChevronRight, FiTag, FiClock, FiFlag, FiUser, FiCheckCircle } from 'react-icons/fi';
import { Checkbox } from '@/components/ui/checkbox';
import { getTypeColor, getPriorityColor } from '@/utils/taskHelpers';
import { getParticipantLink } from '@/utils/taskLinkHelpers';
import { Admin, Task, categoryLabels } from '@/types/adminTypes';
import Link from 'next/link';
import {
  bgOverlay,
  white,
  textSecondary,
  lightGray,
  divider,
  black,
  veniceBlue,
  textPrimary,
  borderLightGray,
  hoverBg,
  textMuted,
  tealBlue,
  shadow,
} from '@/constants/colors';
import 'react-datepicker/dist/react-datepicker.css';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateField: (
    taskId: string,
    field: string | number | symbol,
    value: string | boolean,
  ) => Promise<void>;
  admins: Admin[];
  currentUser: Admin | null;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateField,
  admins,
  currentUser,
}) => {
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to determine which tab a task belongs to
  const getTaskTab = (task: Task): string => {
    if (task.completed) {
      return 'Completed';
    }
    if (!task.assignee) {
      return 'Unassigned';
    }
    if (currentUser && task.assignee === currentUser.name) {
      return 'My Tasks';
    }
    return 'Team Tasks';
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!task) return null;

  const parseDateString = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    // Convert 2-digit year to 4-digit (25 -> 2025)
    const fullYear = year < 100 ? 2000 + year : year;
    return new Date(fullYear, month - 1, day);
  };

  const formatDateString = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year
    return `${day}/${month}/${year}`;
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onUpdateField(task.id, 'startDate', formatDateString(date));
      setIsStartDatePickerOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onUpdateField(task.id, 'endDate', formatDateString(date));
      setIsEndDatePickerOpen(false);
    }
  };

  const updateField = (field: keyof Task, value: Task[keyof Task]) => {
    if (value !== undefined) {
      onUpdateField(task.id, field, value);
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg={bgOverlay}
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
    >
      <Box
        ref={popupRef}
        position="relative"
        bg={white}
        w="1000px"
        maxH="737px"
        overflowY="auto"
        borderRadius="20px"
        boxShadow="0px 4px 37.20000076293945px 0px rgba(0, 0, 0, 0.06)" // Unique shadow for modal
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <Box px="30px" pt="15px" pb="15px">
          <Flex justify="space-between" align="center">
            {/* Breadcrumb */}
            <Flex align="center" gap="14px">
              <Flex align="center" gap="14px">
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="20px"
                  lineHeight="1.1em"
                  color={textSecondary}
                >
                  {getTaskTab(task)}
                </Text>
                <FiChevronRight size="24px" color={textSecondary} />
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="20px"
                  lineHeight="1.1em"
                  color={textSecondary}
                >
                  {task.type}
                </Text>
              </Flex>
            </Flex>

            {/* Close button */}
            <Box
              as="button"
              w="40px"
              h="40px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={onClose}
            >
              <FiX size="20px" color={lightGray} />
            </Box>
          </Flex>
        </Box>

        {/* Divider */}
        <Box h="3px" bg={divider} />

        {/* Popup Content */}
        <Box px="30px" py="30px">
          <Flex direction="column" gap="30px">
            {/* Task Title with Checkbox */}
            <Flex align="center" gap="18px">
              <Box onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => updateField('completed', !task.completed)}
                />
              </Box>
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="28px"
                lineHeight="1.36181640625em"
                letterSpacing="-1.5%"
                color={black}
              >
                {categoryLabels[task.category]}
              </Text>
            </Flex>

            {/* Participant Name Field */}
            <Flex align="center" gap="22px">
              <FiUser size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                Participant Name
              </Text>
              {task.participantId ? (
                <Link href={getParticipantLink(task)} style={{ textDecoration: 'none' }}>
                  <Text
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                    fontSize="22px"
                    lineHeight="1.3636363636363635em"
                    color={veniceBlue}
                    _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {task.name}
                  </Text>
                </Link>
              ) : (
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="1.3636363636363635em"
                  color={veniceBlue}
                >
                  {task.name}
                </Text>
              )}
            </Flex>

            {/* Type Field */}
            <Flex align="center" gap="22px">
              <FiTag size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                Type
              </Text>
              <Flex
                bg={getTypeColor(task.type).bg}
                color={getTypeColor(task.type).color}
                px="14px"
                py="6px"
                borderRadius="16px"
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="0.9090909090909091em"
                display="inline-flex"
                alignItems="center"
                h="36px"
              >
                {task.type}
              </Flex>
            </Flex>

            {/* Start Date Field */}
            <Flex align="center" gap="22px">
              <FiClock size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                Start Date
              </Text>
              <Box position="relative">
                <Text
                  as="button"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="1.3636363636363635em"
                  color={veniceBlue}
                  cursor="pointer"
                  onClick={() => setIsStartDatePickerOpen(!isStartDatePickerOpen)}
                  _hover={{ opacity: 0.7 }}
                >
                  {task.startDate}
                </Text>
                {isStartDatePickerOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left="0"
                    zIndex={1002}
                    css={{
                      '.react-datepicker': {
                        fontFamily: "'Open Sans', sans-serif",
                        border: '1px solid #EEEEEC',
                        borderRadius: '8px',
                        boxShadow: shadow.filter,
                        padding: '10px',
                      },
                      '.react-datepicker__header': {
                        backgroundColor: 'white',
                        borderBottom: 'none',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                      },
                      '.react-datepicker__current-month': {
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '16px',
                        fontWeight: 600,
                        color: textPrimary,
                        marginBottom: '8px',
                      },
                      '.react-datepicker__day-names': {
                        marginTop: '8px',
                      },
                      '.react-datepicker__day-name': {
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '16px',
                        color: veniceBlue,
                        width: '32px',
                        lineHeight: '32px',
                        margin: '2px',
                      },
                      '.react-datepicker__day': {
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        color: textMuted,
                        width: '32px',
                        height: '32px',
                        lineHeight: '32px',
                        margin: '2px',
                        borderRadius: '4px',
                      },
                      '.react-datepicker__day:hover': {
                        borderRadius: '4px',
                        backgroundColor: hoverBg,
                      },
                      '.react-datepicker__day--selected': {
                        backgroundColor: `${tealBlue} !important`,
                        color: 'white !important',
                        borderRadius: '50% !important',
                        fontWeight: 600,
                      },
                      '.react-datepicker__day--keyboard-selected': {
                        backgroundColor: 'transparent',
                      },
                      '.react-datepicker__day--today': {
                        fontWeight: 'normal',
                      },
                      '.react-datepicker__navigation': {
                        top: '14px',
                      },
                      '.react-datepicker__month': {
                        margin: '8px 0',
                      },
                    }}
                  >
                    <DatePicker
                      selected={parseDateString(task.startDate)}
                      onChange={handleStartDateChange}
                      onClickOutside={() => setIsStartDatePickerOpen(false)}
                      inline
                    />
                  </Box>
                )}
              </Box>
            </Flex>

            {/* End Date Field */}
            <Flex align="center" gap="22px">
              <FiClock size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                End Date
              </Text>
              <Box position="relative">
                <Text
                  as="button"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="1.3636363636363635em"
                  color={veniceBlue}
                  cursor="pointer"
                  onClick={() => setIsEndDatePickerOpen(!isEndDatePickerOpen)}
                  _hover={{ opacity: 0.7 }}
                >
                  {task.endDate}
                </Text>
                {isEndDatePickerOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left="0"
                    zIndex={1002}
                    css={{
                      '.react-datepicker': {
                        fontFamily: "'Open Sans', sans-serif",
                        border: '1px solid #EEEEEC',
                        borderRadius: '8px',
                        boxShadow: shadow.filter,
                        padding: '10px',
                      },
                      '.react-datepicker__header': {
                        backgroundColor: 'white',
                        borderBottom: 'none',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                      },
                      '.react-datepicker__current-month': {
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '16px',
                        fontWeight: 600,
                        color: textPrimary,
                        marginBottom: '8px',
                      },
                      '.react-datepicker__day-names': {
                        marginTop: '8px',
                      },
                      '.react-datepicker__day-name': {
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '16px',
                        color: veniceBlue,
                        width: '32px',
                        lineHeight: '32px',
                        margin: '2px',
                      },
                      '.react-datepicker__day': {
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        color: textMuted,
                        width: '32px',
                        height: '32px',
                        lineHeight: '32px',
                        margin: '2px',
                        borderRadius: '4px',
                      },
                      '.react-datepicker__day:hover': {
                        borderRadius: '4px',
                        backgroundColor: hoverBg,
                      },
                      '.react-datepicker__day--selected': {
                        backgroundColor: `${tealBlue} !important`,
                        color: 'white !important',
                        borderRadius: '50% !important',
                        fontWeight: 600,
                      },
                      '.react-datepicker__day--keyboard-selected': {
                        backgroundColor: 'transparent',
                      },
                      '.react-datepicker__day--today': {
                        fontWeight: 'normal',
                      },
                      '.react-datepicker__navigation': {
                        top: '14px',
                      },
                      '.react-datepicker__month': {
                        margin: '8px 0',
                      },
                    }}
                  >
                    <DatePicker
                      selected={parseDateString(task.endDate)}
                      onChange={handleEndDateChange}
                      onClickOutside={() => setIsEndDatePickerOpen(false)}
                      inline
                    />
                  </Box>
                )}
              </Box>
            </Flex>

            {/* Priority Field */}
            <Flex align="center" gap="22px">
              <FiFlag size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                Priority
              </Text>
              <Box position="relative" ref={priorityDropdownRef}>
                <Flex
                  as="button"
                  bg={getPriorityColor(task.priority).bg}
                  color={getPriorityColor(task.priority).color}
                  px="14px"
                  py="6px"
                  borderRadius="16px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="0.9090909090909091em"
                  display="inline-flex"
                  alignItems="center"
                  h="36px"
                  cursor="pointer"
                  onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                  _hover={{ opacity: 0.8 }}
                >
                  {task.priority}
                </Flex>

                {/* Priority Dropdown Menu */}
                {isPriorityDropdownOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left="0"
                    bg="white"
                    border={`1px solid ${borderLightGray}`}
                    borderRadius="8px"
                    boxShadow="0px 2px 8px 0px rgba(0, 0, 0, 0.3)"
                    w="433px"
                    zIndex={1001}
                  >
                    <Flex direction="column">
                      {/* High Priority */}
                      <Box
                        px="21px"
                        py="11px"
                        cursor="pointer"
                        onClick={() => {
                          updateField('priority', 'High');
                          setIsPriorityDropdownOpen(false);
                        }}
                        _hover={{ bg: hoverBg }}
                        borderBottom={`1px solid ${borderLightGray}`}
                      >
                        <Flex
                          bg="rgba(232, 188, 189, 0.3)"
                          color="#A70000"
                          px="14px"
                          py="6px"
                          borderRadius="16px"
                          fontFamily="'Open Sans', sans-serif"
                          fontWeight={400}
                          fontSize="22px"
                          lineHeight="0.9090909090909091em"
                          display="inline-flex"
                          alignItems="center"
                          h="36px"
                        >
                          High
                        </Flex>
                      </Box>

                      {/* Low Priority */}
                      <Box
                        px="21px"
                        py="11px"
                        cursor="pointer"
                        onClick={() => {
                          updateField('priority', 'Low');
                          setIsPriorityDropdownOpen(false);
                        }}
                        _hover={{ bg: hoverBg }}
                        borderBottom={`1px solid ${borderLightGray}`}
                      >
                        <Flex
                          bg="rgba(179, 206, 209, 0.3)"
                          color="#056067"
                          px="14px"
                          py="6px"
                          borderRadius="16px"
                          fontFamily="'Open Sans', sans-serif"
                          fontWeight={400}
                          fontSize="22px"
                          lineHeight="0.9090909090909091em"
                          display="inline-flex"
                          alignItems="center"
                          h="36px"
                        >
                          Low
                        </Flex>
                      </Box>

                      {/* Medium Priority */}
                      <Box
                        px="21px"
                        py="11px"
                        cursor="pointer"
                        onClick={() => {
                          updateField('priority', 'Medium');
                          setIsPriorityDropdownOpen(false);
                        }}
                        _hover={{ bg: hoverBg }}
                      >
                        <Flex
                          bg="#F5E9E1"
                          color="#8E4C20"
                          px="14px"
                          py="6px"
                          borderRadius="16px"
                          fontFamily="'Open Sans', sans-serif"
                          fontWeight={400}
                          fontSize="22px"
                          lineHeight="0.9090909090909091em"
                          display="inline-flex"
                          alignItems="center"
                          h="36px"
                        >
                          Medium
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Box>
            </Flex>

            {/* Assignee Field */}
            <Flex align="center" gap="22px">
              <FiCheckCircle size="24px" color={textPrimary} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={400}
                fontSize="22px"
                lineHeight="1.3636363636363635em"
                color={veniceBlue}
                w="210px"
              >
                Assignee
              </Text>
              <Box position="relative" ref={assigneeDropdownRef}>
                {task.assignee ? (
                  <Flex
                    as="button"
                    align="center"
                    gap="12px"
                    cursor="pointer"
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    _hover={{ opacity: 0.7 }}
                  >
                    <Box
                      w="39px"
                      h="39px"
                      bg={
                        admins.find((admin) => admin.name === task.assignee)?.bgColor || '#F4F4F4' // Fallback avatar color
                      }
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text
                        fontFamily="Inter"
                        fontWeight={600}
                        fontSize="22px"
                        lineHeight="1.2102272727272727em"
                        letterSpacing="-1.5%"
                        color={black}
                      >
                        {task.assignee.charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                    <Text
                      fontFamily="'Open Sans', sans-serif"
                      fontWeight={400}
                      fontSize="22px"
                      lineHeight="1.3636363636363635em"
                      color={veniceBlue}
                    >
                      {task.assignee}
                    </Text>
                  </Flex>
                ) : (
                  <Text
                    as="button"
                    fontFamily="'Open Sans', sans-serif"
                    fontWeight={400}
                    fontSize="22px"
                    lineHeight="1.3636363636363635em"
                    color="#717680"
                    cursor="pointer"
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    _hover={{ opacity: 0.7 }}
                  >
                    Unassigned
                  </Text>
                )}

                {/* Assignee Dropdown Menu */}
                {isAssigneeDropdownOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left="0"
                    bg="white"
                    border={`1px solid ${borderLightGray}`}
                    borderRadius="8px"
                    boxShadow="0px 2px 8px 0px rgba(0, 0, 0, 0.3)"
                    w="433px"
                    maxH="400px"
                    overflowY="auto"
                    zIndex={1001}
                  >
                    <Flex direction="column">
                      {admins.map((admin, index) => (
                        <Box
                          key={admin.id}
                          px="21px"
                          py="14px"
                          cursor="pointer"
                          onClick={() => {
                            updateField('assignee', admin.name);
                            setIsAssigneeDropdownOpen(false);
                          }}
                          _hover={{ bg: hoverBg }}
                          borderBottom={index < admins.length - 1 ? '1px solid #EEEEEC' : 'none'}
                          borderRadius={
                            index === 0
                              ? '8px 8px 0 0'
                              : index === admins.length - 1
                                ? '0 0 8px 8px'
                                : '0'
                          }
                        >
                          <Flex align="center" gap="12px">
                            <Box
                              w="26px"
                              h="26px"
                              bg={admin.bgColor}
                              borderRadius="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text
                                fontFamily="Inter"
                                fontWeight={600}
                                fontSize="18px"
                                lineHeight="1.2102272245619032em"
                                letterSpacing="-1.5%"
                                color="#000000"
                                opacity={0.8}
                              >
                                {admin.initial}
                              </Text>
                            </Box>
                            <Text
                              fontFamily="'Open Sans', sans-serif"
                              fontWeight={400}
                              fontSize="22px"
                              lineHeight="1.3636363636363635em"
                              color={veniceBlue}
                            >
                              {admin.name}
                            </Text>
                          </Flex>
                        </Box>
                      ))}
                    </Flex>
                  </Box>
                )}
              </Box>
            </Flex>

            {/* Task Description */}
            <Box bg="#F6F6F6" borderRadius="12px" px="20px" py="19px" maxH="300px" overflowY="auto">
              <Flex direction="column" gap="13px">
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="1.36181640625em"
                  letterSpacing="-1.5%"
                  color={veniceBlue}
                >
                  Task Description
                </Text>
                <Text
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize="22px"
                  lineHeight="1.36181640625em"
                  letterSpacing="-1.5%"
                  color={textPrimary}
                >
                  {task.description ||
                    'Check incoming Peer Connection intake forms for accuracy, follow up on missing information, and schedule screening calls with applicants.'}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};
