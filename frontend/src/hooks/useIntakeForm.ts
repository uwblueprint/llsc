import { useForm } from 'react-hook-form';
import { IntakeFormData, INITIAL_INTAKE_FORM_DATA } from '@/constants/form';

export const useIntakeForm = () => {
  const form = useForm<IntakeFormData>({
    defaultValues: INITIAL_INTAKE_FORM_DATA,
  });

  const onSubmit = async (data: IntakeFormData) => {
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
