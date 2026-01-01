import React from 'react';

const GRAY_600 = '#6b7280'; // gray.600 from theme

export const DragIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="4" r="1.5" fill={GRAY_600} />
    <circle cx="12" cy="4" r="1.5" fill={GRAY_600} />
    <circle cx="4" cy="8" r="1.5" fill={GRAY_600} />
    <circle cx="12" cy="8" r="1.5" fill={GRAY_600} />
    <circle cx="4" cy="12" r="1.5" fill={GRAY_600} />
    <circle cx="12" cy="12" r="1.5" fill={GRAY_600} />
  </svg>
);
