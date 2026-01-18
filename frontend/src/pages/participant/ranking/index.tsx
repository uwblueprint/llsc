import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { UserIcon, WelcomeScreen } from '@/components/ui';
import {
  VolunteerMatchingForm,
  VolunteerRankingForm,
  CaregiverMatchingForm,
  CaregiverQualitiesForm,
  CaregiverRankingForm,
  CaregiverTwoColumnQualitiesForm,
} from '@/components/ranking';
import { FormPageLayout } from '@/components/layout';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { syncCurrentUser } from '@/APIClients/authAPIClient';
import { auth } from '@/config/firebase';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { FormStatus, UserRole } from '@/types/authTypes';

const RANKING_STATEMENTS = [
  'I would prefer a volunteer with the same age as me',
  'I would prefer a volunteer with the same diagnosis as me',
  'I would prefer a volunteer with the same marital status as me',
  'I would prefer a volunteer with the same ethnic or cultural group as me',
  'I would prefer a volunteer with the same parental status as me',
];

const CAREGIVER_RANKING_STATEMENTS = [
  'I would prefer a volunteer with the same age as my loved one',
  'I would prefer a volunteer with the same diagnosis as my loved one',
  'I would prefer a volunteer with experience with Relapse',
  'I would prefer a volunteer with experience with Anxiety / Depression',
  'I would prefer a volunteer with experience with returning to school or work during/after treatment',
];

interface RankingFormData {
  selectedQualities: string[]; // option keys
  rankedPreferences: string[]; // labels to display
  rankedKeys: string[]; // option keys in rank order
  volunteerType?: string;
  isCaregiverVolunteerFlow?: boolean;
}

interface ParticipantRankingPageProps {
  participantType?: 'cancerPatient' | 'caregiver';
  caregiverHasCancer?: boolean;
}

type Scope = 'self' | 'loved_one';

// NOTE: Responses are camelCased by our Axios interceptor
type StaticQuality = { qualityId: number; slug: string; label: string; allowedScopes?: Scope[] };

type DynamicOption = { kind: 'treatment' | 'experience'; id: number; name: string; scope: Scope };

type OptionsResponse = { staticQualities: StaticQuality[]; dynamicOptions: DynamicOption[] };

type DisplayOption = {
  key: string;
  label: string;
  meta: { kind: 'quality' | 'treatment' | 'experience'; id: number; scope: Scope };
};

