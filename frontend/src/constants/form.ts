// Colors
export const COLORS = {
  veniceBlue: '#1d3448',
  fieldGray: '#6b7280',
  teal: '#0d7377',
  lightTeal: '#e6f7f7',
  lightGray: '#f3f4f6',
  progressTeal: '#5eead4',
  progressGray: '#d1d5db',
} as const;

// Canadian provinces
export const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon'
] as const;

// Validation patterns
export const VALIDATION = {
  PHONE: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  POSTAL_CODE: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  DATE: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
} as const;

// Form field types
export interface FormData {
  hasBloodCancer: string;
  caringForSomeone: string;
  caringFor: string;
  otherCaringFor: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  postalCode: string;
  city: string;
  province: string;
}

// Default form values
export const DEFAULT_FORM_VALUES: FormData = {
  hasBloodCancer: 'no',
  caringForSomeone: 'yes',
  caringFor: 'spouse',
  otherCaringFor: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phoneNumber: '',
  postalCode: '',
  city: '',
  province: '',
}; 
