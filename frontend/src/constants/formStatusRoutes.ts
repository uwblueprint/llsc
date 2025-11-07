import { FormStatus, UserRole } from '@/types/authTypes';

export type StatusRouteMap = Record<FormStatus, string>;

export const PARTICIPANT_STATUS_ROUTES: StatusRouteMap = {
  [FormStatus.INTAKE_TODO]: '/welcome',
  [FormStatus.INTAKE_SUBMITTED]: '/participant/intake/thank-you',
  [FormStatus.RANKING_TODO]: '/participant/ranking',
  [FormStatus.RANKING_SUBMITTED]: '/participant/ranking/thank-you',
  [FormStatus.SECONDARY_APPLICATION_TODO]: '/participant/ranking',
  [FormStatus.SECONDARY_APPLICATION_SUBMITTED]: '/participant/ranking/thank-you',
  [FormStatus.COMPLETED]: '/participant/dashboard',
  [FormStatus.REJECTED]: '/rejection',
};

export const VOLUNTEER_STATUS_ROUTES: StatusRouteMap = {
  [FormStatus.INTAKE_TODO]: '/welcome',
  [FormStatus.INTAKE_SUBMITTED]: '/volunteer/intake/thank-you',
  [FormStatus.RANKING_TODO]: '/volunteer/intake/thank-you',
  [FormStatus.RANKING_SUBMITTED]: '/volunteer/intake/thank-you',
  [FormStatus.SECONDARY_APPLICATION_TODO]: '/volunteer/secondary-application',
  [FormStatus.SECONDARY_APPLICATION_SUBMITTED]: '/volunteer/secondary-application/thank-you',
  [FormStatus.COMPLETED]: '/volunteer/dashboard',
  [FormStatus.REJECTED]: '/rejection',
};

export const ADMIN_STATUS_ROUTES: StatusRouteMap = {
  [FormStatus.INTAKE_TODO]: '/admin/dashboard',
  [FormStatus.INTAKE_SUBMITTED]: '/admin/dashboard',
  [FormStatus.RANKING_TODO]: '/admin/dashboard',
  [FormStatus.RANKING_SUBMITTED]: '/admin/dashboard',
  [FormStatus.SECONDARY_APPLICATION_TODO]: '/admin/dashboard',
  [FormStatus.SECONDARY_APPLICATION_SUBMITTED]: '/admin/dashboard',
  [FormStatus.COMPLETED]: '/admin/dashboard',
  [FormStatus.REJECTED]: '/admin/dashboard',
};

export const ROLE_STATUS_ROUTES: Record<UserRole, StatusRouteMap> = {
  [UserRole.PARTICIPANT]: PARTICIPANT_STATUS_ROUTES,
  [UserRole.VOLUNTEER]: VOLUNTEER_STATUS_ROUTES,
  [UserRole.ADMIN]: ADMIN_STATUS_ROUTES,
};

export const getRedirectRoute = (role: UserRole, status: FormStatus): string => {
  const roleRoutes = ROLE_STATUS_ROUTES[role];
  return roleRoutes?.[status] ?? '/welcome';
};
