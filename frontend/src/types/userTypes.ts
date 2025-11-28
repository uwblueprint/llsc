import { UserRole } from './authTypes';

export interface Treatment {
  id: number;
  name: string;
}

export interface Experience {
  id: number;
  name: string;
}

export interface UserData {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  genderIdentity: string | null;
  pronouns: string[] | null;
  ethnicGroup: string[] | null;
  maritalStatus: string | null;
  hasKids: string | null;
  timezone: string | null;
  diagnosis: string | null;
  dateOfDiagnosis: string | null;
  otherEthnicGroup: string | null;
  genderIdentityCustom: string | null;
  additionalInfo: string | null;
  hasBloodCancer: string | null;
  caringForSomeone: string | null;
  lovedOneGenderIdentity: string | null;
  lovedOneAge: string | null;
  lovedOneDiagnosis: string | null;
  lovedOneDateOfDiagnosis: string | null;
  treatments: Treatment[];
  experiences: Experience[];
  lovedOneTreatments: Treatment[];
  lovedOneExperiences: Experience[];
}

export interface VolunteerData {
  id: string;
  userId: string;
  experience: string | null;
  referencesJson: string | null;
  additionalComments: string | null;
  submittedAt: string;
}

export interface TimeBlock {
  id: number;
  startTime: string;
}

export interface AvailabilityTemplate {
  dayOfWeek: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  startTime: string; // Time string in format "HH:MM:SS"
  endTime: string; // Time string in format "HH:MM:SS"
}

export interface UserResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roleId: number;
  authId: string;
  approved: boolean;
  active: boolean;
  formStatus: string;
  language: string;
  role: {
    id: number;
    name: string;
  };
  userData?: UserData | null;
  volunteerData?: VolunteerData | null;
  availability?: AvailabilityTemplate[];
}
