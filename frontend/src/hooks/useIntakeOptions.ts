import { useState, useEffect } from 'react';
import baseAPIClient from '@/APIClients/baseAPIClient';

export function useIntakeOptions() {
  const [treatmentOptions, setTreatmentOptions] = useState<string[]>([]);
  const [experienceOptions, setExperienceOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await baseAPIClient.get<{ 
          treatments: Array<{ id: number; name: string }>; 
          experiences: Array<{ id: number; name: string }> 
        }>('/intake/options?target=both');
        setTreatmentOptions(response.data.treatments?.map(t => t.name) || []);
        setExperienceOptions(response.data.experiences?.map(e => e.name) || []);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

  return { treatmentOptions, experienceOptions };
}