export default function ParticipantRankingPage({
  participantType = 'caregiver',
  caregiverHasCancer = true,
}: ParticipantRankingPageProps) {
  const t = useTranslations('ranking');
  const router = useRouter();
  const [derivedParticipantType, setDerivedParticipantType] = useState<
    'cancerPatient' | 'caregiver' | null
  >(null);
  const [derivedCaregiverHasCancer, setDerivedCaregiverHasCancer] = useState<boolean | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const run = async () => {
      try {
        setIsLoadingCase(true);
        const { data } = await baseAPIClient.get('/ranking/case');
        if (data && data.case) {
          if (data.case === 'patient') {
            setDerivedParticipantType('cancerPatient');
            setDerivedCaregiverHasCancer(null);
          } else if (data.case === 'caregiver_with_cancer') {
            setDerivedParticipantType('caregiver');
            setDerivedCaregiverHasCancer(true);
          } else if (data.case === 'caregiver_without_cancer') {
            setDerivedParticipantType('caregiver');
            setDerivedCaregiverHasCancer(false);
          }
        }
      } catch {
        // Non-blocking for now
      } finally {
        setIsLoadingCase(false);
      }
    };
    if (auth.currentUser) {
      run();
    } else {
      unsubscribe = auth.onIdTokenChanged((user) => {
        if (user) {
          run();
          if (unsubscribe) unsubscribe();
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (derivedParticipantType !== null || derivedCaregiverHasCancer !== null) {
      console.log('[RANKING_CASE]', {
        participantType: derivedParticipantType,
        caregiverHasCancer: derivedCaregiverHasCancer,
        isLoadingCase,
      });
    }
  }, [derivedParticipantType, derivedCaregiverHasCancer, isLoadingCase]);

  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [singleColumnOptions, setSingleColumnOptions] = useState<DisplayOption[]>([]);
  const [leftColumnOptions, setLeftColumnOptions] = useState<DisplayOption[]>([]);
  const [rightColumnOptions, setRightColumnOptions] = useState<DisplayOption[]>([]);

  // Helper to index options by key for quick lookups
  const optionsIndex = useMemo(() => {
    const index: Record<string, DisplayOption> = {};
    [...singleColumnOptions, ...leftColumnOptions, ...rightColumnOptions].forEach((opt) => {
      index[opt.key] = opt;
    });
    return index;
  }, [singleColumnOptions, leftColumnOptions, rightColumnOptions]);

  const fetchOptions = async (target: 'patient' | 'caregiver') => {
    try {
      setIsLoadingOptions(true);
      setOptionsError(null);
      const { data } = await baseAPIClient.get<OptionsResponse>('/ranking/options', {
        params: { target },
      });
      const staticQualitiesExpanded: DisplayOption[] = (data.staticQualities || []).flatMap((q) => {
        const scopes = q.allowedScopes || [];
        return scopes.map((s) => ({
          key: `quality:${q.qualityId}:${s}`,
          label: `${q.label} ${s === 'self' ? t('me') : t('myLovedOne')}`,
          meta: { kind: 'quality', id: q.qualityId, scope: s },
        }));
      });
      const dynamicOptions: DisplayOption[] = (data.dynamicOptions || []).map((o) => ({
        key: `${o.kind}:${o.id}:${o.scope}`,
        label: t('experienceWithName', { name: o.name }),
        meta: { kind: o.kind, id: o.id, scope: o.scope },
      }));

      const combinedSingle = [...staticQualitiesExpanded, ...dynamicOptions];
      setSingleColumnOptions(combinedSingle);

      const left: DisplayOption[] = [];
      const right: DisplayOption[] = [];
      staticQualitiesExpanded.forEach((opt) => {
        if (opt.meta.scope === 'self') left.push(opt);
        if (opt.meta.scope === 'loved_one') right.push(opt);
      });
      dynamicOptions.forEach((opt) => {
        if (opt.meta.scope === 'self') left.push(opt);
        if (opt.meta.scope === 'loved_one') right.push(opt);
      });
      setLeftColumnOptions(left);
      setRightColumnOptions(right);
    } catch {
      setOptionsError(t('failedToLoadOptions'));
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Prefer derived case values from backend when available
  const effectiveParticipantType: 'cancerPatient' | 'caregiver' =
    (derivedParticipantType as 'cancerPatient' | 'caregiver') ?? participantType;
  const effectiveCaregiverHasCancer: boolean =
    derivedParticipantType === 'caregiver'
      ? (derivedCaregiverHasCancer ?? caregiverHasCancer)
      : caregiverHasCancer;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RankingFormData>({
    selectedQualities: [],
    rankedPreferences:
      participantType === 'caregiver' ? [...CAREGIVER_RANKING_STATEMENTS] : [...RANKING_STATEMENTS],
    rankedKeys: [],
    volunteerType: participantType === 'caregiver' ? '' : undefined,
    isCaregiverVolunteerFlow: undefined,
  });

  const WelcomeScreenStep = () => (
    <WelcomeScreen
      icon={<UserIcon />}
      title={t('welcomeToProgram')}
      description={t('letsBeginSelecting')}
      onContinue={() => setCurrentStep(2)}
    />
  );

  const QualitiesScreen = () => {
    const toggleQuality = (key: string) => {
      setFormData((prev) => ({
        ...prev,
        selectedQualities: prev.selectedQualities.includes(key)
          ? prev.selectedQualities.filter((q) => q !== key)
          : prev.selectedQualities.length < 5
            ? [...prev.selectedQualities, key]
            : prev.selectedQualities,
      }));
    };

    const handleVolunteerTypeChange = (type: string) => {
      setFormData((prev) => ({
        ...prev,
        volunteerType: type,
        isCaregiverVolunteerFlow: type === 'caringForLovedOne',
      }));
    };

    // For patient flow, fetch options once
    useEffect(() => {
      if (
        effectiveParticipantType === 'cancerPatient' &&
        singleColumnOptions.length === 0 &&
        !isLoadingOptions
      ) {
        fetchOptions('patient');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveParticipantType]);

    return (
      <FormPageLayout>
        {optionsError ? (
          <Text color="red.500" mb={4}>
            {optionsError}
          </Text>
        ) : null}

        {effectiveParticipantType === 'caregiver' ? (
          <CaregiverMatchingForm
            volunteerType={formData.volunteerType || ''}
            onVolunteerTypeChange={handleVolunteerTypeChange}
            onNext={async (type) => {
              setFormData((prev) => ({
                ...prev,
                volunteerType: type,
                isCaregiverVolunteerFlow: type === 'caringForLovedOne',
              }));
              // Prefetch options based on caregiver choice before advancing
              const target: 'patient' | 'caregiver' =
                type === 'caringForLovedOne' ? 'caregiver' : 'patient';
              try {
                await fetchOptions(target);
              } catch {}
              setCurrentStep(3);
            }}
          />
        ) : (
          <VolunteerMatchingForm
            selectedQualities={formData.selectedQualities}
            onQualityToggle={toggleQuality}
            options={singleColumnOptions}
            onNext={() => {
              // Build ranking arrays from selected keys
              const keys = formData.selectedQualities;
              const labels = keys.map((k) => optionsIndex[k]?.label || k);
              setFormData((prev) => ({
                ...prev,
                rankedPreferences: [...labels],
                rankedKeys: [...keys],
              }));
              setCurrentStep(3);
            }}
          />
        )}
      </FormPageLayout>
    );
  };

  const CaregiverQualitiesScreen = () => {
    const toggleQuality = (key: string) => {
      setFormData((prev) => ({
        ...prev,
        selectedQualities: prev.selectedQualities.includes(key)
          ? prev.selectedQualities.filter((q) => q !== key)
          : prev.selectedQualities.length < 5
            ? [...prev.selectedQualities, key]
            : prev.selectedQualities,
      }));
    };

    return (
      <FormPageLayout>
        {
          // Prefer explicit flag; otherwise infer from value
          (formData.isCaregiverVolunteerFlow ?? false) ||
          formData.volunteerType === 'caringForLovedOne' ||
          (!!formData.volunteerType && formData.volunteerType !== 'similarDiagnosis') ? (
            <CaregiverTwoColumnQualitiesForm
              selectedQualities={formData.selectedQualities}
              onQualityToggle={toggleQuality}
              leftOptions={leftColumnOptions}
              rightOptions={rightColumnOptions}
              onNext={() => {
                if (
                  leftColumnOptions.length === 0 &&
                  rightColumnOptions.length === 0 &&
                  !isLoadingOptions
                ) {
                  fetchOptions('caregiver');
                }
                const keys = formData.selectedQualities;
                const labels = keys.map((k) => optionsIndex[k]?.label || k);
                setFormData((prev) => ({
                  ...prev,
                  rankedPreferences: [...labels],
                  rankedKeys: [...keys],
                }));
                setCurrentStep(4);
              }}
            />
          ) : effectiveCaregiverHasCancer ? (
            formData.volunteerType === 'similarDiagnosis' ? (
              <CaregiverQualitiesForm
                selectedQualities={formData.selectedQualities}
                onQualityToggle={toggleQuality}
                options={singleColumnOptions}
                onNext={() => {
                  if (singleColumnOptions.length === 0 && !isLoadingOptions) {
                    fetchOptions('patient');
                  }
                  const keys = formData.selectedQualities;
                  const labels = keys.map((k) => optionsIndex[k]?.label || k);
                  setFormData((prev) => ({
                    ...prev,
                    rankedPreferences: [...labels],
                    rankedKeys: [...keys],
                  }));
                  setCurrentStep(4);
                }}
              />
            ) : (
              <VolunteerMatchingForm
                selectedQualities={formData.selectedQualities}
                onQualityToggle={toggleQuality}
                options={singleColumnOptions}
                onNext={() => {
                  if (singleColumnOptions.length === 0 && !isLoadingOptions) {
                    fetchOptions('patient');
                  }
                  const keys = formData.selectedQualities;
                  const labels = keys.map((k) => optionsIndex[k]?.label || k);
                  setFormData((prev) => ({
                    ...prev,
                    rankedPreferences: [...labels],
                    rankedKeys: [...keys],
                  }));
                  setCurrentStep(4);
                }}
              />
            )
          ) : (
            <CaregiverQualitiesForm
              selectedQualities={formData.selectedQualities}
              onQualityToggle={toggleQuality}
              options={singleColumnOptions}
              onNext={() => {
                if (singleColumnOptions.length === 0 && !isLoadingOptions) {
                  fetchOptions('patient');
                }
                const keys = formData.selectedQualities;
                const labels = keys.map((k) => optionsIndex[k]?.label || k);
                setFormData((prev) => ({
                  ...prev,
                  rankedPreferences: [...labels],
                  rankedKeys: [...keys],
                }));
                setCurrentStep(4);
              }}
            />
          )
        }
      </FormPageLayout>
    );
  };

  const RankingScreen = () => {
    const moveItem = (fromIndex: number, toIndex: number) => {
      setFormData((prev) => {
        const newLabels = [...prev.rankedPreferences];
        const newKeys = [...prev.rankedKeys];
        const [movedLabel] = newLabels.splice(fromIndex, 1);
        const [movedKey] = newKeys.splice(fromIndex, 1);
        newLabels.splice(toIndex, 0, movedLabel);
        newKeys.splice(toIndex, 0, movedKey);
        return { ...prev, rankedPreferences: newLabels, rankedKeys: newKeys };
      });
    };

    const nextStep = effectiveParticipantType === 'caregiver' ? 5 : 4;

    const handleSubmit = async () => {
      // Determine target based on flow
      let target: 'patient' | 'caregiver' = 'patient';
      if (
        effectiveParticipantType === 'caregiver' &&
        ((formData.isCaregiverVolunteerFlow ?? false) ||
          formData.volunteerType === 'caringForLovedOne')
      ) {
        target = 'caregiver';
      } else {
        target = 'patient';
      }
      const items = formData.rankedKeys.map((key, idx) => {
        const opt = optionsIndex[key];
        return {
          kind: opt?.meta.kind === 'quality' ? 'quality' : opt?.meta.kind,
          id: opt?.meta.id,
          scope: opt?.meta.scope,
          rank: idx + 1,
        };
      });
      try {
        await baseAPIClient.put('/ranking/preferences', items, { params: { target } });
        setCurrentStep(nextStep);
        await syncCurrentUser();
        await router.replace('/participant/ranking/thank-you');
        return;
      } catch (e) {
        console.error('Failed to save preferences', e);
      }
    };

    return (
      <FormPageLayout>
        {effectiveParticipantType === 'caregiver' ? (
          <CaregiverRankingForm
            rankedPreferences={formData.rankedPreferences}
            onMoveItem={moveItem}
            onSubmit={handleSubmit}
            itemScopes={formData.rankedKeys.map((k) => optionsIndex[k]?.meta.scope || 'self')}
            itemKinds={formData.rankedKeys.map((k) => optionsIndex[k]?.meta.kind || 'quality')}
          />
        ) : (
          <VolunteerRankingForm
            rankedPreferences={formData.rankedPreferences}
            onMoveItem={moveItem}
            onSubmit={handleSubmit}
            itemScopes={formData.rankedKeys.map((k) => optionsIndex[k]?.meta.scope || 'self')}
            itemKinds={formData.rankedKeys.map((k) => optionsIndex[k]?.meta.kind || 'quality')}
          />
        )}
      </FormPageLayout>
    );
  };

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.RANKING_TODO]}>
        {participantType === 'caregiver'
          ? (() => {
              switch (currentStep) {
                case 1:
                  return <WelcomeScreenStep />;
                case 2:
                  return <QualitiesScreen />;
                case 3:
                  return <CaregiverQualitiesScreen />;
                case 4:
                case 5:
                  return <RankingScreen />;
                default:
                  return <WelcomeScreenStep />;
              }
            })()
          : (() => {
              switch (currentStep) {
                case 1:
                  return <WelcomeScreenStep />;
                case 2:
                  return <QualitiesScreen />;
                case 3:
                case 4:
                  return <RankingScreen />;
                default:
                  return <WelcomeScreenStep />;
              }
            })()}
      </FormStatusGuard>
    </ProtectedPage>
  );
}
