import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';
import { TaskRow } from '@/components/admin/TaskRow';
import { TaskEditModal } from '@/components/admin/TaskEditModal';
import { FilterDropdown } from '@/components/admin/FilterDropdown';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { TableHeader } from '@/components/admin/TableHeader';
import { ViewDropdown } from '@/components/admin/ViewDropdown';
import {
  FiClipboard,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiSearch,
  FiFolder,
  FiLoader,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import { taskAPIClient, BackendTask } from '@/APIClients/taskAPIClient';
import { getAdmins, getUserById, UserResponse, getCurrentUser } from '@/APIClients/authAPIClient';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Task, Admin, taskCategories } from '@/types/adminTypes';
import {
  veniceBlue,
  gray300,
  avatarColors,
  white,
  black,
  lightGray,
  tealBlue,
  lightBg,
  lightBgHover,
  textPrimary,
  borderActive,
  mutedText,
  shadow,
} from '@/constants/colors';
import { Heading1 } from '@/components/ui/text-styles';

// Helper to map backend user to Admin
const mapUserToAdmin = (user: UserResponse, index: number): Admin => {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.email;
  const initial = firstName.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();

  return {
    id: user.id,
    name: fullName,
    initial,
    bgColor: avatarColors[index % avatarColors.length],
  };
};

type ViewMode = 'list' | 'grouped';

// Helper function to map backend task to frontend format
const mapAPITaskToFrontend = (
  apiTask: BackendTask,
  participant?: UserResponse | null,
  assignee?: Admin | null,
): Task => {
  // Map backend type to frontend type
  const typeMap: Record<string, Task['type']> = {
    intake_form_review: 'Intake Form Review',
    volunteer_app_review: 'Volunteer App. Review',
    profile_update: 'Profile Update',
    matching: 'Matching',
  };

  // Map backend priority to frontend priority
  const priorityMap: Record<string, Task['priority']> = {
    no_status: 'Add status',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  // Determine category based on type
  const categoryMap: Record<string, Task['category']> = {
    intake_form_review: 'intake_screening',
    volunteer_app_review: 'secondary_app',
    profile_update: 'profile_updates',
    matching: 'matching_requests',
  };

  // Format dates from ISO to DD/MM/YY
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Get participant name
  const participantName = participant
    ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email
    : 'Unknown Participant';

  // Determine user type from participant's role
  const userType: 'Participant' | 'Volunteer' =
    participant && participant.roleId === 2 ? 'Volunteer' : 'Participant';

  return {
    id: apiTask.id,
    name: participantName,
    startDate: formatDate(apiTask.startDate),
    endDate: apiTask.endDate ? formatDate(apiTask.endDate) : formatDate(apiTask.startDate),
    priority: priorityMap[apiTask.priority] || 'Add status',
    type: typeMap[apiTask.type] || 'Intake Form Review',
    assignee: assignee?.name,
    completed: apiTask.status === 'completed',
    userType,
    category: categoryMap[apiTask.type] || 'intake_screening',
    description: `Task for ${typeMap[apiTask.type]}`,
  };
};

// Helper to map frontend values back to backend format
const mapPriorityToBackend = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'Add status': 'no_status',
    Low: 'low',
    Medium: 'medium',
    High: 'high',
  };
  return priorityMap[priority] || 'no_status';
};

const formatDateToISO = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('/');
  const fullYear = 2000 + parseInt(year);
  return new Date(fullYear, parseInt(month) - 1, parseInt(day)).toISOString();
};

interface FilterState {
  participant: boolean;
  volunteer: boolean;
  high: boolean;
  medium: boolean;
  low: boolean;
  noStatus: boolean;
}

