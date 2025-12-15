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

const getFirstString = (record: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const normalizeReference = (reference: unknown): VolunteerReference | undefined => {
  if (!isRecord(reference)) {
    return undefined;
  }

  const fullNameValue = getFirstString(reference, ['fullName', 'full_name', 'name']);
  const emailValue = getFirstString(reference, ['email', 'emailAddress']);
  const phoneNumberValue = getFirstString(reference, ['phoneNumber', 'phone_number', 'phone']);

  if (!fullNameValue && !emailValue && !phoneNumberValue) {
    return undefined;
  }

  return {
    fullName: typeof fullNameValue === 'string' ? fullNameValue : '',
    email: typeof emailValue === 'string' ? emailValue : '',
    phoneNumber: typeof phoneNumberValue === 'string' ? phoneNumberValue : '',
  };
};

const mergeAdditionalInfo = (
  base: VolunteerReferences | null,
  additionalInfo: string | undefined,
): VolunteerReferences | null => {
  if (!base) {
    return null;
  }

  return {
    reference1: base.reference1,
    reference2: base.reference2,
    additionalInfo: base.additionalInfo || additionalInfo || '',
  };
};

export const parseVolunteerReferences = (raw: unknown): VolunteerReferences | null => {
  if (!raw) return null;

  try {
    if (typeof raw === 'string') {
      return parseVolunteerReferences(JSON.parse(raw));
    }

    if (Array.isArray(raw)) {
      const [first, second] = raw;
      const reference1 = normalizeReference(first);
      const reference2 = normalizeReference(second);

      if (!reference1 && !reference2) {
        return null;
      }

      return {
        reference1,
        reference2,
        additionalInfo: '',
      };
    }

    if (!isRecord(raw)) {
      return null;
    }

    // Handle nested `references` arrays/objects
    if (Array.isArray(raw.references)) {
      const parsed = parseVolunteerReferences(raw.references);
      const additionalInfoValue =
        typeof raw.additionalInfo === 'string'
          ? raw.additionalInfo
          : typeof raw.additional_info === 'string'
            ? raw.additional_info
            : typeof raw.additionalComments === 'string'
              ? raw.additionalComments
              : typeof raw.additional_comments === 'string'
                ? raw.additional_comments
                : undefined;
      return mergeAdditionalInfo(parsed, additionalInfoValue);
    }

    const reference1 = normalizeReference(
      raw.reference1 ?? raw.reference_1 ?? raw.ref1 ?? raw.referenceOne,
    );
    const reference2 = normalizeReference(
      raw.reference2 ?? raw.reference_2 ?? raw.ref2 ?? raw.referenceTwo,
    );

    const additionalInfoValue =
      raw.additionalInfo ??
      raw.additional_info ??
      raw.additionalComments ??
      raw.additional_comments;

    if (!reference1 && !reference2 && typeof additionalInfoValue !== 'string') {
      return null;
    }

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
  const rawSource =
    answers && typeof answers === 'object' ? (answers as Record<string, unknown>) : {};

  const pickString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = rawSource[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return undefined;
  };

  const parsedVolunteerReferences =
    parseVolunteerReferences(answers.volunteerReferences) ||
    parseVolunteerReferences(rawSource['volunteerReferences']) ||
    parseVolunteerReferences(rawSource['references']) ||
    parseVolunteerReferences(rawSource['referencesJson']) ||
    parseVolunteerReferences(rawSource['references_json']) ||
    parseVolunteerReferences(rawSource['referencesJSON']);

  const fallbackExperience = pickString('experience');
  const fallbackAdditionalInfo = pickString('additionalComments', 'additional_comments');

  const normalizeStatusValue = (): string => {
    const statusValue =
      (typeof answers.status === 'string' && answers.status.length > 0
        ? answers.status
        : pickString('status')) || 'pending_approval';
    if (statusValue === 'pending-approval') {
      return 'pending_approval';
    }
    return statusValue;
  };

  const resolvedVolunteerReferences =
    parsedVolunteerReferences || answers.volunteerReferences || undefined;

  const normalized: VolunteerFormAnswers = {
    ...INITIAL_INTAKE_FORM_DATA,
    ...answers,
    formType: 'volunteer',
    status: normalizeStatusValue(),
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
    volunteerExperience: answers.volunteerExperience || fallbackExperience || '',
    volunteerReferences: {
      reference1: { ...(resolvedVolunteerReferences?.reference1 || {}) },
      reference2: { ...(resolvedVolunteerReferences?.reference2 || {}) },
      additionalInfo:
        resolvedVolunteerReferences?.additionalInfo ||
        answers.volunteerReferences?.additionalInfo ||
        fallbackAdditionalInfo ||
        '',
    },
    volunteerAdditionalComments:
      answers.volunteerAdditionalComments || fallbackAdditionalInfo || '',
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

/**
 * Convert VolunteerFormAnswers to AdminIntakeFormData format
 * This transforms the nested structure from buildPrefilledIntakeAnswers
 * into the flat structure expected by AdminIntakeFormView
 */
export const convertToAdminIntakeFormData = (answers: VolunteerFormAnswers) => {
  return {
    hasBloodCancer: answers.hasBloodCancer,
    caringForSomeone: answers.caringForSomeone,
    firstName: answers.personalInfo.firstName,
    lastName: answers.personalInfo.lastName,
    dateOfBirth: answers.personalInfo.dateOfBirth,
    phoneNumber: answers.personalInfo.phoneNumber,
    postalCode: answers.personalInfo.postalCode,
    city: answers.personalInfo.city,
    province: answers.personalInfo.province,
    genderIdentity: answers.demographics.genderIdentity,
    pronouns: answers.demographics.pronouns,
    ethnicGroup: answers.demographics.ethnicGroup,
    preferredLanguage: (() => {
      const lang = answers.demographics.preferredLanguage || answers.language || 'English';
      // Convert "en"/"fr" to "English"/"Français" for display
      const lower = lang.toLowerCase();
      if (lower === 'en' || lower === 'english') return 'English';
      if (lower === 'fr' || lower === 'french' || lower === 'français') return 'Français';
      return lang;
    })(),
    maritalStatus: answers.demographics.maritalStatus,
    hasKids: answers.demographics.hasKids,
    timezone: answers.demographics.timezone,
    diagnosis: answers.cancerExperience?.diagnosis,
    dateOfDiagnosis: answers.cancerExperience?.dateOfDiagnosis,
    treatments: answers.cancerExperience?.treatments,
    experiences: answers.cancerExperience?.experiences,
    caregiverExperiences: answers.caregiverExperience?.experiences,
    lovedOne: answers.lovedOne
      ? {
          genderIdentity: answers.lovedOne.demographics?.genderIdentity || '',
          genderIdentityCustom: answers.lovedOne.demographics?.genderIdentityCustom,
          age: answers.lovedOne.demographics?.age || '',
          diagnosis: answers.lovedOne.cancerExperience?.diagnosis || '',
          dateOfDiagnosis: answers.lovedOne.cancerExperience?.dateOfDiagnosis || '',
          treatments: answers.lovedOne.cancerExperience?.treatments || [],
          experiences: answers.lovedOne.cancerExperience?.experiences || [],
        }
      : undefined,
    additionalInfo: answers.additionalInfo,
  };
};
