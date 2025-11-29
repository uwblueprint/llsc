import { VALIDATION } from '@/constants/form';

/**
 * Validation utility functions for form fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates date in DD/MM/YYYY format
 */
export const validateDate = (dateString: string): ValidationResult => {
  if (!dateString || !dateString.trim()) {
    return { isValid: false, error: 'Date is required' };
  }

  // Check format DD/MM/YYYY
  if (!VALIDATION.DATE.test(dateString)) {
    return { isValid: false, error: 'Please use DD/MM/YYYY format' };
  }

  // Parse and validate actual date
  const parts = dateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Check year is reasonable (between 1900 and current year + 1)
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) {
    return { isValid: false, error: `Year must be between 1900 and ${currentYear}` };
  }

  // Create date and check if it's valid
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  return { isValid: true };
};

/**
 * Validates birthday (must be in the past and person must be at least a certain age)
 */
export const validateBirthday = (dateString: string, minAge: number = 0): ValidationResult => {
  // First validate format
  const formatValidation = validateDate(dateString);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Parse date
  const parts = dateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  // Check if date is in the future
  if (birthDate > today) {
    return { isValid: false, error: 'Birthday cannot be in the future' };
  }

  // Check minimum age if specified
  if (minAge > 0) {
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < minAge) {
      return { isValid: false, error: `You must be at least ${minAge} years old` };
    }
  }

  return { isValid: true };
};

/**
 * Validates phone number (Canadian format)
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (!VALIDATION.PHONE.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
};

/**
 * Validates postal code (Canadian format)
 */
export const validatePostalCode = (postalCode: string): ValidationResult => {
  if (!postalCode || !postalCode.trim()) {
    return { isValid: false, error: 'Postal code is required' };
  }

  if (!VALIDATION.POSTAL_CODE.test(postalCode)) {
    return { isValid: false, error: 'Please enter a valid Canadian postal code (e.g., A1A 1A1)' };
  }

  return { isValid: true };
};

/**
 * Validates that a field is not empty
 */
export const validateRequired = (
  value: string,
  fieldName: string = 'This field',
): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validates pronouns format (comma-separated list)
 */
export const validatePronouns = (pronouns: string): ValidationResult => {
  if (!pronouns || !pronouns.trim()) {
    return { isValid: true }; // Pronouns are optional
  }

  // Just check that it's not excessively long
  if (pronouns.length > 100) {
    return { isValid: false, error: 'Pronouns must be less than 100 characters' };
  }

  return { isValid: true };
};
