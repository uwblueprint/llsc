import { UserRole } from '@/types/authTypes';

export const roleIdToUserRole = (roleId: number | null | undefined): UserRole | null => {
  switch (roleId) {
    case 1:
      return UserRole.PARTICIPANT;
    case 2:
      return UserRole.VOLUNTEER;
    case 3:
      return UserRole.ADMIN;
    default:
      return null;
  }
};