export default function AdminTasks() {
  const [activeTab, setActiveTab] = useState('Unassigned');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1']); // First category expanded by default
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    participant: false,
    volunteer: false,
    high: false,
    medium: false,
    low: false,
    noStatus: false,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Popup state for task editing
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<
    'name' | 'startDate' | 'endDate' | 'priority' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Drag & Drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
  );

  // Fetch admins and tasks on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch admins
        const adminsResponse = await getAdmins();
        const mappedAdmins = adminsResponse.users.map((user, index) => mapUserToAdmin(user, index));
        setAdmins(mappedAdmins);

        // Get the currently logged-in user
        const authenticatedUser = getCurrentUser();
        if (authenticatedUser) {
          // Find the current user in the admins list by ID
          const loggedInAdmin = mappedAdmins.find((admin) => admin.id === authenticatedUser.id);
          if (loggedInAdmin) {
            setCurrentUser(loggedInAdmin);
          } else {
            // Fallback: If logged-in user not found in admins list (shouldn't happen), use first admin
            console.warn('Logged-in user not found in admins list, using first admin as fallback');
            if (mappedAdmins.length > 0) {
              setCurrentUser(mappedAdmins[0]);
            }
          }
        } else {
          // No authenticated user found (shouldn't happen with auth guard), use first admin as fallback
          console.warn('No authenticated user found, using first admin as fallback');
          if (mappedAdmins.length > 0) {
            setCurrentUser(mappedAdmins[0]);
          }
        }

        // Fetch tasks
        const tasksResponse = await taskAPIClient.getTasks();

        // Fetch participants for tasks
        const participantIds = [
          ...new Set(
            tasksResponse.tasks
              .filter((t) => t.participantId)
              .map((t) => t.participantId as string),
          ),
        ];

        const participantMap = new Map<string, UserResponse>();
        await Promise.all(
          participantIds.map(async (id) => {
            try {
              const participant = await getUserById(id);
              participantMap.set(id, participant);
            } catch (error) {
              console.error(`Error fetching participant ${id}:`, error);
            }
          }),
        );

        // Map tasks to frontend format
        const mappedTasks = tasksResponse.tasks.map((apiTask) => {
          const participant = apiTask.participantId
            ? participantMap.get(apiTask.participantId)
            : null;
          const assignee = apiTask.assigneeId
            ? mappedAdmins.find((a) => a.id === apiTask.assigneeId)
            : null;
          return mapAPITaskToFrontend(apiTask, participant, assignee);
        });

        setTasks(mappedTasks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const handleTaskCheck = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (!task.completed) {
        // Mark as completed
        await taskAPIClient.completeTask(taskId);
      } else {
        // Update to pending
        await taskAPIClient.updateTask(taskId, { status: 'pending' });
      }

      // Update local state
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const openTaskPopup = (task: Task) => {
    setSelectedTask(task);
    setIsPopupOpen(true);
  };

  const closeTaskPopup = () => {
    setIsPopupOpen(false);
    setSelectedTask(null);
  };

  const updateTaskField = async (
    taskId: string,
    field: string | number | symbol,
    value: string | boolean,
  ) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    try {
      // Handle completed field separately using the dedicated endpoints
      if (field === 'completed') {
        if (value === true) {
          // Mark as completed
          await taskAPIClient.completeTask(taskId);
        } else {
          // Update to pending
          await taskAPIClient.updateTask(taskId, { status: 'pending' });
        }

        // Update local state
        const updatedTask = { ...taskToUpdate, completed: value as boolean };
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
        setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
        return;
      }

      const updates: Record<string, string | null> = {};

      if (field === 'priority') {
        updates.priority = mapPriorityToBackend(value as string);
      } else if (field === 'assignee') {
        const admin = admins.find((a) => a.name === value);
        updates.assigneeId = admin?.id || null;
      } else if (field === 'startDate') {
        updates.startDate = formatDateToISO(value as string);
      } else if (field === 'endDate') {
        updates.endDate = formatDateToISO(value as string);
      }

      // Call API
      await taskAPIClient.updateTask(taskId, updates);

      // Update local state
      const updatedTask = { ...taskToUpdate, [field]: value };
      if (selectedTask?.id === taskId) {
        setSelectedTask(updatedTask);
      }
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (error) {
      console.error('Error updating task field:', error);
    }
  };

  // Helper to parse date string (DD/MM/YY) to Date object
  const parseDateString = (dateStr: string): Date | null => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = 2000 + parseInt(parts[2], 10); // Assuming 20XX
    return new Date(year, month, day);
  };

  // Sorting handler
  const handleSort = (column: 'name' | 'startDate' | 'endDate' | 'priority') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id as string;
    const dropZone = over.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    try {
      // Handle drop based on zone
      if (dropZone === 'Unassigned') {
        // Unassign task
        await taskAPIClient.updateTask(taskId, {
          assigneeId: null,
          status: 'pending',
        });

        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, assignee: undefined, completed: false } : t,
          ),
        );
      } else if (dropZone === 'My Tasks' || dropZone === 'Team Tasks') {
        // Assign to current user
        if (currentUser) {
          await taskAPIClient.updateTask(taskId, {
            assigneeId: currentUser.id,
            status: 'pending',
          });

          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId ? { ...t, assignee: currentUser.name, completed: false } : t,
            ),
          );
        }
      } else if (dropZone === 'Completed') {
        // Mark as completed
        await taskAPIClient.completeTask(taskId);

        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Filter handler for FilterDropdown component
  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
  };

  // Filter tasks based on active tab, applied filters, and search query
  const getFilteredTasks = () => {
    let filtered = tasks;

    // First filter by tab
    if (activeTab === 'Completed') {
      filtered = filtered.filter((task) => task.completed);
    } else if (activeTab === 'Unassigned') {
      filtered = filtered.filter((task) => !task.completed && !task.assignee);
    } else if (activeTab === 'My Tasks') {
      // Show tasks assigned to the current user
      if (currentUser) {
        filtered = filtered.filter((task) => !task.completed && task.assignee === currentUser.name);
      }
    } else if (activeTab === 'Team Tasks') {
      // Show ALL assigned tasks (all admins are on one team)
      filtered = filtered.filter((task) => !task.completed && task.assignee);
    }

    // Then apply user type filters
    const userTypeFiltersActive = appliedFilters.participant || appliedFilters.volunteer;
    if (userTypeFiltersActive) {
      filtered = filtered.filter((task) => {
        if (appliedFilters.participant && task.userType === 'Participant') return true;
        if (appliedFilters.volunteer && task.userType === 'Volunteer') return true;
        return false;
      });
    }

    // Then apply priority filters
    const priorityFiltersActive =
      appliedFilters.high || appliedFilters.medium || appliedFilters.low || appliedFilters.noStatus;
    if (priorityFiltersActive) {
      filtered = filtered.filter((task) => {
        if (appliedFilters.high && task.priority === 'High') return true;
        if (appliedFilters.medium && task.priority === 'Medium') return true;
        if (appliedFilters.low && task.priority === 'Low') return true;
        if (appliedFilters.noStatus && task.priority === 'Add status') return true;
        return false;
      });
    }

    // Finally apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortColumn === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortColumn === 'startDate' || sortColumn === 'endDate') {
          const aDate = parseDateString(a[sortColumn]);
          const bDate = parseDateString(b[sortColumn]);
          aValue = aDate ? aDate.getTime() : 0;
          bValue = bDate ? bDate.getTime() : 0;
        } else if (sortColumn === 'priority') {
          // Priority order: High > Medium > Low > Add status
          const priorityOrder: Record<string, number> = {
            High: 3,
            Medium: 2,
            Low: 1,
            'Add status': 0,
          };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
        } else {
          return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Draggable Task Row Component
  const DraggableTask = ({ task, children }: { task: Task; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: task.id,
    });

    return (
      <Box
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        opacity={isDragging ? 0.5 : 1}
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
      >
        {children}
      </Box>
    );
  };

  // Droppable Zone Component
  const DroppableZone = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
      <Box ref={setNodeRef} borderRadius="8px" transition="all 0.2s">
        {children}
      </Box>
    );
  };

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
        <Flex minH="100vh" direction="column" bg="white" align="center" justify="center">
          <FiLoader size="48px" color={veniceBlue} />
          <Text mt="4" fontSize="18px" color={veniceBlue}>
            Loading tasks...
          </Text>
        </Flex>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Flex minH="100vh" direction="column" bg="white">
          <AdminHeader />

          {/* Main Content */}
          <Box flex="1" px="100px" pt="53px" pb="53px">
            <Flex direction="column" gap="53px">
              {/* Header */}
              <Box>
                <Heading1 color={black} mb="53px">
                  Tasks
                </Heading1>

                <Flex justify="space-between" align="center">
                  {/* Navigation Tabs */}
                  <Flex gap="16px">
                    {[
                      { name: 'Unassigned', icon: FiClipboard },
                      { name: 'My Tasks', icon: FiUser },
                      { name: 'Team Tasks', icon: FiUsers },
                      { name: 'Completed', icon: FiCheckCircle },
                    ].map((tab) => (
                      <DroppableZone key={tab.name} id={tab.name}>
                        <Box
                          as="button"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap="12px"
                          px="32px"
                          py="16px"
                          bg={activeTab === tab.name ? white : lightBg}
                          color={veniceBlue}
                          border="2px solid"
                          borderColor={
                            overId === tab.name
                              ? lightGray
                              : activeTab === tab.name
                              ? borderActive
                              : lightBg
                          }
                          borderRadius="8px"
                          fontFamily="'Open Sans', sans-serif"
                          fontWeight={600}
                          fontSize="20px"
                          lineHeight="1.36"
                          letterSpacing="-1.5%"
                          opacity={0.85}
                          boxShadow={activeTab !== tab.name ? shadow.sm : 'none'}
                          onClick={() => setActiveTab(tab.name)}
                          _hover={{
                            bg: activeTab === tab.name ? white : lightBgHover,
                          }}
                          minW="fit-content"
                          whiteSpace="nowrap"
                          cursor="pointer"
                        >
                          <tab.icon size="24px" />
                          {tab.name}
                        </Box>
                      </DroppableZone>
                    ))}
                  </Flex>

                  {/* Controls */}
                  <Flex align="center" gap="40px">
                    {/* View Dropdown - hidden when search is open */}
                    {!isSearchOpen && (
                      <ViewDropdown viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}

                    {/* Filter Dropdown - hidden when search is open */}
                    {!isSearchOpen && (
                      <FilterDropdown
                        appliedFilters={appliedFilters}
                        onApplyFilters={handleApplyFilters}
                      />
                    )}

                    {/* Search */}
                    {!isSearchOpen ? (
                      <Box
                        as="button"
                        onClick={() => setIsSearchOpen(true)}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FiSearch size="28px" color={textPrimary} />
                      </Box>
                    ) : (
                      <Box
                        display="flex"
                        alignItems="center"
                        gap="8px"
                        px="14px"
                        py="17px"
                        bg={white}
                        border={`1px solid ${gray300}`}
                        borderRadius="8px"
                        boxShadow={shadow.sm}
                        w="245px"
                      >
                        <FiSearch size="20px" color={veniceBlue} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => {
                            if (!searchQuery.trim()) {
                              setIsSearchOpen(false);
                            }
                          }}
                          placeholder="Type to search..."
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '20px',
                            fontWeight: 400,
                            color: textPrimary,
                          }}
                        />
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </Box>

              {/* Tasks Table - List View */}
              {viewMode === 'list' && (
                <Box>
                  {/* Table Header */}
                  <TableHeader
                    showTypeColumn={true}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />

                  {/* Task Rows */}
                  <Flex direction="column" w="full">
                    {filteredTasks.map((task, index) => (
                      <DraggableTask key={task.id} task={task}>
                        <Box>
                          <TaskRow
                            task={task}
                            onCheck={handleTaskCheck}
                            onTaskClick={openTaskPopup}
                            admins={admins}
                            showTypeColumn={true}
                            showDivider={index < filteredTasks.length - 1}
                          />
                        </Box>
                      </DraggableTask>
                    ))}
                  </Flex>
                </Box>
              )}

              {/* Tasks Table - Grouped View */}
              {viewMode === 'grouped' && (
                <Box>
                  {taskCategories.map((category) => {
                    const categoryTasks = filteredTasks.filter(
                      (task) => task.category === category.categoryKey,
                    );
                    const isExpanded = expandedCategories.includes(category.id);

                    return (
                      <Box key={category.id} mb="24px">
                        {/* Category Header */}
                        <Box
                          bg={category.bgColor}
                          borderRadius="8px"
                          px="11px"
                          py="7px"
                          cursor="pointer"
                          onClick={() => toggleCategoryExpansion(category.id)}
                          _hover={{ opacity: 0.9 }}
                        >
                          <Flex align="center" gap="9px">
                            {isExpanded ? (
                              <FiChevronDown size="28px" color={black} />
                            ) : (
                              <FiChevronRight size="28px" color={black} />
                            )}
                            <Text
                              fontFamily="'Open Sans', sans-serif"
                              fontWeight={600}
                              fontSize="24px"
                              letterSpacing="-1.5%"
                              color={black}
                            >
                              {category.name}
                            </Text>
                            <Text
                              fontFamily="'Open Sans', sans-serif"
                              fontWeight={600}
                              fontSize="24px"
                              letterSpacing="-1.5%"
                              color={mutedText}
                            >
                              {categoryTasks.length}
                            </Text>
                          </Flex>
                        </Box>

                        {/* Category Tasks */}
                        {isExpanded && categoryTasks.length > 0 && (
                          <Box mt="18px">
                            {/* Table Header for Category */}
                            <TableHeader
                              showTypeColumn={false}
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />

                            {/* Task Rows for Category */}
                            <Flex direction="column" w="full">
                              {categoryTasks.map((task, index) => (
                                <DraggableTask key={task.id} task={task}>
                                  <Box>
                                    <TaskRow
                                      task={task}
                                      onCheck={handleTaskCheck}
                                      onTaskClick={openTaskPopup}
                                      admins={admins}
                                      showTypeColumn={false}
                                      showDivider={index < categoryTasks.length - 1}
                                    />
                                  </Box>
                                </DraggableTask>
                              ))}
                            </Flex>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Flex>
          </Box>
        </Flex>

        {/* Task Popup Modal */}
        <TaskEditModal
          task={selectedTask}
          isOpen={isPopupOpen}
          onClose={closeTaskPopup}
          onUpdateField={updateTaskField}
          admins={admins}
          currentUser={currentUser}
        />

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
          {activeId ? (
            <Flex
              bg={overId ? lightGray : tealBlue}
              borderRadius="8px"
              w="246px"
              h="71px"
              align="center"
              justify="center"
              gap="12px"
              boxShadow={shadow.lg}
              cursor="grabbing"
              transition="background-color 0.2s"
            >
              <FiFolder size="24px" color={overId ? veniceBlue : white} />
              <Text
                fontFamily="'Open Sans', sans-serif"
                fontWeight={600}
                fontSize="20px"
                lineHeight="1.36"
                color={overId ? veniceBlue : white}
              >
                Move 1 task
              </Text>
            </Flex>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ProtectedPage>
  );
}
