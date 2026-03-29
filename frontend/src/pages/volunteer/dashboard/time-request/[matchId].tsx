import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Flex, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';

import baseAPIClient from '@/APIClients/baseAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';

interface VolunteerTimeBlock {
  id: number;
  startTime: string;
}

interface VolunteerMatch {
  id: number;
  matchStatus: string;
  participant: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    timezone?: string | null;
  };
  suggestedTimeBlocks?: VolunteerTimeBlock[];
}

interface GroupedTimeBlocks {
  [date: string]: VolunteerTimeBlock[];
}

export default function VolunteerTimeRequestPage() {
  const router = useRouter();
  const { matchId } = router.query;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<VolunteerMatch | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedTimeBlockIds, setSelectedTimeBlockIds] = useState<number[]>([]);
  const [isConfirmPromptOpen, setIsConfirmPromptOpen] = useState(false);
  const [isConfirmedModalOpen, setIsConfirmedModalOpen] = useState(false);
  const [confirmedTimeLabel, setConfirmedTimeLabel] = useState('');

  const loadMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      const response = await baseAPIClient.get('/matches/volunteer/me');
      const matches: VolunteerMatch[] = response.data.matches || [];
      const foundMatch = matches.find((item) => item.id === Number(matchId));

      if (!foundMatch) {
        router.push('/volunteer/dashboard');
        return;
      }

      setMatch(foundMatch);
    } catch (error) {
      console.error('Error loading volunteer match request:', error);
      router.push('/volunteer/dashboard');
    } finally {
      setLoading(false);
    }
  }, [matchId, router]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const groupedTimeBlocks = useMemo(() => {
    const groups: GroupedTimeBlocks = {};

    (match?.suggestedTimeBlocks || []).forEach((timeBlock) => {
      const date = new Date(timeBlock.startTime);
      const dateKey = date.toLocaleDateString('en-CA');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(timeBlock);
    });

    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    });

    return groups;
  }, [match]);

  const sortedDates = useMemo(() => Object.keys(groupedTimeBlocks).sort(), [groupedTimeBlocks]);

  const participantFirstName = match?.participant.firstName || '';
  const participantLastName = match?.participant.lastName || '';
  const participantShortName = participantFirstName
    ? `${participantFirstName} ${participantLastName?.charAt(0) ? participantLastName.charAt(0) + '.' : ''}`.trim()
    : match?.participant.email || '';

  const participantTimezone = match?.participant.timezone || 'EST';

  const formatDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const toggleTimeBlockSelection = (timeBlockId: number) => {
    setSelectedTimeBlockIds((current) => {
      if (current.includes(timeBlockId)) {
        return [];
      }
      return [timeBlockId];
    });
  };

  const handleConfirmSelection = () => {
    setIsConfirmPromptOpen(true);
  };

  const handleConfirmAgain = async () => {
    if (!match || selectedTimeBlockIds.length === 0) return;

    const timeBlockId = selectedTimeBlockIds[0];
    const selectedBlock = (match.suggestedTimeBlocks || []).find((tb) => tb.id === timeBlockId);

    try {
      await baseAPIClient.post(`/matches/${match.id}/accept-requested-times`, {
        timeBlockId,
      });

      let timeLabel = '';
      if (selectedBlock) {
        const date = new Date(selectedBlock.startTime);
        const dayStr = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        const timeStr = formatTime(selectedBlock.startTime);
        timeLabel = `${dayStr} at ${timeStr}`;
      }

      setConfirmedTimeLabel(timeLabel);
      setIsConfirmPromptOpen(false);
      setIsConfirmedModalOpen(true);
    } catch (error) {
      console.error('Error accepting requested times:', error);
      setIsConfirmPromptOpen(false);
      alert('Failed to confirm the selected time. Please try again.');
    }
  };

  const handleDeclineAll = async () => {
    if (!match) return;

    try {
      await baseAPIClient.post(`/matches/${match.id}/decline-requested-times`);
      router.push('/volunteer/dashboard');
    } catch (error) {
      console.error('Error declining requested times:', error);
      alert('Failed to decline. Please try again.');
    }
  };

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
        <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
          <VolunteerDashboardLayout hideSidebar>
            <Flex justify="center" align="center" minH="300px">
              <Spinner size="xl" color="#056067" />
            </Flex>
          </VolunteerDashboardLayout>
        </FormStatusGuard>
      </ProtectedPage>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <VolunteerDashboardLayout hideSidebar>
          <VStack align="stretch" gap={6}>
            {/* Back Button */}
            <HStack
              align="center"
              gap={1}
              cursor="pointer"
              w="fit-content"
              onClick={() => router.push('/volunteer/dashboard')}
              _hover={{ opacity: 0.7 }}
            >
              <FiChevronLeft size={20} strokeWidth={1.67} />
              <Text
                fontSize="16px"
                fontWeight={600}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
              >
                Back
              </Text>
            </HStack>

            {/* Title Section */}
            <VStack align="stretch" gap={4}>
              <Text
                fontSize={{ base: '24px', lg: '36px' }}
                fontWeight={600}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
                letterSpacing="-0.015em"
                lineHeight="1.36"
              >
                {participantShortName} has requested these times
              </Text>
              <Text
                fontSize={{ base: '16px', lg: '18px' }}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
                opacity={0.85}
                letterSpacing="-0.015em"
                lineHeight="1.36"
              >
                Schedule your meeting. If no times work for you,{' '}
                {participantFirstName || participantShortName} will be matched with a different
                volunteer.
              </Text>
            </VStack>

            {/* Select a Date Section */}
            <VStack align="stretch" gap={6}>
              <Text
                fontSize={{ base: '18px', lg: '22px' }}
                fontWeight={600}
                color="#1D3448"
                fontFamily="'Open Sans', sans-serif"
                letterSpacing="-0.015em"
                lineHeight="1.36"
              >
                Select a date
              </Text>

              {sortedDates.length === 0 ? (
                <Box border="1px solid #D5D7DA" borderRadius="8px" p={5} bg="white">
                  <Text color="#6B7280" fontFamily="'Open Sans', sans-serif">
                    No requested times were provided for this match yet.
                  </Text>
                </Box>
              ) : (
                <Flex gap="18px" wrap="wrap">
                  {sortedDates.map((dateKey) => {
                    const isExpanded = expandedDate === dateKey;
                    return (
                      <Box
                        key={dateKey}
                        border="1px solid"
                        borderColor={isExpanded ? '#5F989D' : '#D5D7DA'}
                        borderRadius="8px"
                        bg="white"
                        boxShadow={
                          isExpanded
                            ? '0px 0px 0px 4px rgba(179, 206, 209, 1)'
                            : '0px 1px 2px 0px rgba(10, 13, 18, 0.05)'
                        }
                        cursor="pointer"
                        onClick={() => setExpandedDate(isExpanded ? null : dateKey)}
                        w={{ base: '100%', lg: 'auto' }}
                        px={{ base: '20px', lg: '28px' }}
                        py={{ base: '16px', lg: '24px' }}
                        transition="all 0.15s ease"
                      >
                        <Text
                          fontSize="18px"
                          fontWeight={600}
                          color="#1D3448"
                          fontFamily="'Open Sans', sans-serif"
                          textAlign="center"
                          whiteSpace="nowrap"
                        >
                          {formatDate(dateKey)}
                        </Text>
                      </Box>
                    );
                  })}
                </Flex>
              )}
            </VStack>

            {/* Select a Time Section (shown when a date is expanded) */}
            {expandedDate && groupedTimeBlocks[expandedDate] && (
              <VStack align="stretch" gap={6}>
                <VStack align="stretch" gap={1}>
                  <Text
                    fontSize={{ base: '18px', lg: '22px' }}
                    fontWeight={600}
                    color="#1D3448"
                    fontFamily="'Open Sans', sans-serif"
                    letterSpacing="-0.015em"
                    lineHeight="1.36"
                  >
                    Select a time
                  </Text>
                  <Text
                    fontSize={{ base: '16px', lg: '18px' }}
                    color="#1D3448"
                    fontFamily="'Open Sans', sans-serif"
                    opacity={0.85}
                    letterSpacing="-0.015em"
                    lineHeight="1.36"
                  >
                    All times are in {participantTimezone}.
                  </Text>
                </VStack>

                <Flex gap="18px" wrap="wrap">
                  {groupedTimeBlocks[expandedDate].map((timeBlock) => {
                    const isSelected = selectedTimeBlockIds.includes(timeBlock.id);
                    return (
                      <Box
                        key={timeBlock.id}
                        border="1px solid"
                        borderColor={isSelected ? '#5F989D' : '#D5D7DA'}
                        borderRadius="8px"
                        bg={isSelected ? 'white' : 'white'}
                        boxShadow={
                          isSelected
                            ? '0px 0px 0px 4px rgba(179, 206, 209, 1)'
                            : '0px 1px 2px 0px rgba(10, 13, 18, 0.05)'
                        }
                        cursor="pointer"
                        onClick={() => toggleTimeBlockSelection(timeBlock.id)}
                        px={{ base: '20px', lg: '28px' }}
                        py={{ base: '16px', lg: '24px' }}
                        transition="all 0.15s ease"
                      >
                        <Text
                          fontSize="18px"
                          fontWeight={600}
                          color="#1D3448"
                          fontFamily="'Open Sans', sans-serif"
                          textAlign="center"
                          whiteSpace="nowrap"
                        >
                          {formatTime(timeBlock.startTime)}
                        </Text>
                      </Box>
                    );
                  })}
                </Flex>
              </VStack>
            )}

            {/* Action Buttons */}
            <Flex
              justify="space-between"
              pt={2}
              direction={{ base: 'column-reverse', lg: 'row' }}
              gap={{ base: 3, lg: 0 }}
            >
              <Button
                bg="#A70000"
                color="white"
                borderRadius="8px"
                px={{ base: '24px', lg: '42px' }}
                py={{ base: '12px', lg: '18px' }}
                h="auto"
                w={{ base: '100%', lg: 'auto' }}
                fontWeight={600}
                fontSize={{ base: '16px', lg: '20px' }}
                fontFamily="'Open Sans', sans-serif"
                border="1px solid #A70000"
                boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                _hover={{ bg: '#8A0000' }}
                _active={{ bg: '#700000' }}
                onClick={handleDeclineAll}
              >
                Decline All
              </Button>

              {selectedTimeBlockIds.length > 0 && (
                <Button
                  bg="#056067"
                  color="white"
                  borderRadius="8px"
                  px={{ base: '24px', lg: '42px' }}
                  py={{ base: '12px', lg: '18px' }}
                  h="auto"
                  w={{ base: '100%', lg: 'auto' }}
                  fontWeight={600}
                  fontSize={{ base: '16px', lg: '20px' }}
                  fontFamily="'Open Sans', sans-serif"
                  border="1px solid #056067"
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: '#044d52' }}
                  _active={{ bg: '#033a3e' }}
                  onClick={handleConfirmSelection}
                >
                  Confirm
                </Button>
              )}
            </Flex>
          </VStack>

          <VolunteerConfirmPromptModal
            isOpen={isConfirmPromptOpen}
            onCancel={() => setIsConfirmPromptOpen(false)}
            onConfirm={handleConfirmAgain}
          />

          <VolunteerConfirmedModal
            isOpen={isConfirmedModalOpen}
            confirmedTimeLabel={confirmedTimeLabel}
            onClose={() => router.push('/volunteer/dashboard')}
          />
        </VolunteerDashboardLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
}

interface VolunteerConfirmPromptModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function VolunteerConfirmPromptModal({
  isOpen,
  onCancel,
  onConfirm,
}: VolunteerConfirmPromptModalProps) {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(16, 24, 40, 0.5)"
      backdropFilter="blur(8px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1200}
    >
      <Box
        bg="white"
        borderRadius="12px"
        p={6}
        maxW="420px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack align="stretch" gap={5}>
          {/* Warning Icon */}
          <Flex justify="center">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="48px"
              h="48px"
              borderRadius="28px"
              bg="#FEF0C7"
              border="8px solid #FFFAEB"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.66 1.55 19.02C1.55 19.38 1.64 19.73 1.82 20.04C2 20.35 2.25 20.6 2.56 20.78C2.86 20.96 3.21 21.05 3.56 21.05H20.49C20.84 21.05 21.19 20.96 21.5 20.78C21.8 20.6 22.05 20.35 22.23 20.04C22.41 19.73 22.5 19.38 22.5 19.02C22.5 18.66 22.41 18.31 22.23 18L13.76 3.86C13.58 3.56 13.33 3.31 13.03 3.13C12.73 2.95 12.39 2.86 12.04 2.86C11.69 2.86 11.35 2.95 11.05 3.13C10.75 3.31 10.5 3.56 10.29 3.86Z"
                  stroke="#DC6803"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          </Flex>
          <Text
            fontSize="18px"
            fontWeight={600}
            color="#181D27"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
          >
            Confirm selected times?
          </Text>
          <Text
            fontSize="14px"
            color="#535862"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
          >
            This will notify the participant that these requested times work for you.
          </Text>
          <HStack gap={3}>
            <Button
              flex={1}
              bg="white"
              color="#344054"
              border="1px solid #D0D5DD"
              onClick={onCancel}
              fontWeight={600}
              borderRadius="8px"
              h="44px"
              boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
              _hover={{ bg: '#F9FAFB' }}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              bg="#056067"
              color="white"
              onClick={onConfirm}
              fontWeight={600}
              borderRadius="8px"
              h="44px"
              border="1px solid #056067"
              boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
              _hover={{ bg: '#044d52' }}
              _active={{ bg: '#033a3e' }}
            >
              Confirm
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

interface VolunteerConfirmedModalProps {
  isOpen: boolean;
  confirmedTimeLabel: string;
  onClose: () => void;
}

function VolunteerConfirmedModal({
  isOpen,
  confirmedTimeLabel,
  onClose,
}: VolunteerConfirmedModalProps) {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(16, 24, 40, 0.5)"
      backdropFilter="blur(8px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1200}
    >
      <Box
        bg="white"
        borderRadius="12px"
        maxW="480px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
        overflow="hidden"
      >
        <VStack align="center" gap={5} px={6} pt={6} pb={0}>
          {/* Success Icon */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="48px"
            h="48px"
            borderRadius="28px"
            bg="#D1FADF"
            border="8px solid #ECFDF3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86"
                stroke="#039855"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 4L12 14.01L9 11.01"
                stroke="#039855"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>

          <Text
            fontSize="18px"
            fontWeight={600}
            color="#181D27"
            fontFamily="'Open Sans', sans-serif"
            textAlign="center"
            px={2}
          >
            {confirmedTimeLabel
              ? `Your call is set for ${confirmedTimeLabel}!`
              : 'Your call has been confirmed!'}
          </Text>
        </VStack>

        <Flex px={6} py={6}>
          <Button
            w="full"
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            borderRadius="8px"
            h="44px"
            border="1px solid #056067"
            boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
            onClick={onClose}
            _hover={{ bg: '#044d52' }}
            _active={{ bg: '#033a3e' }}
          >
            Awesome!
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
