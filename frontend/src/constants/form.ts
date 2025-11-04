// Colors
export const COLORS = {
  veniceBlue: '#1d3448',
  fieldGray: '#6b7280',
  teal: '#056067',
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
  'Yukon',
] as const;

// Validation patterns
export const VALIDATION = {
  PHONE: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  POSTAL_CODE: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  DATE: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
} as const;

// Comprehensive intake form data structure
export interface IntakeFormData {
  // Form type and flow control
  formType: 'participant' | 'volunteer';
  hasBloodCancer: 'yes' | 'no' | '';
  caringForSomeone: 'yes' | 'no' | '';

  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    postalCode: string;
    city: string;
    province: string;
  };

  // User's Demographic Information
  demographics: {
    genderIdentity: string;
    pronouns: string[];
    ethnicGroup: string[];
    maritalStatus: string;
    hasKids: string;
  };

  // User's Cancer Experience (if applicable)
  cancerExperience?: {
    diagnosis: string;
    dateOfDiagnosis: string;
    treatments: string[];
    experiences: string[];
  };

  // User's Caregiver Experience (if applicable)
  caregiverExperience?: {
    experiences: string[];
  };

  // Loved One's Information (if applicable)
  lovedOne?: {
    demographics: {
      genderIdentity: string;
      genderIdentityCustom?: string;
      age: string;
    };
    cancerExperience: {
      diagnosis: string;
      dateOfDiagnosis: string;
      treatments: string[];
      experiences: string[];
    };
  };

  // Additional Information
  additionalInfo?: string;
}

// Type definitions for form submissions
export interface ExperienceData {
  hasBloodCancer: 'yes' | 'no' | '';
  caringForSomeone: 'yes' | 'no' | '';
}

export interface PersonalData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  postalCode: string;
  city: string;
  province: string;
}

export interface DemographicsData {
  genderIdentity: string;
  pronouns: string[];
  ethnicGroup: string[];
  maritalStatus: string;
  hasKids: string;
}

export interface CancerExperienceData {
  diagnosis: string;
  dateOfDiagnosis: string;
  treatments: string[];
  experiences: string[];
}

export interface CaregiverExperienceData {
  experiences: string[];
}

export interface LovedOneData {
  demographics: DemographicsData;
  cancerExperience: CancerExperienceData;
}

// Initial empty form data
export const INITIAL_INTAKE_FORM_DATA: IntakeFormData = {
  formType: 'participant',
  hasBloodCancer: '',
  caringForSomeone: '',
  personalInfo: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    postalCode: '',
    city: '',
    province: '',
  },
  demographics: {
    genderIdentity: '',
    pronouns: [],
    ethnicGroup: [],
    maritalStatus: '',
    hasKids: '',
  },
};
