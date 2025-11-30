import baseAPIClient from './baseAPIClient';

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

/**
 * Submit a contact form message
 */
export const submitContactForm = async (contactData: ContactRequest): Promise<ContactResponse> => {
  const response = await baseAPIClient.post<ContactResponse>('/contact/submit', contactData);
  return response.data;
};
