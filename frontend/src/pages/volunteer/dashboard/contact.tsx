import React from 'react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { VolunteerDashboardLayout } from '@/components/dashboard/VolunteerDashboardLayout';
import { ContactForm } from '@/components/shared/ContactForm';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function VolunteerContactPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <VolunteerDashboardLayout>
          <ContactForm redirectPath="/volunteer/dashboard" />
        </VolunteerDashboardLayout>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
