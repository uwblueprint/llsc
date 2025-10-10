import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Table, IconButton, Input, Badge } from '@chakra-ui/react';
import { FiSearch, FiMenu } from 'react-icons/fi';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { DirectoryProgressSlider } from '@/components/ui/directory-progress-slider';
import { DirectoryDataProvider } from '@/components/admin/DirectoryDataProvider';
import {
    MenuContent,
    MenuItem,
    MenuRoot,
    MenuTrigger,
} from '@chakra-ui/react';
import {
    LightMode
} from "@/components/ui/color-mode"

const veniceBlue = '#1d3448';

type FormStatus =
    | 'intake-todo'
    | 'intake-submitted'
    | 'ranking-todo'
    | 'ranking-submitted'
    | 'secondary-application-todo'
    | 'secondary-application-submitted';

interface DirectoryUser {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    roleId: number;
    formStatus: FormStatus;
}
// Mock data - replace with API call
// const mockUsers = [
//     { id: '1', name: 'Randy Philips', language: 'English', assigned: 'Volunteer', status: '0%', progress: 0, currentStep: 'Intake form' },
//     { id: '2', name: 'Ann Vaccaro', language: 'English', assigned: 'Volunteer', status: '0%', progress: 0, currentStep: 'Intake form' },
//     { id: '3', name: 'Kaylynn Dias', language: 'French', assigned: 'Participant', status: '0%', progress: 0, currentStep: 'Intake form' },
//     { id: '4', name: 'Kierra Calzoni', language: 'English', assigned: 'Volunteer', status: '25%', progress: 25, currentStep: 'Screen calling' },
//     { id: '5', name: 'Terry Baptista', language: 'French', assigned: 'Participant', status: '50%', progress: 50, currentStep: 'Screen calling' },
//     { id: '6', name: 'Kaylynn Curtis', language: 'English', assigned: 'Volunteer', status: '25%', progress: 25, currentStep: 'Intake form' },
//     { id: '7', name: 'Livia Siphron', language: 'French', assigned: 'Participant', status: '25%', progress: 25, currentStep: 'Screen calling' },
//     { id: '8', name: 'James Levin', language: 'French', assigned: 'Participant', status: '100%', progress: 100, currentStep: 'Ranking' },
//     { id: '9', name: 'Desirae Dias', language: 'French', assigned: 'Participant', status: '100%', progress: 100, currentStep: 'Ranking' },
//     { id: '10', name: 'Desirae Franci', language: 'English', assigned: 'Volunteer', status: '100%', progress: 100, currentStep: 'Secondary application' },
//     { id: '11', name: 'Lincoln Rosser', language: 'English', assigned: 'Volunteer', status: '100%', progress: 100, currentStep: 'Secondary application' },
//     { id: '12', name: 'Gretchen Carder', language: 'French', assigned: 'Participant', status: '0%', progress: 0, currentStep: 'Matched' },
//     { id: '13', name: 'Miracle Kenter', language: 'English', assigned: 'Volunteer', status: '0%', progress: 0, currentStep: 'Training' },
//     { id: '14', name: 'Aspen Vaccaro', language: 'French', assigned: 'Participant', status: '0%', progress: 0, currentStep: 'Rejected' },
//     { id: '15', name: 'Kierra Boscch', language: 'English', assigned: 'Volunteer', status: '0%', progress: 0, currentStep: 'Rejected' },
// ];

const formStatusMap: Record<FormStatus, { label: string; progress: number }> = {
    'intake-todo': {
        label: 'Intake form',
        progress: 25
    },
    'intake-submitted': {
        label: 'Screen calling',
        progress: 50
    },
    'ranking-todo': {
        label: 'Ranking',
        progress: 75
    },
    'ranking-submitted': {
        label: 'Matched',
        progress: 100
    },
    'secondary-application-todo': {
        label: 'Secondary Application',
        progress: 75,
    },
    'secondary-application-submitted': {
        label: 'Training',
        progress: 100,
    }
}

