import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { ThankYouScreen } from '@/components/intake/thank-you-screen';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function VolunteerIntakeThankYouPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.INTAKE_SUBMITTED]}>
        <ThankYouScreen />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
