import { useState } from 'react';
import availabilityAPIClient from '@/APIClients/availabilityAPIClient';
import {
  TimeRange,
  AvailabilityEntity,
  CreateAvailabilityResponse,
  DeleteAvailabilityResponse,
} from '@/types/AvailabilityTypes';

export const useAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailability = async (): Promise<AvailabilityEntity | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityAPIClient.getAvailability();
      return result;
    } catch (err) {
      setError('Failed to fetch availability');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createAvailability = async (
    availableTimes: TimeRange[],
  ): Promise<CreateAvailabilityResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityAPIClient.createAvailability(availableTimes);
      return result;
    } catch (err) {
      setError('Failed to create availability');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAvailability = async (
    timeRangesToDelete: TimeRange[],
  ): Promise<DeleteAvailabilityResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityAPIClient.deleteAvailability(timeRangesToDelete);
      return result;
    } catch (err) {
      setError('Failed to delete availability');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (
    availableTimes: TimeRange[],
  ): Promise<CreateAvailabilityResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityAPIClient.updateAvailability(availableTimes);
      return result;
    } catch (err) {
      setError('Failed to update availability');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getAvailability,
    createAvailability,
    deleteAvailability,
    updateAvailability,
    loading,
    error,
    setError,
  };
};
