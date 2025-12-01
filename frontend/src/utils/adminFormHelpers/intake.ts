import { camelizeKeys } from 'humps';
import {
  IntakeFormData,
  INITIAL_INTAKE_FORM_DATA,
  GENDER_IDENTITY_OPTIONS,
} from '@/constants/form';
import { AdminUserDataResponse } from '@/APIClients/userDataAPIClient';
import { VolunteerDataResponse } from '@/APIClients/volunteerDataAPIClient';

export type VolunteerReference = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
};

export type VolunteerReferences = {
  reference1?: VolunteerReference;
  reference2?: VolunteerReference;
  additionalInfo?: string;
};

export interface VolunteerFormAnswers extends IntakeFormData {
  status?: string;
  personalInfo: IntakeFormData['personalInfo'] & {
    email?: string;
  };
  demographics: IntakeFormData['demographics'] & {
    preferredLanguage?: string;
  };
  hasCriminalRecord?: 'yes' | 'no' | '';
  cancerExperience: NonNullable<IntakeFormData['cancerExperience']>;
  caregiverExperience: NonNullable<IntakeFormData['caregiverExperience']>;
  lovedOne: NonNullable<IntakeFormData['lovedOne']>;
  volunteerExperience?: string;
  volunteerReferences?: {
    reference1?: VolunteerReference;
    reference2?: VolunteerReference;
    additionalInfo?: string;
  };
  volunteerAdditionalComments?: string;
}

export const DEFAULT_CANCER_EXPERIENCE = {
  diagnosis: '',
  dateOfDiagnosis: '',
  treatments: [],
  experiences: [],
};

export const DEFAULT_LOVED_ONE = {
  demographics: {
    genderIdentity: '',
    genderIdentityCustom: '',
    age: '',
  },
  cancerExperience: {
    diagnosis: '',
    dateOfDiagnosis: '',
    treatments: [],
    experiences: [],
  },
};

export type CommaSeparatedFieldKey = 'caregiverExperiences';

export const buildCommaSeparatedDefaults = (
  answers: VolunteerFormAnswers,
): Record<CommaSeparatedFieldKey, string> => ({
  caregiverExperiences: (answers.caregiverExperience?.experiences || []).join(', '),
});

export const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const uniqueConcat = (base: readonly string[], additional: readonly string[]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  base.forEach((item) => {
    if (!seen.has(item)) {
      seen.add(item);
      merged.push(item);
    }
  });

  additional.forEach((item) => {
    if (!seen.has(item)) {
      seen.add(item);
      merged.push(item);
    }
  });

  return merged;
};

export const mergeOptionsWithSelections = (
  available: readonly string[],
  selected: readonly string[] = [],
): string[] => {
  const merged = [...available];
  const seen = new Set(available);

  selected.forEach((value) => {
    if (!seen.has(value)) {
      merged.push(value);
      seen.add(value);
    }
  });

  return merged;
};

export const deriveGenderSelection = (currentValue: string): string => {
  if (!currentValue) {
    return '';
  }

  if (
    (GENDER_IDENTITY_OPTIONS as readonly string[]).includes(
      currentValue as (typeof GENDER_IDENTITY_OPTIONS)[number],
    )
  ) {
    return currentValue;
  }

  return 'Self-describe';
};

