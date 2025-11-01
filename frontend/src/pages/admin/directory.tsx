import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Table,
  IconButton,
  Input,
  Badge,
  Button,
  VStack,
} from '@chakra-ui/react';
import { FiSearch, FiMenu, FiMail, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TbSelector } from 'react-icons/tb';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { DirectoryProgressSlider } from '@/components/ui/directory-progress-slider';
import { DirectoryDataProvider } from '@/components/admin/DirectoryDataProvider';
import { MenuContent, MenuRoot, MenuTrigger } from '@chakra-ui/react';
import { LightMode } from '@/components/ui/color-mode';
import { COLORS } from '@/constants/form';
import { AdminHeader } from '@/components/admin/AdminHeader';

// Directory-specific colors from Figma design system
const DIRECTORY_COLORS = {
  // Language badges
  languageEnglishBg: '#EEEEEC',
  languageEnglishText: '#414651',
  languageFrenchBg: '#EDF6FD',
  languageFrenchText: '#2171AB',

  // Role badges
  roleVolunteerBg: '#FCCEEE',
  roleVolunteerText: '#C11574',
  roleParticipantBg: '#D9D6FE',
  roleParticipantText: '#5925DC',

  // Status badges
  statusSuccessBg: '#ECFDF3',
  statusSuccessText: '#027A48',
  statusRejectedBg: 'rgba(232, 188, 189, 0.3)',
  statusRejectedText: '#B42318',
  statusDefaultBg: '#F2F4F7',
  statusDefaultText: '#344054',

  // Borders
  tableBorder: '#D5D7DA',

  // Navbar
  navbarGray: '#414651', // Gray/700
  iconGray: '#181D27', // Gray/900
  menuButtonBg: '#EAEAE6',
  applyButtonBg: '#056067', // Teal from Figma
} as const;

type FormStatus =
  | 'intake-todo'
  | 'intake-submitted'
  | 'ranking-todo'
  | 'ranking-submitted'
  | 'secondary-application-todo'
  | 'secondary-application-submitted'
  | 'completed'
  | 'rejected';

interface DirectoryUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId: number;
  formStatus: FormStatus;
}

const formStatusMap: Record<FormStatus, { status: string; label: string; progress: number }> = {
  'intake-todo': {
    status: 'Not started',
    label: 'Intake form',
    progress: 0,
  },
  'intake-submitted': {
    status: 'In-progress',
    label: 'Screen calling',
    progress: 25,
  },
  'ranking-todo': {
    status: 'In-progress',
    label: 'Ranking',
    progress: 50,
  },
  'ranking-submitted': {
    status: 'In-progress',
    label: 'Matched',
    progress: 75,
  },
  'secondary-application-todo': {
    status: 'In-progress',
    label: 'Secondary application',
    progress: 50,
  },
  'secondary-application-submitted': {
    status: 'In-progress',
    label: 'Training',
    progress: 75,
  },
  completed: {
    status: 'Completed',
    label: 'Completed',
    progress: 100,
  },
  rejected: {
    status: 'Rejected',
    label: 'Rejected',
    progress: 100,
  },
};

