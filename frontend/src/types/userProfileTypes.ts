// Types for user profile editing state

export interface ProfileEditData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  genderIdentity?: string;
  pronouns?: string[];
  timezone?: string;
  ethnicGroup?: string[];
  maritalStatus?: string;
  hasKids?: string;
  lovedOneGenderIdentity?: string;
  lovedOneAge?: string;
}

export interface CancerEditData {
  diagnosis?: string;
  dateOfDiagnosis?: string;
  treatments?: string[];
  experiences?: string[];
  additionalInfo?: string;
}

export interface LovedOneEditData {
  diagnosis?: string;
  dateOfDiagnosis?: string;
  treatments?: string[];
  experiences?: string[];
}

export interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