export const cloneDefaultLovedOne = (): VolunteerFormAnswers['lovedOne'] => ({
  demographics: {
    ...DEFAULT_LOVED_ONE.demographics,
  },
  cancerExperience: {
    ...DEFAULT_LOVED_ONE.cancerExperience,
    treatments: [...DEFAULT_LOVED_ONE.cancerExperience.treatments],
    experiences: [...DEFAULT_LOVED_ONE.cancerExperience.experiences],
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const parseVolunteerReferences = (raw: unknown): VolunteerReferences | null => {
  if (!raw) return null;

  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!isRecord(data)) return null;

    const normalizeReference = (reference: unknown): VolunteerReference | undefined => {
      if (!isRecord(reference)) return undefined;

      const fullNameValue = reference.fullName ?? reference.full_name;
      const phoneNumberValue = reference.phoneNumber ?? reference.phone_number;

      return {
        fullName: typeof fullNameValue === 'string' ? fullNameValue : '',
        email: typeof reference.email === 'string' ? reference.email : '',
        phoneNumber: typeof phoneNumberValue === 'string' ? phoneNumberValue : '',
      };
    };

    const reference1 = normalizeReference(data.reference1 ?? data.reference_1);
    const reference2 = normalizeReference(data.reference2 ?? data.reference_2);
    const additionalInfoValue =
      data.additionalInfo ?? data.additional_info ?? data.additionalComments;

    return {
      reference1,
      reference2,
      additionalInfo: typeof additionalInfoValue === 'string' ? additionalInfoValue : '',
    };
  } catch (error) {
    console.error('Failed to parse volunteer references', error);
    return null;
  }
};

export const normalizeYesNo = (value?: string | null): 'yes' | 'no' | '' => {
  if (value === 'yes' || value === 'no') {
    return value;
  }
  return '';
};

export const normalizeIntakeAnswers = (
  answers: Partial<VolunteerFormAnswers> = {},
): VolunteerFormAnswers => {
  const normalized: VolunteerFormAnswers = {
    ...INITIAL_INTAKE_FORM_DATA,
    ...answers,
    formType: 'volunteer',
    status: answers.status || 'pending-approval',
    hasCriminalRecord: answers.hasCriminalRecord || '',
    caregiverRelationship: answers.caregiverRelationship || '',
    personalInfo: {
      ...INITIAL_INTAKE_FORM_DATA.personalInfo,
      ...(answers.personalInfo || {}),
      email: answers.personalInfo?.email ?? '',
    },
    demographics: {
      ...INITIAL_INTAKE_FORM_DATA.demographics,
      ...(answers.demographics || {}),
      preferredLanguage: answers.demographics?.preferredLanguage ?? '',
    },
    cancerExperience: {
      ...DEFAULT_CANCER_EXPERIENCE,
      ...(answers.cancerExperience || {}),
      treatments: [...(answers.cancerExperience?.treatments || [])],
      experiences: [...(answers.cancerExperience?.experiences || [])],
    },
    caregiverExperience: {
      experiences: [...(answers.caregiverExperience?.experiences || [])],
    },
    lovedOne: {
      demographics: {
        ...DEFAULT_LOVED_ONE.demographics,
        ...(answers.lovedOne?.demographics || {}),
      },
      cancerExperience: {
        ...DEFAULT_LOVED_ONE.cancerExperience,
        ...(answers.lovedOne?.cancerExperience || {}),
        treatments: [...(answers.lovedOne?.cancerExperience?.treatments || [])],
        experiences: [...(answers.lovedOne?.cancerExperience?.experiences || [])],
      },
    },
    additionalInfo: answers.additionalInfo || '',
    volunteerExperience: answers.volunteerExperience || '',
    volunteerReferences: {
      reference1: { ...(answers.volunteerReferences?.reference1 || {}) },
      reference2: { ...(answers.volunteerReferences?.reference2 || {}) },
      additionalInfo: answers.volunteerReferences?.additionalInfo || '',
    },
    volunteerAdditionalComments: answers.volunteerAdditionalComments || '',
  };

  const legacySource =
    answers && typeof answers === 'object' ? (answers as Record<string, unknown>) : undefined;

  return applyLegacyFallbacks(normalized, legacySource);
};

export const buildPrefilledIntakeAnswers = (
  answers: Record<string, unknown> | undefined,
  userData?: AdminUserDataResponse | null,
  volunteerData?: VolunteerDataResponse | null,
): VolunteerFormAnswers => {
  const camelizedAnswers =
    answers && typeof answers === 'object'
      ? (camelizeKeys(answers) as Record<string, unknown>)
      : {};
  const normalized = normalizeIntakeAnswers(
    (camelizedAnswers || {}) as Partial<VolunteerFormAnswers>,
  );
  const references =
    parseVolunteerReferences(volunteerData?.referencesJson) ||
    parseVolunteerReferences(normalized.volunteerReferences) ||
    normalized.volunteerReferences;

  const getArray = (value?: string[] | null): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => Boolean(item)) : [];

  const mapNameArray = (collection?: { name: string }[]): string[] =>
    Array.isArray(collection) ? collection.map((item) => item.name).filter(Boolean) : [];

  const combinedEthnicGroups = (() => {
    const base = getArray(userData?.ethnicGroup);
    if (userData?.otherEthnicGroup) {
      return [...base, userData.otherEthnicGroup];
    }
    return base.length ? base : normalized.demographics.ethnicGroup;
  })();

  const pronounsFromUserData = getArray(userData?.pronouns);
  const treatmentNames = mapNameArray(userData?.treatments);
  const experienceNames = mapNameArray(userData?.experiences);
  const lovedOneTreatmentNames = mapNameArray(userData?.lovedOneTreatments);
  const lovedOneExperienceNames = mapNameArray(userData?.lovedOneExperiences);

  return {
    ...normalized,
    hasBloodCancer: normalizeYesNo(userData?.hasBloodCancer) || normalized.hasBloodCancer,
    caringForSomeone: normalizeYesNo(userData?.caringForSomeone) || normalized.caringForSomeone,
    caregiverRelationship: normalized.caregiverRelationship || '',
    hasCriminalRecord: normalized.hasCriminalRecord || '',
    personalInfo: {
      ...normalized.personalInfo,
      firstName: userData?.firstName || normalized.personalInfo.firstName,
      lastName: userData?.lastName || normalized.personalInfo.lastName,
      dateOfBirth: userData?.dateOfBirth || normalized.personalInfo.dateOfBirth,
      phoneNumber: userData?.phone || normalized.personalInfo.phoneNumber,
      email: userData?.email || normalized.personalInfo.email,
      postalCode: userData?.postalCode || normalized.personalInfo.postalCode,
      city: userData?.city || normalized.personalInfo.city,
      province: userData?.province || normalized.personalInfo.province,
    },
    demographics: {
      ...normalized.demographics,
      genderIdentity:
        userData?.genderIdentityCustom ||
        userData?.genderIdentity ||
        normalized.demographics.genderIdentity,
      pronouns: pronounsFromUserData.length
        ? pronounsFromUserData
        : normalized.demographics.pronouns,
      ethnicGroup: combinedEthnicGroups,
      maritalStatus: userData?.maritalStatus || normalized.demographics.maritalStatus,
      hasKids: userData?.hasKids || normalized.demographics.hasKids,
    },
    cancerExperience: {
      ...normalized.cancerExperience,
      diagnosis: userData?.diagnosis || normalized.cancerExperience?.diagnosis || '',
      dateOfDiagnosis:
        userData?.dateOfDiagnosis || normalized.cancerExperience?.dateOfDiagnosis || '',
      treatments: treatmentNames.length
        ? treatmentNames
        : normalized.cancerExperience?.treatments || [],
      experiences: experienceNames.length
        ? experienceNames
        : normalized.cancerExperience?.experiences || [],
    },
    lovedOne: {
      ...normalized.lovedOne,
      demographics: {
        ...normalized.lovedOne.demographics,
        genderIdentity:
          userData?.lovedOneGenderIdentity || normalized.lovedOne.demographics.genderIdentity,
        age: userData?.lovedOneAge || normalized.lovedOne.demographics.age,
      },
      cancerExperience: {
        ...normalized.lovedOne.cancerExperience,
        diagnosis: userData?.lovedOneDiagnosis || normalized.lovedOne.cancerExperience.diagnosis,
        dateOfDiagnosis:
          userData?.lovedOneDateOfDiagnosis || normalized.lovedOne.cancerExperience.dateOfDiagnosis,
        treatments: lovedOneTreatmentNames.length
          ? lovedOneTreatmentNames
          : normalized.lovedOne.cancerExperience.treatments,
        experiences: lovedOneExperienceNames.length
          ? lovedOneExperienceNames
          : normalized.lovedOne.cancerExperience.experiences,
      },
    },
    volunteerExperience: normalized.volunteerExperience || volunteerData?.experience || '',
    volunteerReferences: references || normalized.volunteerReferences,
    volunteerAdditionalComments:
      normalized.volunteerAdditionalComments ||
      volunteerData?.additionalComments ||
      references?.additionalInfo ||
      '',
  };
};

