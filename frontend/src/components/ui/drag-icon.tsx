import React from 'react';
import { COLORS } from '@/constants/form';

export const DragIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="4" r="1.5" fill={COLORS.fieldGray} />
    <circle cx="12" cy="4" r="1.5" fill={COLORS.fieldGray} />
    <circle cx="4" cy="8" r="1.5" fill={COLORS.fieldGray} />
    <circle cx="12" cy="8" r="1.5" fill={COLORS.fieldGray} />
    <circle cx="4" cy="12" r="1.5" fill={COLORS.fieldGray} />
    <circle cx="12" cy="12" r="1.5" fill={COLORS.fieldGray} />
  </svg>
);
