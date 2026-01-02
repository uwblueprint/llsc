import React, { useEffect, useState } from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { FiMessageSquare } from 'react-icons/fi';
import { taskAPIClient, BackendTask } from '@/APIClients/taskAPIClient';

interface NotesModalProps {
  participantId: string | string[] | undefined;
  participantName?: string;
}

export function NotesModal({ participantId, participantName }: NotesModalProps) {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participantId || typeof participantId !== 'string') {
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await taskAPIClient.getTasks({
          taskType: 'matching',
        });
        // Filter tasks for this participant and sort by created_at descending
        const participantTasks = response.tasks
          .filter((task) => task.participantId === participantId && task.description)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTasks(participantTasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [participantId]);

  // Get the most recent task with a description
  const latestTask = tasks.length > 0 ? tasks[0] : null;

  return (
    <Box
      bg="white"
      border="1px solid #D5D7DA"
      borderRadius="8px"
      w="100%"
      p={7}
      boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
    >
      <VStack align="stretch" gap={4}>
        {/* Header */}
        <VStack align="stretch" gap={1}>
          <HStack gap={2} align="flex-end">
            <FiMessageSquare size={24} color="#181D27" />
            <Text fontSize="18px" fontWeight={600} color="#181D27">
              Notes from {participantName || 'Participant'}
            </Text>
          </HStack>
          {latestTask && (
            <HStack gap={1} fontSize="12px" color="#495D6C">
              <Text>Requesting a new match</Text>
              <Text>/</Text>
              <Text>
                Submitted{' '}
                {latestTask.createdAt
                  ? (() => {
                      // Backend sends UTC datetime without timezone marker, so we need to
                      // explicitly treat it as UTC before converting to local timezone
                      const utcDateString = latestTask.createdAt.endsWith('Z')
                        ? latestTask.createdAt
                        : `${latestTask.createdAt}Z`;
                      const date = new Date(utcDateString);
                      const dateStr = date.toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const timeStr = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                      return `${dateStr}, ${timeStr}`;
                    })()
                  : 'N/A'}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Divider */}
        {latestTask && <Box h="1px" bg="#EAEAE6" />}

        {/* Note Content */}
        {loading ? (
          <Text fontSize="14px" color="#535862" lineHeight="1.43em">
            Loading...
          </Text>
        ) : latestTask ? (
          <Text fontSize="14px" color="#535862" lineHeight="1.43em">
            {latestTask.description || 'No notes available.'}
          </Text>
        ) : (
          <Text fontSize="14px" color="#535862" lineHeight="1.43em">
            No notes
          </Text>
        )}
      </VStack>
    </Box>
  );
}
