import React from 'react';
import { COLORS } from '@/constants/form';

// Reusable Select component with consistent styling
interface StyledSelectProps {
  children: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: boolean;
  placeholder?: string;
  [key: string]: any;
}

export const StyledSelect: React.FC<StyledSelectProps> = ({ 
  children, 
  value, 
  onChange, 
  error, 
  placeholder = "Select an option...",
  ...props 
}) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: COLORS.veniceBlue,
      borderColor: error ? '#ef4444' : '#d1d5db',
      borderRadius: '6px',
      height: '40px',
      width: '100%',
      padding: '0 12px',
      border: '1px solid',
      outline: 'none',
      backgroundColor: 'white',
      textAlign: 'left',
      direction: 'ltr',
      cursor: 'pointer',
    }}
    {...props}
  >
    {children}
  </select>
); 