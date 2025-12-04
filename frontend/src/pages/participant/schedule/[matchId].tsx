import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Container, Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { participantMatchAPIClient } from '@/APIClients/participantMatchAPIClient';
import { FormStatus, UserRole } from '@/types/authTypes';
import { Match, TimeBlock } from '@/types/matchTypes';

interface GroupedTimeBlocks {
  [date: string]: TimeBlock[];
}

export default function ScheduleCallPage() {
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeBlockId, setSelectedTimeBlockId] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupedTimeBlocks, setGroupedTimeBlocks] = useState<GroupedTimeBlocks>({});

  const loadMatch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await participantMatchAPIClient.getMyMatches();
      const foundMatch = data.matches.find((m) => m.id === parseInt(matchId as string));

      if (!foundMatch) {
        router.push('/participant/dashboard');
        return;
      }

      setMatch(foundMatch);

      // Group time blocks by date, filtering out past times
      const now = new Date();
      const grouped: GroupedTimeBlocks = {};
      foundMatch.suggestedTimeBlocks.forEach((tb) => {
        const timeBlockDate = new Date(tb.startTime);

        // Skip time blocks that are in the past
        if (timeBlockDate < now) {
          return;
        }

        // Create date key in local timezone (YYYY-MM-DD)
        const year = timeBlockDate.getFullYear();
        const month = String(timeBlockDate.getMonth() + 1).padStart(2, '0');
        const day = String(timeBlockDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(tb);
      });
      setGroupedTimeBlocks(grouped);
    } catch (err) {
      console.error('Error loading match:', err);
      router.push('/participant/dashboard');
    } finally {
      setLoading(false);
    }
  }, [matchId, router]);

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId, loadMatch]);

  const formatDate = (dateStr: string): string => {
    // Parse YYYY-MM-DD as local date to avoid timezone shifting
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleConfirm = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeBlockId) return;

    try {
      setIsSubmitting(true);
      await participantMatchAPIClient.scheduleMatch(
        parseInt(matchId as string),
        selectedTimeBlockId,
      );
      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error('Error scheduling match:', err);
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    router.push('/participant/dashboard');
  };

  const getSelectedTimeBlock = (): TimeBlock | null => {
    if (!selectedTimeBlockId || !match) return null;
    return match.suggestedTimeBlocks.find((tb) => tb.id === selectedTimeBlockId) || null;
  };

  const sortedDates = Object.keys(groupedTimeBlocks).sort();

  if (loading) {
    return (
      <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
        <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
          <Box minH="100vh" bg="white" py={10}>
            <Container maxW="container.md">
              <Flex justify="center" align="center" minH="50vh">
                <Spinner size="xl" color="#056067" />
              </Flex>
            </Container>
          </Box>
        </FormStatusGuard>
      </ProtectedPage>
    );
  }

  if (!match) {
    return null;
  }

  const volunteerName =
    `${match.volunteer.firstName || ''} ${match.volunteer.lastName || ''}`.trim();

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <Box minH="100vh" bg="white" py={10}>
          <Container maxW="container.md">
            <VStack align="stretch" gap={8}>
              {/* Back button */}
              <Flex
                align="center"
                gap={1}
                cursor="pointer"
                onClick={() => router.back()}
                alignSelf="flex-start"
              >
                <Text
                  fontSize="lg"
                  color="#1D3448"
                  fontWeight="400"
                  fontFamily="'Open Sans', sans-serif"
                >
                  &lt;
                </Text>
                <Text
                  fontSize="md"
                  color="#1D3448"
                  fontWeight="400"
                  fontFamily="'Open Sans', sans-serif"
                >
                  Back
                </Text>
              </Flex>

              {/* Header */}
              <VStack align="stretch" gap={2}>
                <Heading
                  fontSize="2xl"
                  fontWeight="600"
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                >
                  Schedule your call with {volunteerName}
                </Heading>
                <Text fontSize="md" color="#6B7280" fontFamily="'Open Sans', sans-serif">
                  When you would like to meet with your volunteer?
                </Text>
              </VStack>

              {/* Date Selection */}
              <VStack align="stretch" gap={4}>
                <Text
                  fontSize="md"
                  fontWeight="600"
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                >
                  Select a date
                </Text>
                <Flex gap={3} flexWrap="wrap">
                  {sortedDates.map((dateKey) => (
                    <Button
                      key={dateKey}
                      onClick={() => {
                        setSelectedDate(dateKey);
                        setSelectedTimeBlockId(null); // Reset time selection
                      }}
                      variant="outline"
                      border="2px solid"
                      borderColor={selectedDate === dateKey ? '#056067' : '#D5D7DA'}
                      bg={selectedDate === dateKey ? 'transparent' : 'white'}
                      color="#1D3448"
                      fontWeight="400"
                      fontSize="sm"
                      fontFamily="'Open Sans', sans-serif"
                      px={6}
                      py={6}
                      borderRadius="6px"
                      _hover={{
                        borderColor: '#056067',
                      }}
                    >
                      {formatDate(dateKey)}
                    </Button>
                  ))}
                </Flex>
              </VStack>

              {/* Time Selection */}
              {selectedDate && (
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text
                      fontSize="md"
                      fontWeight="600"
                      color="#1D3448"
                      fontFamily="'Open Sans', sans-serif"
                    >
                      Select a time
                    </Text>
                    <Text fontSize="sm" color="#6B7280" fontFamily="'Open Sans', sans-serif">
                      All times are in EST.
                    </Text>
                  </Box>
                  <Flex gap={3} flexWrap="wrap">
                    {groupedTimeBlocks[selectedDate]?.map((timeBlock) => (
                      <Button
                        key={timeBlock.id}
                        onClick={() => setSelectedTimeBlockId(timeBlock.id)}
                        variant="outline"
                        border="2px solid"
                        borderColor={selectedTimeBlockId === timeBlock.id ? '#056067' : '#D5D7DA'}
                        bg={selectedTimeBlockId === timeBlock.id ? 'transparent' : 'white'}
                        color="#1D3448"
                        fontWeight="400"
                        fontSize="sm"
                        fontFamily="'Open Sans', sans-serif"
                        px={6}
                        py={5}
                        borderRadius="6px"
                        _hover={{
                          borderColor: '#056067',
                        }}
                      >
                        {formatTime(timeBlock.startTime)}
                      </Button>
                    ))}
                  </Flex>
                </VStack>
              )}

              {/* Action Buttons */}
              <Flex justify="flex-end" mt={4}>
                {selectedDate && selectedTimeBlockId ? (
                  <Button
                    bg="#056067"
                    color="white"
                    fontWeight={600}
                    fontSize="md"
                    fontFamily="'Open Sans', sans-serif"
                    px={8}
                    py={6}
                    borderRadius="md"
                    _hover={{
                      bg: '#044d52',
                    }}
                    _active={{
                      bg: '#033a3e',
                    }}
                    onClick={handleConfirm}
                  >
                    Confirm
                  </Button>
                ) : (
                  <Button
                    bg="#9B2C2C"
                    color="white"
                    fontWeight={600}
                    fontSize="md"
                    fontFamily="'Open Sans', sans-serif"
                    px={8}
                    py={6}
                    borderRadius="md"
                    _hover={{
                      bg: '#822727',
                    }}
                    _active={{
                      bg: '#63171B',
                    }}
                    onClick={() => router.push(`/participant/request-new-times/${matchId}`)}
                  >
                    Request More Times
                  </Button>
                )}
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* Confirmation Modal */}
        {isConfirmModalOpen && (
          <ConfirmationModal
            date={selectedDate ? formatDate(selectedDate) : ''}
            time={getSelectedTimeBlock() ? formatTime(getSelectedTimeBlock()!.startTime) : ''}
            isSubmitting={isSubmitting}
            onConfirm={handleConfirmBooking}
            onCancel={() => setIsConfirmModalOpen(false)}
          />
        )}

        {/* Success Modal */}
        {isSuccessModalOpen && match && (
          <SuccessModal
            date={selectedDate ? formatDate(selectedDate) : ''}
            time={getSelectedTimeBlock() ? formatTime(getSelectedTimeBlock()!.startTime) : ''}
            phoneNumber={match.volunteer.phone || ''}
            onClose={handleSuccessClose}
          />
        )}
      </FormStatusGuard>
    </ProtectedPage>
  );
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  date: string;
  time: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  date,
  time,
  isSubmitting,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
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
      zIndex={1000}
    >
      <Box
        bg="white"
        borderRadius="12px"
        p={6}
        maxW="400px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack gap={5} align="stretch">
          {/* Question Mark Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="rgba(154, 197, 254, 0.5)"
            border="8px solid"
            borderColor="#F0F6FF"
            display="flex"
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
          >
            <Text
              fontSize="xl"
              color="#0361DC"
              fontWeight="600"
              fontFamily="'Open Sans', sans-serif"
            >
              ?
            </Text>
          </Box>

          <Text
            fontSize="20px"
            color="#181D27"
            textAlign="center"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            lineHeight="1.4em"
          >
            Confirm booking for {date} at {time}?
          </Text>

          <Flex gap={3} w="full">
            <Button
              flex={1}
              bg="rgba(179, 206, 209, 0.3)"
              color="#495D6C"
              fontWeight={600}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              px={4}
              py={2.5}
              borderRadius="8px"
              onClick={onCancel}
              disabled={isSubmitting}
              border="none"
              _hover={{
                bg: 'rgba(179, 206, 209, 0.4)',
              }}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              bg="#056067"
              color="white"
              fontWeight={600}
              fontSize="16px"
              fontFamily="'Open Sans', sans-serif"
              px={4}
              py={2.5}
              borderRadius="8px"
              onClick={onConfirm}
              loading={isSubmitting}
              _hover={{
                bg: '#044d52',
              }}
              _active={{
                bg: '#033a3e',
              }}
            >
              Confirm
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}

// Success Modal Component
interface SuccessModalProps {
  date: string;
  time: string;
  phoneNumber: string;
  onClose: () => void;
}

function SuccessModal({ date, time, phoneNumber, onClose }: SuccessModalProps) {
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
      zIndex={1000}
    >
      <Box
        bg="white"
        borderRadius="12px"
        p={6}
        maxW="400px"
        w="90%"
        boxShadow="0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)"
      >
        <VStack gap={5} align="stretch">
          {/* Success Icon */}
          <Box
            w="48px"
            h="48px"
            borderRadius="full"
            bg="#D1FADF"
            border="8px solid"
            borderColor="#ECFDF3"
            display="flex"
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="#039855"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>

          <VStack gap={2} align="stretch">
            <Text
              fontSize="20px"
              color="#181D27"
              textAlign="center"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              lineHeight="1.4em"
            >
              Your call is set for {date} at {time}!
            </Text>
            <Text
              fontSize="16px"
              color="#535862"
              textAlign="center"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              lineHeight="1.36181640625em"
            >
              You will receive a call from{' '}
              <Text as="span" color="#8B5E3E" fontWeight={400}>
                {phoneNumber || 'your volunteer'}
              </Text>{' '}
              at the scheduled time.
            </Text>
          </VStack>

          <Button
            w="full"
            bg="#056067"
            color="white"
            fontWeight={600}
            fontSize="16px"
            fontFamily="'Open Sans', sans-serif"
            lineHeight="1.5em"
            py={2.5}
            borderRadius="8px"
            onClick={onClose}
            _hover={{
              bg: '#044d52',
            }}
            _active={{
              bg: '#033a3e',
            }}
          >
            Awesome!
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
