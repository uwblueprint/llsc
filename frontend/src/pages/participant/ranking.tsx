import React, { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { UserIcon, CheckMarkIcon, WelcomeScreen } from '@/components/ui';
import {
  VolunteerMatchingForm,
  VolunteerRankingForm,
  CaregiverMatchingForm,
  CaregiverQualitiesForm,
  CaregiverRankingForm,
  CaregiverTwoColumnQualitiesForm,
} from '@/components/ranking';
import { COLORS } from '@/constants/form';
import baseAPIClient from '@/APIClients/baseAPIClient';
import { auth } from '@/config/firebase';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';

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
          label: `${q.label} ${s === 'self' ? 'me' : 'my loved one'}`,
          meta: { kind: 'quality', id: q.qualityId, scope: s },
        }));
      });
      const dynamicOptions: DisplayOption[] = (data.dynamicOptions || []).map((o) => ({
        key: `${o.kind}:${o.id}:${o.scope}`,
        label: `experience with ${o.name}`,
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
      setOptionsError('Failed to load options. Please try again.');
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
      title="Welcome to the Peer Support Program!"
      description="Let's begin by selecting<br />your preferences in a volunteer."
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
      <Flex minH="100vh" bg={COLORS.lightGray} justify="center" py={12}>
        <Box
          w="full"
          maxW="1200px"
          bg="white"
          borderRadius="8px"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
          p={10}
        >
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
        </Box>
      </Flex>
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
      <Flex minH="100vh" bg={COLORS.lightGray} justify="center" py={12}>
        <Box
          w="full"
          maxW="1200px"
          bg="white"
          borderRadius="8px"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
          p={10}
        >
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
        </Box>
      </Flex>
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
      } catch (e) {
        console.error('Failed to save preferences', e);
      }
    };

    return (
      <Flex minH="100vh" bg={COLORS.lightGray} justify="center" py={12}>
        <Box
          w="full"
          maxW="1200px"
          bg="white"
          borderRadius="8px"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
          p={10}
        >
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
        </Box>
      </Flex>
    );
  };

  const ThankYouScreen = () => (
    <Box
      minH="100vh"
      bg={COLORS.lightGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      <Box
        w="full"
        maxW="800px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
        textAlign="center"
      >
        <VStack gap={6}>
          <CheckMarkIcon />

          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={2}
          >
            Thank you for sharing your experience and
          </Heading>
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
            mb={4}
          >
            preferences with us.
          </Heading>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
            maxW="600px"
            textAlign="center"
          >
            We are reviewing which volunteers would best fit those preferences. You will receive an
            email from us in the next 1-2 business days with the next steps. If you would like to
            connect with a LLSC staff before then, please reach out to{' '}
            <Text as="span" color={COLORS.teal} fontWeight={500}>
              FirstConnections@lls.org
            </Text>
            .
          </Text>
        </VStack>
      </Box>
    </Box>
  );

  return (
    <ProtectedPage allowedRoles={[UserRole.PARTICIPANT, UserRole.ADMIN]}>
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
                return <RankingScreen />;
              case 5:
                return <ThankYouScreen />;
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
                return <RankingScreen />;
              case 4:
                return <ThankYouScreen />;
              default:
                return <WelcomeScreenStep />;
            }
          })()}
    </ProtectedPage>
  );
}
