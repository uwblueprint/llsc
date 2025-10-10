export interface Task {
  id: string;
  name: string;
  type: 'Intake Form Review' | 'Volunteer App. Review' | 'Matching' | 'Profile Update';
  startDate: string;
  endDate: string;
  priority: 'High' | 'Medium' | 'Low' | 'Add status';
  assignee?: string;
  completed: boolean;
  userType: 'Participant' | 'Volunteer';
  category: 'intake_screening' | 'secondary_app' | 'matching_requests' | 'profile_updates';
  description?: string;
}

export interface Admin {
  id: string;
  name: string;
  initial: string;
  bgColor: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  categoryKey: Task['category'];
  bgColor: string;
}

export const categoryLabels: Record<Task['category'], string> = {
  intake_screening: 'Review intake forms and schedule screening call',
  secondary_app: 'Review secondary application form',
  matching_requests: 'Participants requesting a match',
  profile_updates: 'User profile updates',
};

export const taskCategories: TaskCategory[] = [
  {
    id: '1',
    name: 'Review intake forms and schedule screening call',
    categoryKey: 'intake_screening',
    bgColor: '#F4F0FA',
  },
  {
    id: '2',
    name: 'Review secondary application form',
    categoryKey: 'secondary_app',
    bgColor: 'rgba(179, 206, 209, 0.3)',
  },
  {
    id: '3',
    name: 'Participants requesting a match',
    categoryKey: 'matching_requests',
    bgColor: 'rgba(232, 188, 189, 0.3)',
  },
  {
    id: '4',
    name: 'User profile updates',
    categoryKey: 'profile_updates',
    bgColor: '#EEEEEC',
  },
];
