import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  IconButton,
  Input,
  MenuContent,
  MenuRoot,
  MenuTrigger,
  Spinner,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiMenu, FiMail, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TbSelector } from 'react-icons/tb';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole, FormStatus, Language } from '@/types/authTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { DirectoryProgressSlider } from '@/components/ui/directory-progress-slider';
import { DirectoryDataProvider } from '@/components/admin/DirectoryDataProvider';
import { LightMode } from '@/components/ui/color-mode';
import { COLORS } from '@/constants/form';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { UserResponse } from '@/APIClients/authAPIClient';
import { roleIdToUserRole } from '@/utils/roleUtils';

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

const formStatusMap: Record<FormStatus, { status: string; label: string; progress: number }> = {
  'intake-todo': {
    // when participant/volunteer has made an account and is in progress of completing intake form
    status: 'Not started',
    label: 'Intake form',
    progress: 0,
  },
  'intake-submitted': {
    // when participant/volunteer has submitted the intake form before admin sends them the ranking/secondaryapp form
    status: 'In-progress',
    label: 'Screen calling',
    progress: 25,
  },
  'ranking-todo': {
    // PARTICIPANT ONLY
    // when participant is in progress of doing ranking form
    status: 'In-progress',
    label: 'Ranking form',
    progress: 50,
  },
  'ranking-submitted': {
    // PARTICIPANT ONLY
    // after all onboarding has been completed OR participant rematches
    status: 'In-progress',
    label: 'Matching',
    progress: 75,
  },
  'secondary-application-todo': {
    // VOLUNTEER ONLY
    // when volunteer is in progress of doing secondary app form
    status: 'In-progress',
    label: 'Secondary app. form',
    progress: 50,
  },
  'secondary-application-submitted': {
    // VOLUNTEER ONLY
    // when the volunteer does not have any scheduled calls
    status: 'In-progress',
    label: 'Matching',
    progress: 75,
  },
  completed: {
    // when participant/volunteer has a match
    status: 'Completed',
    label: 'Matched',
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
  const router = useRouter();
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
    intakeForm: false,
    screenCalling: false,
    rankingForm: false,
    secondaryAppForm: false,
    matching: false,
    matched: false,
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
      intakeForm: false,
      screenCalling: false,
      rankingForm: false,
      secondaryAppForm: false,
      matching: false,
      matched: false,
      rejected: false,
    };
    setUserTypeFilters(clearedUserTypes);
    setStatusFilters(clearedStatuses);
    setAppliedUserTypeFilters(clearedUserTypes);
    setAppliedStatusFilters(clearedStatuses);
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
      <DirectoryDataProvider>
        {(users, loading, error) => {
          const filteredUsers = users.filter((user: UserResponse) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
            const matchesSearch =
              fullName.includes(searchQuery.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const userRole = roleIdToUserRole(user.roleId);

            // User type filtering
            const hasUserTypeFilter =
              appliedUserTypeFilters.participant || appliedUserTypeFilters.volunteer;
            const matchesUserType =
              !hasUserTypeFilter ||
              (appliedUserTypeFilters.participant && userRole === UserRole.PARTICIPANT) ||
              (appliedUserTypeFilters.volunteer && userRole === UserRole.VOLUNTEER);

            // Status filtering
            const hasStatusFilter =
              appliedStatusFilters.intakeForm ||
              appliedStatusFilters.screenCalling ||
              appliedStatusFilters.rankingForm ||
              appliedStatusFilters.secondaryAppForm ||
              appliedStatusFilters.matching ||
              appliedStatusFilters.matched ||
              appliedStatusFilters.rejected;
            const userFormStatus = user.formStatus as FormStatus | undefined;
            const matchesStatus =
              !hasStatusFilter ||
              (appliedStatusFilters.intakeForm && userFormStatus === FormStatus.INTAKE_TODO) ||
              (appliedStatusFilters.screenCalling &&
                userFormStatus === FormStatus.INTAKE_SUBMITTED) ||
              (appliedStatusFilters.rankingForm && userFormStatus === FormStatus.RANKING_TODO) ||
              (appliedStatusFilters.secondaryAppForm &&
                userFormStatus === FormStatus.SECONDARY_APPLICATION_TODO) ||
              (appliedStatusFilters.matching &&
                (userFormStatus === FormStatus.RANKING_SUBMITTED ||
                  userFormStatus === FormStatus.SECONDARY_APPLICATION_SUBMITTED)) ||
              (appliedStatusFilters.matched && userFormStatus === FormStatus.COMPLETED) ||
              (appliedStatusFilters.rejected && userFormStatus === FormStatus.REJECTED);

            return matchesSearch && matchesUserType && matchesStatus;
          });

          // Sort the filtered users
          const sortedUsers = [...filteredUsers].sort((a: UserResponse, b: UserResponse) => {
            if (sortBy === 'nameAsc' || sortBy === 'nameDsc') {
              // Sort by name
              const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
              const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
              const comparison = nameA.localeCompare(nameB);
              return sortBy === 'nameAsc' ? comparison : -comparison;
            } else {
              // Sort by status (using progress values)
              const progressA = formStatusMap[a.formStatus as FormStatus]?.progress ?? 0;
              const progressB = formStatusMap[b.formStatus as FormStatus]?.progress ?? 0;
              const comparison = progressA - progressB;
              return sortBy === 'statusAsc' ? comparison : -comparison;
            }
          });

          const handleSelectAll = (e: { checked: boolean | 'indeterminate' }) => {
            if (e.checked) {
              setSelectedUsers(new Set(sortedUsers.map((u) => u.id)));
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

          const tableContent = (() => {
            if (loading) {
              return (
                <Center py={16}>
                  <VStack gap={4}>
                    <Spinner size="xl" color={COLORS.veniceBlue} />
                    <Text fontSize="sm" color="#495D6C">
                      Loading users...
                    </Text>
                  </VStack>
                </Center>
              );
            }

            if (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : typeof error === 'string'
                    ? error
                    : 'Please refresh and try again.';
              return (
                <Center py={16}>
                  <VStack gap={3} maxW="400px" textAlign="center">
                    <Box
                      bg="red.50"
                      border="1px solid"
                      borderColor="red.200"
                      borderRadius="md"
                      p={4}
                      w="full"
                    >
                      <Text fontWeight="600" color="red.700" mb={1}>
                        Unable to load the directory
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        {errorMessage}
                      </Text>
                    </Box>
                    <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </VStack>
                </Center>
              );
            }

            if (sortedUsers.length === 0) {
              const hasActiveFilters =
                searchQuery ||
                appliedUserTypeFilters.participant ||
                appliedUserTypeFilters.volunteer ||
                appliedStatusFilters.intakeForm ||
                appliedStatusFilters.screenCalling ||
                appliedStatusFilters.rankingForm ||
                appliedStatusFilters.secondaryAppForm ||
                appliedStatusFilters.matching ||
                appliedStatusFilters.matched ||
                appliedStatusFilters.rejected;

              return (
                <Center py={16}>
                  <VStack gap={2}>
                    <Text fontSize="lg" fontWeight={600} color={DIRECTORY_COLORS.navbarGray}>
                      {hasActiveFilters ? 'No users match your filters' : 'No users found'}
                    </Text>
                    <Text fontSize="sm" color="#495D6C">
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters to see more results.'
                        : 'There are no users in the directory yet.'}
                    </Text>
                  </VStack>
                </Center>
              );
            }

            return (
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
                        if (sortBy === 'nameDsc') {
                          setSortBy('nameAsc');
                        } else {
                          setSortBy('nameDsc');
                        }
                      }}
                      cursor="pointer"
                    >
                      <Flex alignItems="center" gap={1.5}>
                        Name
                        {sortBy === 'nameAsc' && <FiChevronUp size={16} />}
                        {sortBy === 'nameDsc' && <FiChevronDown size={16} />}
                        {sortBy !== 'nameAsc' && sortBy !== 'nameDsc' && (
                          <TbSelector size={16} color="#A0A0A0" />
                        )}
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader width="10%">Language</Table.ColumnHeader>
                    <Table.ColumnHeader width="15%">Assigned</Table.ColumnHeader>
                    <Table.ColumnHeader
                      onClick={() => {
                        if (sortBy === 'statusDsc') {
                          setSortBy('statusAsc');
                        } else {
                          setSortBy('statusDsc');
                        }
                      }}
                      cursor="pointer"
                    >
                      <Flex alignItems="center" gap={1.5}>
                        Status
                        {sortBy === 'statusAsc' && <FiChevronUp size={16} />}
                        {sortBy === 'statusDsc' && <FiChevronDown size={16} />}
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
                  {sortedUsers.map((user: UserResponse) => {
                    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    const userRole = roleIdToUserRole(user.roleId);
                    const roleName =
                      userRole === UserRole.VOLUNTEER
                        ? 'Volunteer'
                        : userRole === UserRole.PARTICIPANT
                          ? 'Participant'
                          : 'Unknown';

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
                          <Text
                            as="span"
                            textDecoration="underline"
                            cursor="pointer"
                            _hover={{ color: COLORS.veniceBlue }}
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            {displayName}
                          </Text>
                        </Table.Cell>
                        <Table.Cell py={1.5} verticalAlign="middle">
                          {(() => {
                            const isFrench =
                              user.language === Language.FRENCH || user.language === 'fr';
                            const languageName = isFrench ? 'French' : 'English';
                            const languageBg = isFrench
                              ? DIRECTORY_COLORS.languageFrenchBg
                              : DIRECTORY_COLORS.languageEnglishBg;
                            const languageColor = isFrench
                              ? DIRECTORY_COLORS.languageFrenchText
                              : DIRECTORY_COLORS.languageEnglishText;

                            return (
                              <Badge
                                bg={languageBg}
                                color={languageColor}
                                borderRadius="full"
                                px={3.5}
                                py={1.5}
                                width={'72px'}
                                fontFamily="'Open Sans', sans-serif"
                                fontWeight={400}
                                fontSize="13px"
                                lineHeight="1.25em"
                              >
                                {languageName}
                              </Badge>
                            );
                          })()}
                        </Table.Cell>
                        <Table.Cell py={1.5} verticalAlign="middle">
                          <Badge
                            bg={
                              userRole === UserRole.VOLUNTEER
                                ? DIRECTORY_COLORS.roleVolunteerBg
                                : DIRECTORY_COLORS.roleParticipantBg
                            }
                            color={
                              userRole === UserRole.VOLUNTEER
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
                            value={formStatusMap[user.formStatus as FormStatus]?.progress ?? 0}
                          />
                        </Table.Cell>
                        <Table.Cell py={1.5} verticalAlign="middle">
                          {(() => {
                            const statusConfig = formStatusMap[user.formStatus as FormStatus];
                            const statusLabel = statusConfig?.label ?? 'Intake form';
                            const statusLevel = statusConfig?.status ?? 'Not started';
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
            );
          })();

          return (
            <LightMode>
              <AdminHeader />

              {/* Main Content */}
              <Box
                p={8}
                bg="white"
                minH="100vh"
                marginLeft={{ base: 4, lg: 8, xl: 157 }}
                marginRight={{ base: 4, lg: 8, xl: 130 }}
              >
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
                    top={{ base: '-24px', md: '12px' }}
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
                                checked={statusFilters.intakeForm}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, intakeForm: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Intake form</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.screenCalling}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, screenCalling: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Screen calling</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.rankingForm}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, rankingForm: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Ranking form</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.secondaryAppForm}
                                onCheckedChange={(e) =>
                                  setStatusFilters({
                                    ...statusFilters,
                                    secondaryAppForm: !!e.checked,
                                  })
                                }
                              >
                                <Text fontSize="sm">Secondary app. form</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.matching}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, matching: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Matching</Text>
                              </Checkbox>
                              <Checkbox
                                checked={statusFilters.matched}
                                onCheckedChange={(e) =>
                                  setStatusFilters({ ...statusFilters, matched: !!e.checked })
                                }
                              >
                                <Text fontSize="sm">Matched</Text>
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

                  <Box overflowX="auto" borderRadius="md">
                    {tableContent}
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
