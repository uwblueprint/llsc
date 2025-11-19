import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Spinner,
  SimpleGrid,
  IconButton,
  Grid,
  GridItem,
  Input,
} from '@chakra-ui/react';
import { FiEdit2, FiUser, FiFileText, FiUsers, FiHeart } from 'react-icons/fi';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { UserRole } from '@/types/authTypes';
import { getUserById } from '@/APIClients/authAPIClient';
import { UserResponse } from '@/types/userTypes';
import { COLORS } from '@/constants/colors';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { formatDateLong } from '@/utils/dateUtils';

// Helper to format array of strings (e.g. pronouns)
const formatArray = (arr?: string[] | null) => {
  if (!arr || arr.length === 0) return 'N/A';
  return arr.join(', ');
};

export default function AdminUserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userData = await getUserById(id as string);
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]}>
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="xl" color={COLORS.veniceBlue} />
        </Flex>
      </ProtectedPage>
    );
  }

  if (!user) {
    return (
      <ProtectedPage allowedRoles={[UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]}>
        <AdminHeader />
        <Box p={8}>
          <Text>User not found</Text>
        </Box>
      </ProtectedPage>
    );
  }

  const role = roleIdToUserRole(user.roleId);
  const userData = user.userData;
  const volunteerData = user.volunteerData;

  // Determine active tab based on route or query param
  const activeTab = router.query.tab as string || 'profile';
  const isProfileActive = activeTab === 'profile' || !router.query.tab;
  const isFormsActive = activeTab === 'forms';
  const isMatchesActive = activeTab === 'matches';

  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]}>
        <AdminHeader />
        <Flex minH="calc(100vh - 72px)" bg="gray.50">
          {/* Left Sidebar */}
          <Box w="320px" p={8} display={{ base: 'none', md: 'block' }} bg="white">
            <Box 
              border="1px solid" 
              borderColor={COLORS.grayBorder} 
              borderRadius="md" 
              overflow="hidden"
              mb={8}
            >
              <VStack align="stretch" gap={0}>
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  bg={isProfileActive ? 'blue.50' : 'transparent'}
                  color={isProfileActive ? COLORS.veniceBlue : COLORS.textSecondary} 
                  fontWeight={isProfileActive ? 600 : 400}
                  fontSize="sm"
                  px={4}
                  py={3}
                  borderRadius={0}
                  _hover={{ bg: isProfileActive ? 'blue.100' : COLORS.hoverBg }}
                  _active={{ bg: isProfileActive ? 'blue.100' : COLORS.hoverBg }}
                >
                <HStack gap={3}>
                    <FiUser size={16} />
                  <Text>Profile Information</Text>
                </HStack>
              </Button>
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  bg={isFormsActive ? 'blue.50' : 'transparent'}
                  color={isFormsActive ? COLORS.veniceBlue : COLORS.textSecondary} 
                  fontWeight={isFormsActive ? 600 : 400}
                  fontSize="sm"
                  px={4}
                  py={3}
                  borderRadius={0}
                  _hover={{ bg: isFormsActive ? 'blue.100' : COLORS.hoverBg }}
                  _active={{ bg: isFormsActive ? 'blue.100' : COLORS.hoverBg }}
                >
                <HStack gap={3}>
                    <FiFileText size={16} />
                  <Text>Forms</Text>
                </HStack>
              </Button>
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  bg={isMatchesActive ? 'blue.50' : 'transparent'}
                  color={isMatchesActive ? COLORS.veniceBlue : COLORS.textSecondary} 
                  fontWeight={isMatchesActive ? 600 : 400}
                  fontSize="sm"
                  px={4}
                  py={3}
                  borderRadius={0}
                  _hover={{ bg: isMatchesActive ? 'blue.100' : COLORS.hoverBg }}
                  _active={{ bg: isMatchesActive ? 'blue.100' : COLORS.hoverBg }}
                >
                <HStack gap={3}>
                    <FiUsers size={16} />
                  <Text>Matches</Text>
                </HStack>
              </Button>
            </VStack>
            </Box>

            {/* Profile Summary Card */}
            <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor={COLORS.grayBorder} mt={6}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="sm" color={COLORS.veniceBlue} fontWeight={600}>Profile Summary</Heading>
                    <IconButton aria-label="Edit" variant="ghost" size="sm" color={COLORS.veniceBlue} _hover={{ bg: 'blue.50', color: COLORS.veniceBlue }}>
                      <FiEdit2 />
                    </IconButton>
                </Flex>
                <VStack align="stretch" gap={4}>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Name</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{user.firstName} {user.lastName}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Email Address</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{user.email}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Birthday</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.dateOfBirth ? formatDateLong(userData.dateOfBirth) : 'N/A'}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Phone Number</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.phone || 'N/A'}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Gender</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.genderIdentity || 'N/A'}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Pronouns</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{formatArray(userData?.pronouns)}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Time Zone</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>{userData?.timezone || 'N/A'}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color={COLORS.textSecondary} mb={1}>Location</Text>
                        <Text fontSize="sm" color={COLORS.veniceBlue}>
                            {[userData?.city, userData?.province].filter(Boolean).join(', ') || 'N/A'}
                        </Text>
                    </Box>
                </VStack>
            </Box>
          </Box>

          {/* Main Content */}
          <Box flex="1" p={8} bg="white">
            <Box maxW="1000px">
              {/* Header Section */}
              <Flex justify="space-between" align="start" mb={8}>
                <Box>
                    <Heading 
                        color={COLORS.veniceBlue} 
                        fontWeight={600} 
                        fontSize="34px"
                        lineHeight="1.36em"
                        letterSpacing="-0.015em"
                        mb={1}
                    >
                                {user.firstName} {user.lastName}
                            </Heading>
                    <Text 
                        color={COLORS.textSecondary} 
                        fontSize="20px" 
                        fontWeight={600} 
                        lineHeight="1.36em"
                        letterSpacing="-0.015em"
                        textTransform="capitalize" 
                        mt={1}
                    >
                        {role}
                    </Text>
                </Box>
                <VStack align="flex-end" gap={2}>
                  <Button 
                    variant="ghost" 
                    color={COLORS.red} 
                    _hover={{ textDecoration: 'underline', bg: 'transparent' }} 
                    fontSize="sm" 
                    fontWeight={400}
                    p={0}
                    h="auto"
                    textDecoration="underline"
                  >
                    Deactivate Account
                  </Button>
                  <Button 
                    bg={COLORS.red} 
                    color="white" 
                    _hover={{ bg: '#8a0000' }} 
                    fontSize="sm" 
                    fontWeight={600}
                    px={8} 
                    py={3}
                    borderRadius="md"
                  >
                    Delete Account
                  </Button>
                </VStack>
              </Flex>

              {/* Overview - Only for Volunteers */}
              {role === UserRole.VOLUNTEER && (
                <>
                  <Box mb={10}>
                    <Heading 
                        color={COLORS.veniceBlue} 
                        mb={2} 
                        fontWeight={600}
                        fontSize="16px"
                        lineHeight="1.875em"
                    >
                        Overview
                    </Heading>
                    <Text 
                        color={COLORS.textPrimary} 
                        fontSize="16px" 
                        fontWeight={400}
                        lineHeight="1.36em"
                    >
                      {volunteerData?.experience || userData?.additionalInfo || "No overview provided."}
                    </Text>
                  </Box>
                  
                  <Box borderBottom="1px solid" borderColor={COLORS.grayBorder} mb={8} />
                </>
              )}
              
              {/* Detailed Info */}
              <VStack align="stretch" gap={8}>
                      {/* User's Own Cancer Experience (only if user has cancer) */}
                      {userData?.hasBloodCancer === 'yes' && (
                      <Box>
                         <Heading 
                            color={COLORS.veniceBlue} 
                            mb={6} 
                            fontWeight={600}
                            fontSize="22px"
                            lineHeight="1.82em"
                         >
                            Blood cancer experience information
                         </Heading>
                         
                         <SimpleGrid columns={2} gap={8}>
                            <Box>
                               <Flex justify="space-between" align="center" mb={2}>
                                  <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Diagnosis</Text>
                                  <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                               </Flex>
                               <Flex gap={2} flexWrap="wrap">
                                  {userData?.diagnosis ? (
                                    <Badge bg={COLORS.bgTealLight} color={COLORS.tealDarker} px={3} py={1} borderRadius="full" fontSize="14px" fontWeight={400} lineHeight="1.43em">
                                      {userData.diagnosis}
                                    </Badge>
                                  ) : (
                                    <Text color={COLORS.textSecondary} fontSize="16px" fontWeight={400} lineHeight="1.5em">N/A</Text>
                                  )}
                               </Flex>
                            </Box>
                            <Box>
                               <Flex justify="space-between" align="center" mb={2}>
                                  <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Date of Diagnosis</Text>
                                  <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                               </Flex>
                               <Text color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.875em">{userData?.dateOfDiagnosis ? formatDateLong(userData.dateOfDiagnosis) : 'N/A'}</Text>
                            </Box>
                            
                            <Box>
                               <Flex justify="space-between" align="center" mb={2}>
                                  <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Treatments</Text>
                                  <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                               </Flex>
                               <VStack align="start" gap={1}>
                                  {userData?.treatments?.length ? (
                                     userData.treatments.map(t => <Text key={t.id} color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.5em">{t.name}</Text>)
                                  ) : <Text color={COLORS.textSecondary} fontSize="16px" fontWeight={400} lineHeight="1.5em">None listed</Text>}
                               </VStack>
                            </Box>

                            <Box>
                               <Flex justify="space-between" align="center" mb={2}>
                                  <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Experiences</Text>
                                  <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                               </Flex>
                               <VStack align="start" gap={1}>
                                  {userData?.experiences?.length ? (
                                     userData.experiences.map(e => <Text key={e.id} color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.5em">{e.name}</Text>)
                                  ) : <Text color={COLORS.textSecondary} fontSize="16px" fontWeight={400} lineHeight="1.5em">None listed</Text>}
                               </VStack>
                            </Box>
                         </SimpleGrid>
                      </Box>
                      )}

                      {/* Divider between user's own info and loved one info */}
                      {userData?.hasBloodCancer === 'yes' && userData?.caringForSomeone === 'yes' && (
                      <Box borderBottom="1px solid" borderColor={COLORS.grayBorder} />
                      )}

                      {/* Loved One Info (only if user is caring for someone) */}
                      {userData?.caringForSomeone === 'yes' && (
                         <Box>
                            {userData?.hasBloodCancer !== 'yes' && (
                              <Heading 
                                color={COLORS.veniceBlue} 
                                mb={6} 
                                fontWeight={600}
                                fontSize="22px"
                                lineHeight="1.82em"
                              >
                                Blood cancer experience information
                              </Heading>
                            )}
                            {userData?.hasBloodCancer === 'yes' && (
                              <Heading 
                                color={COLORS.veniceBlue} 
                                mb={6} 
                                fontWeight={600}
                                fontSize="22px"
                                lineHeight="1.82em"
                              >
                                Loved One&apos;s Blood cancer experience information
                              </Heading>
                            )}
                            <SimpleGrid columns={2} gap={8}>
                               <Box>
                                  <Flex align="center" gap={2} mb={2}>
                                    <FiHeart size={14} color={COLORS.veniceBlue} />
                                    <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Loved One&apos;s Diagnosis</Text>
                                  </Flex>
                                    <Input 
                                      value={userData.lovedOneDiagnosis || 'N/A'} 
                                      readOnly 
                                      bg="gray.50" 
                                      borderRadius="md" 
                                      color={COLORS.textPrimary}
                                    w="100%"
                                    pl={4}
                                    />
                               </Box>
                               <Box>
                                  <Flex align="center" gap={2} mb={2}>
                                    <FiHeart size={14} color={COLORS.veniceBlue} />
                                    <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Loved One&apos;s Date of Diagnosis</Text>
                                  </Flex>
                                    <Input 
                                      value={userData?.lovedOneDateOfDiagnosis ? formatDateLong(userData.lovedOneDateOfDiagnosis) : 'N/A'} 
                                      readOnly 
                                      bg="gray.50" 
                                      borderRadius="md" 
                                      color={COLORS.textPrimary}
                                    w="100%"
                                    pl={4}
                                    />
                               </Box>

                               <Box>
                                  <Flex justify="space-between" align="center" mb={2}>
                                    <Flex align="center" gap={2}>
                                      <FiHeart size={14} color={COLORS.veniceBlue} />
                                      <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Treatments Loved One Has Done</Text>
                                    </Flex>
                                    <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                                  </Flex>
                                  <VStack align="start" gap={1}>
                                     {userData?.lovedOneTreatments?.length ? (
                                        userData.lovedOneTreatments.map(t => <Text key={t.id} color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.5em">{t.name}</Text>)
                                     ) : <Text color={COLORS.textSecondary} fontSize="16px" fontWeight={400} lineHeight="1.5em">None listed</Text>}
                                  </VStack>
                               </Box>

                               <Box>
                                  <Flex justify="space-between" align="center" mb={2}>
                                    <Flex align="center" gap={2}>
                                      <FiHeart size={14} color={COLORS.veniceBlue} />
                                      <Text fontWeight={600} color={COLORS.veniceBlue} fontSize="16px" lineHeight="1.875em">Experiences Loved One Had</Text>
                                    </Flex>
                                    <Button 
                                    size="xs" 
                                    bg={COLORS.teal} 
                                    color="white" 
                                    fontSize="sm" 
                                    fontWeight={500} 
                                    px={4.5}
                                    py={2}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={COLORS.teal}
                                    boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                                    _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                                  >
                                    Edit
                                  </Button>
                                  </Flex>
                                  <VStack align="start" gap={1}>
                                     {userData?.lovedOneExperiences?.length ? (
                                        userData.lovedOneExperiences.map(e => <Text key={e.id} color={COLORS.textPrimary} fontSize="16px" fontWeight={400} lineHeight="1.5em">{e.name}</Text>)
                                     ) : <Text color={COLORS.textSecondary} fontSize="16px" fontWeight={400} lineHeight="1.5em">None listed</Text>}
                                  </VStack>
                               </Box>
                            </SimpleGrid>
                         </Box>
                      )}

                      {/* Availability - Only for Volunteers */}
                      {role === UserRole.VOLUNTEER && (
                      <Box>
                         <Flex justify="space-between" align="center" mb={6}>
                            <Heading 
                                color={COLORS.veniceBlue} 
                                fontWeight={600}
                                fontSize="22px"
                                lineHeight="1.82em"
                            >
                                Availability
                            </Heading>
                            <Button 
                              size="sm" 
                              bg={COLORS.teal} 
                              color="white" 
                              fontSize="sm" 
                              fontWeight={500} 
                              px={4.5}
                              py={2}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={COLORS.teal}
                              boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                              _hover={{ bg: COLORS.tealDarker, borderColor: COLORS.tealDarker }}
                            >
                              Edit
                            </Button>
                         </Flex>
                         
                         <Flex gap={8} align="flex-start">
                            {/* Grid */}
                            <Box flex="1" overflowX="auto">
                              <Grid templateColumns="80px repeat(7, 1fr)" gap={0} border="1px solid" borderColor={COLORS.grayBorder} borderRadius="md">
                                {/* Header Row */}
                                <GridItem p={2} borderBottom="1px solid" borderColor={COLORS.grayBorder} bg="gray.50">
                                  <Text fontSize="xs" color={COLORS.textSecondary} fontWeight="bold">EST</Text>
                                </GridItem>
                                {['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                  <GridItem key={day} p={2} borderBottom="1px solid" borderLeft="1px solid" borderColor={COLORS.grayBorder} bg="gray.50" textAlign="center">
                                    <Text fontSize="xs" color={COLORS.textSecondary} fontWeight="bold">{day}</Text>
                                  </GridItem>
                                ))}

                                {/* Time Rows */}
                                {[
                                  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                                  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
                                  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
                                ].map((time, timeIndex) => {
                                  const isHour = timeIndex % 2 === 0;
                                  return (
                                  <React.Fragment key={time}>
                                    {/* Time Label */}
                                    <GridItem 
                                      p={1} 
                                      pl={2}
                                      borderTop={timeIndex > 0 ? (isHour ? "1px solid" : "1px dashed") : "none"} 
                                      borderColor={COLORS.grayBorder} 
                                      bg="white"
                                      display="flex"
                                      alignItems="center"
                                    >
                                      <Text fontSize="xs" color={COLORS.textSecondary} fontWeight={isHour ? "bold" : "normal"}>{time}</Text>
                                    </GridItem>
                                    
                                    {/* Days */}
                                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                                      const isAvailable = user.availability?.some(block => {
                                        const date = new Date(block.startTime);
                                        // Adjust for timezone if needed. 
                                        // Assuming block.startTime is ISO string and we want to display in local time or specific timezone.
                                        // For now, let's assume the backend returns UTC and we want to display in EST (as per header).
                                        // Ideally we should use a library like date-fns-tz or moment-timezone.
                                        // But for this simplified view, let's just check getDay/getHours/getMinutes.
                                        
                                        const jsDay = date.getDay(); // 0=Sun, 1=Mon...
                                        const gridDay = jsDay === 0 ? 6 : jsDay - 1;
                                        
                                        const hour = date.getHours();
                                        const minute = date.getMinutes();
                                        
                                        // Calculate target hour and minute based on timeIndex
                                        // timeIndex 0 -> 8:00, 1 -> 8:30, 2 -> 9:00...
                                        const targetHour = 8 + Math.floor(timeIndex / 2);
                                        const targetMinute = (timeIndex % 2) * 30;
                                        
                                        return gridDay === dayIndex && hour === targetHour && minute === targetMinute;
                                      });

                                      return (
                                        <GridItem 
                                          key={dayIndex} 
                                          borderTop={timeIndex > 0 ? (isHour ? "1px solid" : "1px dashed") : "none"} 
                                          borderLeft="1px solid" 
                                          borderColor={COLORS.grayBorder}
                                          bg={isAvailable ? '#FFF4E6' : 'white'}
                                          h="30px"
                                        />
                                      );
                                    })}
                                  </React.Fragment>
                                )})}
                              </Grid>
                            </Box>

                            {/* Summary Sidebar */}
                            <Box w="200px">
                              <Heading size="xs" mb={4} color={COLORS.veniceBlue}>Your Availability</Heading>
                              <VStack align="stretch" gap={4}>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                                  // Filter blocks for this day
                                  // Note: getDay() returns 0 for Sunday, 1 for Monday, etc.
                                  // Our map index 0 is Monday, so we need to match correctly.
                                  // Monday (index 0) -> getDay() 1
                                  // ...
                                  // Saturday (index 5) -> getDay() 6
                                  // Sunday (index 6) -> getDay() 0
                                  const targetDay = index === 6 ? 0 : index + 1;
                                  
                                  const dayBlocks = user.availability?.filter(block => {
                                    const date = new Date(block.startTime);
                                    return date.getDay() === targetDay;
                                  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                                  if (!dayBlocks || dayBlocks.length === 0) {
                                    return null;
                                  }

                                  // Group contiguous blocks into ranges
                                  const ranges: { start: Date; end: Date }[] = [];
                                  if (dayBlocks.length > 0) {
                                    let currentStart = new Date(dayBlocks[0].startTime);
                                    let currentEnd = new Date(dayBlocks[0].startTime);
                                    currentEnd.setMinutes(currentEnd.getMinutes() + 30); // Each block is 30 mins

                                    for (let i = 1; i < dayBlocks.length; i++) {
                                      const nextBlockStart = new Date(dayBlocks[i].startTime);
                                      if (nextBlockStart.getTime() === currentEnd.getTime()) {
                                        // Contiguous, extend current range
                                        currentEnd.setMinutes(currentEnd.getMinutes() + 30);
                                      } else {
                                        // Gap found, push current range and start new one
                                        ranges.push({ start: currentStart, end: currentEnd });
                                        currentStart = nextBlockStart;
                                        currentEnd = new Date(nextBlockStart);
                                        currentEnd.setMinutes(currentEnd.getMinutes() + 30);
                                      }
                                    }
                                    ranges.push({ start: currentStart, end: currentEnd });
                                  }

                                  return (
                                  <Box key={day}>
                                    <Text fontSize="xs" mb={1} color={COLORS.textPrimary}>{day}:</Text>
                                    <Flex gap={2} flexWrap="wrap">
                                        {ranges.map((range, i) => {
                                          // Format time: 12:00 PM - 4:00 PM
                                          // Using a simple formatter for now
                                          const formatTime = (date: Date) => {
                                            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                          };
                                          return (
                                            <Badge key={i} bg={COLORS.bgTealLight} color={COLORS.tealDarker} fontSize="xs" textTransform="none" borderRadius="full">
                                              {formatTime(range.start)} - {formatTime(range.end)}
                                            </Badge>
                                          );
                                        })}
                                    </Flex>
                                  </Box>
                                  );
                                })}
                              </VStack>
                            </Box>
                         </Flex>
                      </Box>
                      )}
              </VStack>
            </Box>
          </Box>
        </Flex>
    </ProtectedPage>
  );
}
