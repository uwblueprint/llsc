import { Task } from '@/types/adminTypes';

/**
 * Get the appropriate link for a task's participant based on task type.
 *
 * @param task - The task object
 * @returns The URL path to navigate to
 */
export const getParticipantLink = (task: Task): string => {
  if (!task.participantId) {
    return '#';
  }

  const baseUrl = `/admin/users/${task.participantId}`;

  // Navigate to different tabs based on task type
  if (task.type === 'Matching') {
    return `${baseUrl}?tab=matches`;
  } else if (task.type === 'Profile Update') {
    return `${baseUrl}?tab=profile`;
  } else if (task.type === 'Intake Form Review' || task.type === 'Ranking / Secondary App Review') {
    return `${baseUrl}?tab=forms`;
  } else {
    // Default: profile tab
    return baseUrl;
  }
};
