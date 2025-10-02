import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { getCurrentUser, syncCurrentUser } from '@/APIClients/authAPIClient';
import { FormStatus, UserRole, AuthenticatedUser } from '@/types/authTypes';
import { roleIdToUserRole } from '@/utils/roleUtils';
import { getRedirectRoute } from '@/constants/formStatusRoutes';

interface GuardOptions {
  allowAdminBypass?: boolean;
}

interface GuardState {
  loading: boolean;
  allowed: boolean;
}

const resolveStatus = (user: AuthenticatedUser): FormStatus | null => {
  if (!user) {
    return null;
  }
  const status =
    (user.user?.formStatus as FormStatus | undefined) ||
    (user.formStatus as unknown as FormStatus | undefined);
  return status ?? null;
};

const resolveRole = (user: AuthenticatedUser): UserRole | null => {
  if (!user) {
    return null;
  }
  const roleId = user.user?.roleId ?? (user.roleId as unknown as number | undefined);
  return roleIdToUserRole(roleId ?? null);
};

export const useFormStatusGuard = (
  allowedStatuses: FormStatus[],
  options: GuardOptions = {},
): GuardState => {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({ loading: true, allowed: false });
  const allowAdminBypass = options.allowAdminBypass ?? true;

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        if (!cancelled) {
          setState({ loading: false, allowed: false });
        }
        await router.replace('/');
        return;
      }

      const syncedUser = await syncCurrentUser();
      if (cancelled) {
        return;
      }

      const role = resolveRole(syncedUser);
      if (!role) {
        setState({ loading: false, allowed: false });
        await router.replace('/');
        return;
      }

      if (allowAdminBypass && role === UserRole.ADMIN) {
        setState({ loading: false, allowed: true });
        return;
      }

      const status = resolveStatus(syncedUser);
      if (!status) {
        setState({ loading: false, allowed: false });
        await router.replace('/welcome');
        return;
      }

      if (allowedStatuses.includes(status)) {
        setState({ loading: false, allowed: true });
        return;
      }

      const destination = getRedirectRoute(role, status);
      setState({ loading: true, allowed: false });
      if (router.asPath !== destination) {
        await router.replace(destination);
      } else {
        setState({ loading: false, allowed: false });
      }
    };

    void evaluate();

    return () => {
      cancelled = true;
    };
  }, [allowedStatuses, allowAdminBypass, router]);

  return state;
};
