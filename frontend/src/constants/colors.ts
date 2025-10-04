// Flat color constants for easy import
export const veniceBlue = '#1D3448';
export const tealBlue = '#5F989D'; // For drag overlay when not hovering
export const lightGray = '#BBC2C8'; // For drag overlay when hovering
export const gray700 = '#414651';
export const gray300 = '#D5D7DA';
export const textPrimary = '#495D6C';
export const white = '#FFFFFF';
export const black = '#000000';
export const grayBorder = '#E2E8F0';

// Additional UI colors
export const lightBg = '#F6F6F6';
export const lightBgHover = '#F0F0F0';
export const hoverBg = '#F9F9F9';
export const divider = '#E9EAEB';
export const borderLightGray = '#EEEEEC';
export const borderTopGray = '#F6F6F6';
export const headerText = '#535862';
export const mutedText = '#9E9E9E';
export const textSecondary = '#717680';
export const textMuted = '#616161';
export const borderActive = 'rgba(187, 194, 200, 0.5)';
export const bgOverlay = 'rgba(0, 0, 0, 0.15)';

// Avatar colors for admin users
export const avatarColors = [
  '#AAD3FF',
  '#F4F4F4',
  '#FFD4A3',
  '#C7E9C0',
  '#FFB3C1',
  '#D5C4E8',
  '#A3D9FF',
  '#FFE4A3',
  '#C0E9D7',
  '#FFD1DC',
  '#E8D5FF',
  '#B3E5FC',
  '#FFF9C4',
  '#C8E6C9',
  '#F8BBD0',
  '#D1C4E9',
  '#B2EBF2',
  '#FFECB3',
  '#DCEDC8',
  '#F0F4C3',
  '#E1BEE7',
  '#BBDEFB',
  '#FFE082',
  '#C5E1A5',
  '#FFCCBC',
  '#CE93D8',
] as const;

// Badge background and text colors
export const bgPurpleLight = '#F4F0FA';
export const purple = '#6740C2';
export const bgTealLight = 'rgba(179, 206, 209, 0.3)';
export const teal = '#056067';
export const tealDarker = '#044d52';
export const bgPinkLight = 'rgba(232, 188, 189, 0.3)';
export const red = '#A70000';
export const bgGrayLight = '#EEEEEC';
export const bgYellowLight = '#F5E9E1';
export const orange = '#8E4C20';

// Shadow constants
export const shadow = {
  sm: '0px 1px 2px 0px rgba(10, 13, 18, 0.05)',
  md: '0px 4px 6px -2px rgba(10, 13, 18, 0.03), 0px 12px 16px -4px rgba(10, 13, 18, 0.08)',
  lg: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
  filter: '0px 2px 8px 0px rgba(0, 0, 0, 0.3)',
  header: '0px 2px 4px rgba(0, 0, 0, 0.08)',
} as const;

// Full color palette object (for structured access)
export const COLORS = {
  veniceBlue,
  tealBlue,
  lightGray,
  gray700,
  gray300,
  textPrimary,
  white,
  black,
  grayBorder,
  lightBg,
  lightBgHover,
  hoverBg,
  divider,
  borderLightGray,
  borderTopGray,
  headerText,
  mutedText,
  textSecondary,
  textMuted,
  borderActive,
  bgOverlay,
  bgPurpleLight,
  purple,
  bgTealLight,
  teal,
  tealDarker,
  bgPinkLight,
  red,
  bgGrayLight,
  bgYellowLight,
  orange,
  shadow,
} as const;
