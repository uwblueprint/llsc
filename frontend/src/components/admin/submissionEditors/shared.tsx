import React from 'react';
import { COLORS as UI_COLORS } from '@/constants/colors';
import { COLORS as FORM_COLORS } from '@/constants/form';

export const INPUT_STYLES = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  color: FORM_COLORS.veniceBlue,
  borderRadius: '6px',
  h: '40px',
  border: '1px solid #d1d5db',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  _placeholder: { color: '#9ca3af' },
  _focus: {
    borderColor: FORM_COLORS.teal,
    boxShadow: `0 0 0 3px ${FORM_COLORS.teal}20`,
  },
} as const;

export const TEXTAREA_STYLES = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  color: FORM_COLORS.veniceBlue,
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  px: '16px',
  py: '12px',
  _placeholder: { color: '#9ca3af' },
  _focus: {
    borderColor: FORM_COLORS.teal,
    boxShadow: `0 0 0 3px ${FORM_COLORS.teal}20`,
  },
} as const;

const SELECT_FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  minWidth: '240px',
  height: '40px',
  borderRadius: '10px',
  border: `1px solid ${UI_COLORS.gray300}`,
  padding: '0 12px',
  fontFamily: "'Open Sans', sans-serif",
  fontSize: '14px',
  color: UI_COLORS.veniceBlue,
  backgroundColor: UI_COLORS.white,
};

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ children, style, ...props }, ref) => (
  <select ref={ref} {...props} style={{ ...SELECT_FIELD_STYLE, ...(style || {}) }}>
    {children}
  </select>
));
SelectField.displayName = 'SelectField';
