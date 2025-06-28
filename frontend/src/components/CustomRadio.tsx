import React from 'react';

const teal = '#0d7377';

interface CustomRadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export const CustomRadio: React.FC<CustomRadioProps> = ({ 
  name, 
  value, 
  checked, 
  onChange, 
  children 
}) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: 'none' }}
      />
      <div
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: `1.5px solid ${teal}`,
          backgroundColor: 'transparent',
          marginRight: '8px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {checked && (
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: teal,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>
      {children}
    </label>
  );
}; 