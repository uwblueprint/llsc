import baseAPIClient from './baseAPIClient';

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  submittedAt: string;
  answers: Record<string, unknown>;
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
    formType?: 'participant' | 'volunteer';
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
   * Update an existing form submission
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
}

export const intakeAPIClient = new IntakeAPIClient();
