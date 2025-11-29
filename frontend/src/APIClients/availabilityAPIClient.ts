import {
  TimeRange,
  CreateAvailabilityRequest,
  CreateAvailabilityResponse,
  AvailabilityEntity,
  DeleteAvailabilityRequest,
  DeleteAvailabilityResponse,
} from '../types/AvailabilityTypes';

import baseAPIClient from './baseAPIClient';
import { getCurrentUserId, getAuthHeaders } from '../utils/AuthUtils';

const getAvailability = async (): Promise<AvailabilityEntity | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User ID not found in localStorage');
      return null;
    }

    const { data } = await baseAPIClient.get<AvailabilityEntity>(
      `/availability?user_id=${userId}`,
      getAuthHeaders(),
    );
    return data;
  } catch (error) {
    console.error('Failed to get availability:', error);
    return null;
  }
};

const createAvailability = async (
  availableTimes: TimeRange[],
): Promise<CreateAvailabilityResponse | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User ID not found in localStorage');
      return null;
    }

    const createRequest: CreateAvailabilityRequest = {
      userId,
      availableTimes,
    };

    const { data } = await baseAPIClient.post<CreateAvailabilityResponse>(
      '/availability',
      createRequest,
      getAuthHeaders(),
    );
    return data;
  } catch (error) {
    console.error('Failed to create availability:', error);
    return null;
  }
};

const deleteAvailability = async (
  timeRangesToDelete: TimeRange[],
): Promise<DeleteAvailabilityResponse | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User ID not found in localStorage');
      return null;
    }

    const deleteRequest: DeleteAvailabilityRequest = {
      userId,
      delete: timeRangesToDelete,
    };

    const { data } = await baseAPIClient.delete<DeleteAvailabilityResponse>('/availability', {
      ...getAuthHeaders(),
      data: deleteRequest,
    });
    return data;
  } catch (error) {
    console.error('Failed to delete availability:', error);
    return null;
  }
};

const updateAvailability = async (
  availableTimes: TimeRange[],
): Promise<CreateAvailabilityResponse | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User ID not found in localStorage');
      return null;
    }

    const updateRequest: CreateAvailabilityRequest = {
      userId,
      availableTimes,
    };

    // Use PUT to completely replace availability
    const { data } = await baseAPIClient.put<CreateAvailabilityResponse>(
      '/availability',
      updateRequest,
      getAuthHeaders(),
    );
    return data;
  } catch (error) {
    console.error('Failed to update availability:', error);
    return null;
  }
};

export default {
  getAvailability,
  createAvailability,
  deleteAvailability,
  updateAvailability,
};