const getStatusColor = (step: string) => {
    const lowerStep = step.toLowerCase();
    if (lowerStep.includes('training')) return 'blue';
    if (lowerStep.includes('rejected')) return 'red';
    if (lowerStep.includes('matched')) return 'green';
    if (lowerStep.includes('ranking')) return 'teal';
    if (lowerStep.includes('secondary')) return 'purple';
    if (lowerStep.includes('screen')) return 'orange';
    return 'gray';
};

export default function Directory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'nameAsc' | 'nameDsc' | 'statusAsc' | 'statusDsc'>('nameAsc');

    return (
        <ProtectedPage allowedRoles={[UserRole.ADMIN, UserRole.VOLUNTEER]}>
            <DirectoryDataProvider>
                {(users, loading, error) => {
                    const filteredUsers = users.filter((user: any) => {
                        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
                        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesStatus = !statusFilter || user.form_status === statusFilter;
                        return matchesSearch && matchesStatus;
                    });

                    const handleSelectAll = (e: any) => {
                        if (e.checked) {
                            setSelectedUsers(new Set(filteredUsers.map((u: any) => u.id)));
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
                            <Box p={8} bg="white" minH="100vh" marginLeft={157} marginRight={130}>
                                <Heading
                                    as="h1"
                                    fontFamily="'Open Sans', sans-serif"
                                    fontWeight={600}
                                    color={veniceBlue}
                                    fontSize="3xl"
                                    mb={6}
                                >
                                    Directory
                                </Heading>

                                {/* Search and Actions Bar */}
                                <Flex mb={6} gap={4} align="center">
                                    <Box position="relative" maxW="400px">
                                        <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" zIndex={1}>
                                            <FiSearch color="gray" />
                                        </Box>
                                        <Input
                                            placeholder="Search by name..."
                                            bg="white"
                                            pl="40px"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </Box>

                                    <MenuRoot>
                                        <MenuTrigger asChild>
                                            <IconButton variant="outline" bg="white" aria-label="Filter">
                                                <FiMenu />
                                            </IconButton>
                                        </MenuTrigger>
                                        <MenuContent>
                                            <MenuItem value="all" onClick={() => setStatusFilter(null)}>
                                                All
                                            </MenuItem>
                                            <MenuItem value="intake" onClick={() => setStatusFilter('Intake form')}>
                                                Intake form
                                            </MenuItem>
                                            <MenuItem value="screen" onClick={() => setStatusFilter('Screen calling')}>
                                                Screen calling
                                            </MenuItem>
                                            <MenuItem value="ranking" onClick={() => setStatusFilter('Ranking')}>
                                                Ranking
                                            </MenuItem>
                                            <MenuItem value="secondary" onClick={() => setStatusFilter('Secondary application')}>
                                                Secondary application
                                            </MenuItem>
                                            <MenuItem value="matched" onClick={() => setStatusFilter('Matched')}>
                                                Matched
                                            </MenuItem>
                                            <MenuItem value="training" onClick={() => setStatusFilter('Training')}>
                                                Training
                                            </MenuItem>
                                            <MenuItem value="rejected" onClick={() => setStatusFilter('Rejected')}>
                                                Rejected
                                            </MenuItem>
                                        </MenuContent>
                                    </MenuRoot>
                                </Flex>

                                {/* Table */}
                                <Box bg="white" borderRadius="md" overflow="hidden">
                                    <Table.Root variant="line">
                                        <Table.Header bg="gray.100" color={'black'}>
                                            <Table.Row bg="white" color={'black'}>
                                                <Table.ColumnHeader width="40px" color={'black'}>
                                                    <Checkbox
                                                        checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'} width="12%" onClick={() => {
                                                    if (sortBy == 'nameDsc') {
                                                        setSortBy("nameAsc")
                                                    } else {
                                                        setSortBy('nameDsc')
                                                    }
                                                }}>Name {sortBy == 'nameAsc' ? '↑' : '↓'}</Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'} width="10%">Language</Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'} width="15%">Assigned</Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'} onClick={() => {
                                                    if (sortBy == 'statusDsc') {
                                                        setSortBy("statusAsc")
                                                    } else {
                                                        setSortBy('statusDsc')
                                                    }
                                                }}>Status {sortBy == 'statusAsc' ? '↑' : '↓'}</Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'} width="200px">{/* Search and Actions Bar */}
                                                    <Flex mb={6} gap={4} align="center">
                                                        <Box position="relative" maxW="400px">
                                                            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" zIndex={1}>
                                                                <FiSearch color="gray" />
                                                            </Box>
                                                            <Input
                                                                placeholder="Search by name..."
                                                                bg="white"
                                                                pl="40px"
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                            />
                                                        </Box>

                                                        <MenuRoot>
                                                            <MenuTrigger asChild>
                                                                <IconButton variant="outline" bg="white" aria-label="Filter">
                                                                    <FiMenu />
                                                                </IconButton>
                                                            </MenuTrigger>
                                                            <MenuContent position="absolute" marginTop="300px">
                                                                <MenuItem value="all" onClick={() => setStatusFilter(null)}>
                                                                    All
                                                                </MenuItem>
                                                                <MenuItem value="intake" onClick={() => setStatusFilter('Intake form')}>
                                                                    Intake form
                                                                </MenuItem>
                                                                <MenuItem value="screen" onClick={() => setStatusFilter('Screen calling')}>
                                                                    Screen calling
                                                                </MenuItem>
                                                                <MenuItem value="ranking" onClick={() => setStatusFilter('Ranking')}>
                                                                    Ranking
                                                                </MenuItem>
                                                                <MenuItem value="secondary" onClick={() => setStatusFilter('Secondary application')}>
                                                                    Secondary application
                                                                </MenuItem>
                                                                <MenuItem value="matched" onClick={() => setStatusFilter('Matched')}>
                                                                    Matched
                                                                </MenuItem>
                                                                <MenuItem value="training" onClick={() => setStatusFilter('Training')}>
                                                                    Training
                                                                </MenuItem>
                                                                <MenuItem value="rejected" onClick={() => setStatusFilter('Rejected')}>
                                                                    Rejected
                                                                </MenuItem>
                                                            </MenuContent>
                                                        </MenuRoot>
                                                    </Flex></Table.ColumnHeader>
                                                <Table.ColumnHeader color={'black'}></Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {filteredUsers.map((user: DirectoryUser) => {
                                                console.log(user);
                                                const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                                const roleName = (user.roleId === 2 ? 'Volunteer' : 'Participant');

                                                return (
                                                    <Table.Row key={user.id} bg={'white'} _hover={{ bg: 'gray.50' }}>
                                                        <Table.Cell>
                                                            <Checkbox
                                                                checked={selectedUsers.has(user.id.toString())}
                                                                onCheckedChange={(e) => handleSelectUser(user.id.toString(), !!e.checked)}
                                                            />
                                                        </Table.Cell>
                                                        <Table.Cell fontWeight={500}>{displayName}</Table.Cell>
                                                        <Table.Cell>
                                                            <Badge
                                                                colorPalette={'gray'}
                                                                variant="subtle"
                                                                borderRadius="full"
                                                                px={3}
                                                                py={1}
                                                            >
                                                                English
                                                            </Badge>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Badge
                                                                colorPalette={user.roleId === 2 ? 'pink' : 'purple'}
                                                                variant="subtle"
                                                                borderRadius="full"
                                                                px={3}
                                                                py={1}
                                                            >
                                                                {roleName}
                                                            </Badge>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <DirectoryProgressSlider value={formStatusMap[user.formStatus].progress} />
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Badge
                                                                colorPalette={getStatusColor(formStatusMap[user.formStatus].label || 'intake-submitted')}
                                                                variant="subtle"
                                                                borderRadius="md"
                                                                px={3}
                                                                py={1}
                                                            >
                                                                {formStatusMap[user.formStatus]?.label || 'intake-submitted'}
                                                            </Badge>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            })}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>
                            </Box>
                        </LightMode>
                    );
                }}
            </DirectoryDataProvider>
        </ProtectedPage>
    );
}
