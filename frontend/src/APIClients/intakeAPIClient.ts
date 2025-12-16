import { IntakeFormType } from '@/constants/form';
import baseAPIClient from './baseAPIClient';

export type FormSubmissionStatus = 'pending_approval' | 'approved' | 'rejected';

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  submittedAt: string;
  answers: Record<string, unknown>;
  status: FormSubmissionStatus;
  form?: {
    id: string;
    name: string;
    version: number;
    type: string;
  };
}

export interface FormSubmissionListResponse {
  submissions: FormSubmission[];
  total: number;
}

class IntakeAPIClient {
  /**
   * Get form submissions with optional filters
   */
  async getFormSubmissions(params?: {
    userId?: string;
    formId?: string;
  }): Promise<FormSubmissionListResponse> {
    const response = await baseAPIClient.get<FormSubmissionListResponse>('/intake/submissions', {
      params,
    });
    return response.data;
  }

  /**
   * Get a single form submission by ID
   */
  async getFormSubmissionById(submissionId: string): Promise<FormSubmission> {
    const response = await baseAPIClient.get<FormSubmission>(`/intake/submissions/${submissionId}`);
    return response.data;
  }

  /**
   * Create a new form submission
   */
  async createFormSubmission(submission: {
    formId?: string;
    formType?: IntakeFormType;
    userId?: string;
    answers: Record<string, unknown>;
  }): Promise<FormSubmission> {
    const response = await baseAPIClient.post<FormSubmission>('/intake/submissions', submission);
    return response.data;
  }

  /**
   * Delete a form submission
   */
  async deleteFormSubmission(submissionId: string): Promise<{ message: string }> {
    const response = await baseAPIClient.delete<{ message: string }>(
      `/intake/submissions/${submissionId}`,
    );
    return response.data;
  }

  /**
   * Update an existing form submission (admin only, pending/rejected forms)
   */
  async updateFormSubmission(
    submissionId: string,
    answers: Record<string, unknown>,
  ): Promise<FormSubmission> {
    const response = await baseAPIClient.put<FormSubmission>(
      `/intake/submissions/${submissionId}`,
      {
        answers,
      },
    );
    return response.data;
  }

  /**
   * Approve a pending form submission (admin only)
   * Processes the form data into specialized tables
   */
  async approveFormSubmission(submissionId: string): Promise<{ status: string; message: string }> {
    const response = await baseAPIClient.post<{ status: string; message: string }>(
      `/intake/submissions/${submissionId}/approve`,
    );
    return response.data;
  }

  /**
   * Reject a pending form submission (admin only)
   */
  async rejectFormSubmission(submissionId: string): Promise<{ status: string; message: string }> {
    const response = await baseAPIClient.post<{ status: string; message: string }>(
      `/intake/submissions/${submissionId}/reject`,
    );
    return response.data;
  }

  /**
   * Resubmit a rejected form (admin only)
   * Changes status from rejected back to pending_approval
   */
  async resubmitFormSubmission(submissionId: string): Promise<{ status: string; message: string }> {
    const response = await baseAPIClient.post<{ status: string; message: string }>(
      `/intake/submissions/${submissionId}/resubmit`,
    );
    return response.data;
  }
}

export const intakeAPIClient = new IntakeAPIClient();
