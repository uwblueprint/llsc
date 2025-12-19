import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { ThankYouScreen } from '@/components/intake/thank-you-screen';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function BecomeVolunteerThankYouPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.COMPLETED]}>
        <ThankYouScreen />
      </FormStatusGuard>
    </ProtectedPage>
  );
}
