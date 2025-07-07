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

// Gender identity options
export const GENDER_IDENTITY_OPTIONS = [
  'Male',
  'Female', 
  'Non-binary',
  'Transgender',
  'Prefer not to answer',
  'Self-describe'
] as const;

// Pronouns options
export const PRONOUNS_OPTIONS = [
  'He/Him',
  'She/Her', 
  'They/Them',
  'Ze/Zir',
  'Prefer not to answer',
  'Self-describe'
] as const;

// Ethnic group options
export const ETHNIC_OPTIONS = [
  'Indigenous',
  'Arab',
  'Black',
  'Chinese',
  'Filipino',
  'Japanese',
  'Korean',
  'Latin American',
  'South Asian',
  'Southeast Asian',
  'West Asian',
  'White',
  'Prefer not to answer',
  'Self-describe'
] as const;

// Marital status options
export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Common-law',
  'Divorced',
  'Separated',
  'Widowed',
  'Prefer not to answer'
] as const;

// Treatment options for blood cancer
export const TREATMENT_OPTIONS = [
  'Unknown',
  'Watch and Wait / Active Surveillance',
  'Chemotherapy',
  'Immunotherapy',
  'Oral Chemotherapy',
  'Radiation',
  'Maintenance Chemotherapy',
  'Palliative Care',
  'Transfusions',
  'Autologous Stem Cell Transplant',
  'Allogeneic Stem Cell Transplant',
  'Haplo Stem Cell Transplant',
  'CAR-T',
  'BTK Inhibitors',
] as const;

// Experience options for blood cancer
export const EXPERIENCE_OPTIONS = [
  'Brain Fog',
  'Caregiver Fatigue',
  'Communication Challenges',
  'Feeling Overwhelmed',
  'Fatigue',
  'Fertility Issues',
  'Graft vs Host',
  'Returning to work or school after/during treatment',
  'Speaking to your family or friends about the diagnosis',
  'Relapse',
  'Anxiety / Depression',
  'PTSD',
] as const;

// Diagnosis options for blood cancer
export const DIAGNOSIS_OPTIONS = [
  'Acute Myeloid Leukaemia',
  'Acute Lymphoblastic Leukaemia',
  'Chronic Myeloid Leukaemia',
  'Chronic Lymphocytic Leukaemia',
  'Hodgkin Lymphoma',
  'Non-Hodgkin Lymphoma',
  'Multiple Myeloma',
  'Myelodysplastic Syndrome',
  'Myelofibrosis',
  'Aplastic Anemia',
  'Other',
] as const;

// Convert arrays to dropdown options format
export const DIAGNOSIS_DROPDOWN_OPTIONS = DIAGNOSIS_OPTIONS.map(option => ({
  value: option,
  label: option
}));

export const GENDER_DROPDOWN_OPTIONS = GENDER_IDENTITY_OPTIONS.map(option => ({
  value: option,
  label: option
}));

// Timezone options (keeping existing ones)
export const TIMEZONE_OPTIONS = [
  { value: 'Eastern Standard Time (EST)', label: 'Eastern Standard Time (EST)' },
  { value: 'Central Standard Time (CST)', label: 'Central Standard Time (CST)' },
  { value: 'Mountain Standard Time (MST)', label: 'Mountain Standard Time (MST)' },
  { value: 'Pacific Standard Time (PST)', label: 'Pacific Standard Time (PST)' },
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
    otherTreatment?: string;
    otherExperience?: string;
  };
  
  // User's Caregiver Experience (if applicable)
  caregiverExperience?: {
    experiences: string[];
    otherExperience?: string;
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
      otherTreatment?: string;
      otherExperience?: string;
    };
  };
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
  otherTreatment?: string;
  otherExperience?: string;
}

export interface CaregiverExperienceData {
  experiences: string[];
  otherExperience?: string;
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
