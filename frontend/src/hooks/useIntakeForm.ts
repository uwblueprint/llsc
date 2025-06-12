import { useForm } from 'react-hook-form';
import { FormData, DEFAULT_FORM_VALUES } from '@/constants/form';

export const useIntakeForm = () => {
  const form = useForm<FormData>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const onSubmit = async (data: FormData) => {
    try {
      // TODO: Add API call to submit form data
      console.log('Form data:', data);
      // Show success message
      alert('Form submitted successfully');
    } catch (err) {
      console.error('Error submitting form:', err);
      // Show error message
      alert('Error submitting form. Please try again later.');
    }
  };

  return {
    ...form,
    onSubmit,
  };
}; 