export const applyLegacyFallbacks = (
  base: VolunteerFormAnswers,
  source?: Record<string, unknown>,
): VolunteerFormAnswers => {
  if (!source) {
    return base;
  }

  const getString = (key: string, fallback = ''): string => {
    const value = source[key];
    return typeof value === 'string' ? value : fallback;
  };

  const getStringArray = (key: string): string[] => {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return [];
  };

  return {
    ...base,
    personalInfo: {
      ...base.personalInfo,
      firstName: base.personalInfo.firstName || getString('firstName'),
      lastName: base.personalInfo.lastName || getString('lastName'),
      phoneNumber: base.personalInfo.phoneNumber || getString('phone'),
      postalCode: base.personalInfo.postalCode || getString('postalCode'),
      city: base.personalInfo.city || getString('city'),
      province: base.personalInfo.province || getString('province'),
    },
    demographics: {
      ...base.demographics,
      genderIdentity: base.demographics.genderIdentity || getString('genderIdentity'),
      pronouns: base.demographics.pronouns.length
        ? base.demographics.pronouns
        : getStringArray('pronouns'),
      ethnicGroup: base.demographics.ethnicGroup.length
        ? base.demographics.ethnicGroup
        : getStringArray('ethnicGroup'),
      maritalStatus: base.demographics.maritalStatus || getString('maritalStatus'),
      hasKids: base.demographics.hasKids || getString('hasKids'),
    },
    cancerExperience: {
      ...base.cancerExperience,
      diagnosis: base.cancerExperience.diagnosis || getString('diagnosis'),
      dateOfDiagnosis: base.cancerExperience.dateOfDiagnosis || getString('dateOfDiagnosis'),
      treatments: base.cancerExperience.treatments.length
        ? base.cancerExperience.treatments
        : getStringArray('treatments'),
      experiences: base.cancerExperience.experiences.length
        ? base.cancerExperience.experiences
        : getStringArray('experiences'),
    },
  };
};
