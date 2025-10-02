import React from 'react';
import { FormStatus } from '@/types/authTypes';
import { useFormStatusGuard } from '@/hooks/useFormStatusGuard';

interface FormStatusGuardProps {
  allowedStatuses: FormStatus[];
  children: React.ReactNode;
}

export const FormStatusGuard: React.FC<FormStatusGuardProps> = ({ allowedStatuses, children }) => {
  const { loading, allowed } = useFormStatusGuard(allowedStatuses);

  if (loading) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};
