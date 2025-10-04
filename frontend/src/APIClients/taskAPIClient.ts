import baseAPIClient from './baseAPIClient';

export interface BackendTask {
  id: string;
  participantId: string | null;
  type: 'intake_form_review' | 'volunteer_app_review' | 'profile_update' | 'matching';
  priority: 'no_status' | 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assigneeId: string | null;
  startDate: string; // ISO datetime string
  endDate: string | null; // ISO datetime string
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: BackendTask[];
  total: number;
}

export interface UpdateTaskRequest {
  participantId?: string;
  type?: 'intake_form_review' | 'volunteer_app_review' | 'profile_update' | 'matching';
  priority?: 'no_status' | 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  assigneeId?: string | null;
  startDate?: string;
  endDate?: string;
}

class TaskAPIClient {
  /**
   * Get all tasks with optional filters
   */
  async getTasks(params?: {
    status?: string;
    priority?: string;
    taskType?: string;
    assigneeId?: string;
  }): Promise<TaskListResponse> {
    const response = await baseAPIClient.get<TaskListResponse>('/tasks', { params });
    return response.data;
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string): Promise<BackendTask> {
    const response = await baseAPIClient.get<BackendTask>(`/tasks/${taskId}`);
    return response.data;
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<BackendTask> {
    const response = await baseAPIClient.put<BackendTask>(`/tasks/${taskId}`, updates);
    return response.data;
  }

  /**
   * Mark a task as completed
   */
  async completeTask(taskId: string): Promise<BackendTask> {
    const response = await baseAPIClient.put<BackendTask>(`/tasks/${taskId}/complete`);
    return response.data;
  }
}

export const taskAPIClient = new TaskAPIClient();