const getStatusColor = (step: string): { bg: string; color: string } => {
  const lowerStep = step.toLowerCase();
  if (lowerStep.includes('rejected'))
    return { bg: DIRECTORY_COLORS.statusRejectedBg, color: DIRECTORY_COLORS.statusRejectedText };
  return { bg: DIRECTORY_COLORS.statusSuccessBg, color: DIRECTORY_COLORS.statusSuccessText };
};

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'nameAsc' | 'nameDsc' | 'statusAsc' | 'statusDsc'>(
    'nameAsc',
  );

  // Filter state
  const [userTypeFilters, setUserTypeFilters] = useState({
    participant: false,
    volunteer: false,
  });
  const [statusFilters, setStatusFilters] = useState({
    notStarted: false,
    inProgress: false,
    completed: false,
    rejected: false,
  });

  // Applied filters (only update on "Apply" click)
  const [appliedUserTypeFilters, setAppliedUserTypeFilters] = useState(userTypeFilters);
  const [appliedStatusFilters, setAppliedStatusFilters] = useState(statusFilters);

  const handleApplyFilters = () => {
    setAppliedUserTypeFilters(userTypeFilters);
    setAppliedStatusFilters(statusFilters);
  };

  const handleClearFilters = () => {
    const clearedUserTypes = { participant: false, volunteer: false };
    const clearedStatuses = {
      notStarted: false,
      inProgress: false,
      completed: false,
      rejected: false,
    };
    setUserTypeFilters(clearedUserTypes);
    setStatusFilters(clearedStatuses);
    setAppliedUserTypeFilters(clearedUserTypes);
    setAppliedStatusFilters(clearedStatuses);
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN, UserRole.VOLUNTEER]}>
      <DirectoryDataProvider>
        {(users, loading, error) => {
          const filteredUsers = users.filter((user: any) => {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`
              .trim()
              .toLowerCase();
            const matchesSearch =
              fullName.includes(searchQuery.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchQuery.toLowerCase());

            // User type filtering
            const hasUserTypeFilter =
              appliedUserTypeFilters.participant || appliedUserTypeFilters.volunteer;
            const matchesUserType =
              !hasUserTypeFilter ||
              (appliedUserTypeFilters.participant && user.roleId === 1) ||
              (appliedUserTypeFilters.volunteer && user.roleId === 2);

            // Status filtering
            const hasStatusFilter =
              appliedStatusFilters.notStarted ||
              appliedStatusFilters.inProgress ||
              appliedStatusFilters.completed ||
              appliedStatusFilters.rejected;
            const userStatus =
              user.formStatus && formStatusMap[user.formStatus as FormStatus]?.status;
            const matchesStatus =
              !hasStatusFilter ||
              (appliedStatusFilters.notStarted && userStatus === 'Not started') ||
              (appliedStatusFilters.inProgress && userStatus === 'In-progress') ||
              (appliedStatusFilters.completed && userStatus === 'Completed') ||
              (appliedStatusFilters.rejected && userStatus === 'Rejected');

            return matchesSearch && matchesUserType && matchesStatus;
          });

          // Sort the filtered users
          const sortedUsers = [...filteredUsers].sort((a: DirectoryUser, b: DirectoryUser) => {
            if (sortBy === 'nameAsc' || sortBy === 'nameDsc') {
              // Sort by name
              const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
              const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
              const comparison = nameA.localeCompare(nameB);
              return sortBy === 'nameAsc' ? comparison : -comparison;
            } else {
              // Sort by status (using progress values)
              const progressA = formStatusMap[a.formStatus]?.progress ?? 0;
              const progressB = formStatusMap[b.formStatus]?.progress ?? 0;
              const comparison = progressA - progressB;
              return sortBy === 'statusAsc' ? comparison : -comparison;
            }
          });

          const handleSelectAll = (e: any) => {
            if (e.checked) {
              setSelectedUsers(new Set(sortedUsers.map((u: any) => u.id)));
            } else {
              setSelectedUsers(new Set());
            }
          };

          const handleSelectUser = (userId: string, checked: boolean) => {
            const newSelected = new Set(selectedUsers);
            if (checked) {
              newSelected.add(userId);
            } else {
              newSelected.delete(userId);
            }
            setSelectedUsers(newSelected);
          };

          return (
            <LightMode>
              <AdminHeader />

              {/* Main Content */}
              <Box p={8} bg="white" minH="100vh" marginLeft={157} marginRight={130}>
                <Heading
                  as="h1"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={600}
                  color={COLORS.veniceBlue}
                  fontSize="3xl"
                  mb={6}
                >
                  Directory
                </Heading>

                {/* Table */}
                <Box bg="white" borderRadius="md" position="relative">
                  {/* Icon Group - positioned at top right of table header */}
                  <Flex
                    position="absolute"
                    top="12px"
                    right="12px"
                    gap={3}
                    alignItems="center"
                    zIndex={10}
                  >
                    <IconButton
                      variant="ghost"
                      aria-label="Mail"
                      size="sm"
                      _hover={{ bg: DIRECTORY_COLORS.menuButtonBg }}
                      _focus={{ outline: 'none', boxShadow: 'none' }}
                      _focusVisible={{ outline: 'none', boxShadow: 'none' }}
                    >
                      <FiMail size={20} color={DIRECTORY_COLORS.iconGray} />
                    </IconButton>

                    {/* Filter Menu */}
                    <MenuRoot>
                      <MenuTrigger asChild>
                        <Box
                          borderRadius="md"
                          width="40px"
                          height="34px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          _hover={{ bg: DIRECTORY_COLORS.menuButtonBg }}
                        >
                          <FiMenu size={20} color={DIRECTORY_COLORS.iconGray} />
                        </Box>
                      </MenuTrigger>
                      <MenuContent
                        p={4}
                        w="240px"
                        borderRadius="8px"
                        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 16px 24px -4px rgba(10, 13, 18, 0.08)"
                        position="absolute"
                        top="50px"
                        right="12px"
                        zIndex={20}
                      >
                        <VStack align="stretch" gap={4}>
                          {/* User Type Section */}
                          <Box>
                            <Text
                              fontSize="14px"
                              fontWeight="600"
                              color={DIRECTORY_COLORS.navbarGray}
                              mb={3}
                            >
                              User type
                            </Text>
                            <VStack align="stretch" gap={2}>
                              <Checkbox
                                checked={userTypeFilters.participant}
                                onCheckedChange={(e) =>
                                  setUserTypeFilters({
                                    ...userTypeFilters,
                                    participant: !!e.checked,
                                  })
                                }
                              >
                                <Text fontSize="sm">Participant</Text>
                              </Checkbox>
                              <Checkbox
                                checked={userTypeFilters.volunteer}
                                onCheckedChange={(e) =>
                                  setUserTypeFilters({ ...userTypeFilters, volunteer: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Volunteer</Text>
                              </Checkbox>
                            </VStack>
                          </Box>

                          {/* Status Section */}
                          <Box>
                            <Text
                              fontSize="14px"
                              fontWeight="600"
                              color={DIRECTORY_COLORS.navbarGray}
                              mb={3}
                            >
                              Status
                            </Text>
                            <VStack align="stretch" gap={2}>
                              <Checkbox
                                checked={statusFilters.notStarted}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, notStarted: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Not Started</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.inProgress}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, inProgress: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">In-progress</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.completed}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, completed: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Completed</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.rejected}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, rejected: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Rejected</Text>
                              </Checkbox>
                            </VStack>
                          </Box>

                          {/* Action Buttons */}
                          <VStack gap={2} mt={2}>
                            <Button
                              width="100%"
                              bg={DIRECTORY_COLORS.applyButtonBg}
                              color="white"
                              borderRadius="12px"
                              fontWeight="600"
                              fontSize="14px"
                              _hover={{ bg: '#044d52' }}
                              onClick={handleApplyFilters}
                            >
                              Apply
                            </Button>
                            <Button
                              width="100%"
                              variant="ghost"
                              fontWeight="600"
                              fontSize="14px"
                              color={DIRECTORY_COLORS.navbarGray}
                              onClick={handleClearFilters}
                            >
                              Clear all
                            </Button>
                          </VStack>
                        </VStack>
                      </MenuContent>
                    </MenuRoot>

                    {/* Search Menu */}
                    <MenuRoot>
                      <MenuTrigger asChild>
                        <IconButton
                          variant="ghost"
                          aria-label="Search"
                          size="sm"
                          _hover={{ bg: DIRECTORY_COLORS.menuButtonBg }}
                          _focus={{ outline: 'none', boxShadow: 'none' }}
                          _focusVisible={{ outline: 'none', boxShadow: 'none' }}
                        >
                          <FiSearch size={20} color={DIRECTORY_COLORS.iconGray} />
                        </IconButton>
                      </MenuTrigger>
                      <MenuContent
                        p={4}
                        w="300px"
                        borderRadius="8px"
                        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 16px 24px -4px rgba(10, 13, 18, 0.08)"
                        position="absolute"
                        top="50px"
                        right="12px"
                        zIndex={20}
                      >
                        <VStack align="stretch" gap={3}>
                          <Text
                            fontSize="14px"
                            fontWeight="600"
                            color={DIRECTORY_COLORS.navbarGray}
                          >
                            Search users
                          </Text>
                          <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="md"
                            borderRadius="8px"
                            bg="white"
                            borderColor="#D5D7DA"
                            paddingX="0.75em"
                            _focus={{
                              borderColor: DIRECTORY_COLORS.applyButtonBg,
                              boxShadow: `0 0 0 1px ${DIRECTORY_COLORS.applyButtonBg}`,
                            }}
                          />
                          {searchQuery && (
                            <Button
                              width="100%"
                              variant="ghost"
                              fontWeight="600"
                              fontSize="14px"
                              color={DIRECTORY_COLORS.navbarGray}
                              onClick={() => setSearchQuery('')}
                            >
                              Clear search
                            </Button>
                          )}
                        </VStack>
                      </MenuContent>
                    </MenuRoot>
                  </Flex>

                  <Box overflow="hidden" borderRadius="md">
                    <Table.Root
                      variant="line"
                      css={{
                        '& tbody tr': {
                          borderBottomColor: DIRECTORY_COLORS.tableBorder,
                        },
                      }}
                    >
                      <Table.Header bg="white">
                        <Table.Row
                          bg="white"
                          color="#535862"
                          fontWeight="600"
                          fontSize="16px"
                          fontFamily="'Open Sans', sans-serif"
                          lineHeight="1.362em"
                        >
                          <Table.ColumnHeader width="40px">
                            <Checkbox
                              checked={
                                sortedUsers.length > 0 && selectedUsers.size === sortedUsers.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            width="12%"
                            onClick={() => {
                              if (sortBy == 'nameDsc') {
                                setSortBy('nameAsc');
                              } else {
                                setSortBy('nameDsc');
                              }
                            }}
                            cursor="pointer"
                          >
                            <Flex alignItems="center" gap={1.5}>
                              Name
                              {sortBy == 'nameAsc' && <FiChevronUp size={16} />}
                              {sortBy == 'nameDsc' && <FiChevronDown size={16} />}
                              {sortBy !== 'nameAsc' && sortBy !== 'nameDsc' && (
                                <TbSelector size={16} color="#A0A0A0" />
                              )}
                            </Flex>
                          </Table.ColumnHeader>
                          <Table.ColumnHeader width="10%">Language</Table.ColumnHeader>
                          <Table.ColumnHeader width="15%">Assigned</Table.ColumnHeader>
                          <Table.ColumnHeader
                            onClick={() => {
                              if (sortBy == 'statusDsc') {
                                setSortBy('statusAsc');
                              } else {
                                setSortBy('statusDsc');
                              }
                            }}
                            cursor="pointer"
                          >
                            <Flex alignItems="center" gap={1.5}>
                              Status
                              {sortBy == 'statusAsc' && <FiChevronUp size={16} />}
                              {sortBy == 'statusDsc' && <FiChevronDown size={16} />}
                              {sortBy !== 'statusAsc' && sortBy !== 'statusDsc' && (
                                <TbSelector size={16} color="#A0A0A0" />
                              )}
                            </Flex>
                          </Table.ColumnHeader>
                          <Table.ColumnHeader width="100px"></Table.ColumnHeader>
                          <Table.ColumnHeader></Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {sortedUsers.map((user: DirectoryUser) => {
                          const displayName =
                            `${user.firstName || ''} ${user.lastName || ''}`.trim();
                          const roleName = user.roleId === 2 ? 'Volunteer' : 'Participant';

                          return (
                            <Table.Row
                              key={user.id}
                              bg={'white'}
                              _hover={{ bg: 'gray.50' }}
                              borderBottom="1px solid"
                              borderBottomColor={DIRECTORY_COLORS.tableBorder}
                              h="64px"
                              minH="64px"
                            >
                              <Table.Cell py={1.5} verticalAlign="middle">
                                <Checkbox
                                  checked={selectedUsers.has(user.id.toString())}
                                  onCheckedChange={(e) =>
                                    handleSelectUser(user.id.toString(), !!e.checked)
                                  }
                                />
                              </Table.Cell>
                              <Table.Cell
                                py={1.5}
                                verticalAlign="middle"
                                fontFamily="'Open Sans', sans-serif"
                                fontWeight={400}
                                fontSize="16px"
                                lineHeight="1.362em"
                                color="#495D6C"
                              >
                                {displayName}
                              </Table.Cell>
                              <Table.Cell py={1.5} verticalAlign="middle">
                                <Badge
                                  bg={DIRECTORY_COLORS.languageEnglishBg}
                                  color={DIRECTORY_COLORS.languageEnglishText}
                                  borderRadius="full"
                                  px={3.5}
                                  py={1.5}
                                  fontFamily="'Open Sans', sans-serif"
                                  fontWeight={400}
                                  fontSize="13px"
                                  lineHeight="1.25em"
                                >
                                  English
                                </Badge>
                              </Table.Cell>
                              <Table.Cell py={1.5} verticalAlign="middle">
                                <Badge
                                  bg={
                                    user.roleId === 2
                                      ? DIRECTORY_COLORS.roleVolunteerBg
                                      : DIRECTORY_COLORS.roleParticipantBg
                                  }
                                  color={
                                    user.roleId === 2
                                      ? DIRECTORY_COLORS.roleVolunteerText
                                      : DIRECTORY_COLORS.roleParticipantText
                                  }
                                  borderRadius="full"
                                  px={3.5}
                                  py={1.5}
                                  fontFamily="'Open Sans', sans-serif"
                                  fontWeight={400}
                                  fontSize="13px"
                                  lineHeight="1.25em"
                                >
                                  {roleName}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell py={1.5} verticalAlign="middle">
                                <DirectoryProgressSlider
                                  value={formStatusMap[user.formStatus].progress}
                                />
                              </Table.Cell>
                              <Table.Cell py={1.5} verticalAlign="middle">
                                {(() => {
                                  const statusLabel =
                                    formStatusMap[user.formStatus]?.label || 'intake-submitted';
                                  const statusLevel = formStatusMap[user.formStatus].status;
                                  const statusColors = getStatusColor(statusLevel);
                                  return (
                                    <Badge
                                      bg={statusColors.bg}
                                      color={statusColors.color}
                                      borderRadius="md"
                                      px={3.5}
                                      py={1.5}
                                      fontFamily="'Open Sans', sans-serif"
                                      fontWeight={400}
                                      fontSize="13px"
                                      lineHeight="1.25em"
                                    >
                                      {statusLabel}
                                    </Badge>
                                  );
                                })()}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Box>
              </Box>
            </LightMode>
          );
        }}
      </DirectoryDataProvider>
    </ProtectedPage>
  );
}
