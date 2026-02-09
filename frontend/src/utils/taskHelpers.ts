import { COLORS } from '@/constants/colors';

// Helper functions for task styling

export const getTypeColor = (type: string): { bg: string; color: string } => {
  const typeColors: Record<string, { bg: string; color: string }> = {
    'Intake Form Review': { bg: COLORS.bgPurpleLight, color: COLORS.purple },
    'Ranking / Secondary App Review': { bg: COLORS.bgTealLight, color: COLORS.teal },
    Matching: { bg: COLORS.bgPinkLight, color: COLORS.red },
    'Profile Update': { bg: COLORS.bgGrayLight, color: COLORS.gray700 },
    'User Opt Out': { bg: 'rgba(200, 200, 200, 0.4)', color: COLORS.gray700 },
  };
  return typeColors[type] || { bg: COLORS.bgGrayLight, color: COLORS.gray700 };
};

export const getPriorityColor = (priority: string): { bg: string; color: string } => {
  const priorityColors: Record<string, { bg: string; color: string }> = {
    High: { bg: COLORS.bgPinkLight, color: COLORS.red },
    Medium: { bg: COLORS.bgYellowLight, color: COLORS.orange },
    Low: { bg: COLORS.bgTealLight, color: COLORS.teal },
    'No status': { bg: COLORS.bgGrayLight, color: COLORS.gray700 },
  };
  return priorityColors[priority] || { bg: COLORS.bgGrayLight, color: COLORS.gray700 };
};

export const getCategoryColor = (categoryKey: string): string => {
  const categoryColors: Record<string, string> = {
    intake_screening: COLORS.bgPurpleLight,
    secondary_app: COLORS.bgTealLight,
    matching_requests: COLORS.bgPinkLight,
    profile_updates: COLORS.bgGrayLight,
    user_opt_outs: 'rgba(200, 200, 200, 0.4)',
  };
  return categoryColors[categoryKey] || COLORS.bgGrayLight;
};
