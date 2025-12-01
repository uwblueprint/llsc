export type RankingEntry = {
  label: string;
  rank: number;
  scope?: 'self' | 'loved_one' | string;
  kind?: 'quality' | 'experience' | 'treatment' | string;
};

export type RankingOption = {
  key: string;
  label: string;
  statement: string;
  scope: 'self' | 'loved_one';
  kind: 'quality' | 'experience' | 'treatment';
};

export type RankingOptionsResponse = {
  staticQualities?: {
    qualityId: number;
    slug: string;
    label: string;
    allowedScopes?: Array<'self' | 'loved_one'>;
  }[];
  dynamicOptions?: {
    id: number;
    kind: 'experience' | 'treatment';
    name: string;
    scope: 'self' | 'loved_one';
  }[];
};

export interface ParticipantRankingAnswers {
  status?: string;
  selectedQualities: string[];
  rankedPreferences: string[];
  rankings: RankingEntry[];
  volunteerType?: string;
  isCaregiverVolunteerFlow?: boolean;
  participantType?: 'cancerPatient' | 'caregiver' | string;
  additionalNotes?: string;
}

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const buildRankingStatement = (
  summary: string,
  kind: RankingEntry['kind'] = 'quality',
  scope: RankingEntry['scope'] = 'self',
): string => {
  const trimmed = summary.trim();
  if (/^I would prefer a volunteer/i.test(trimmed)) {
    return trimmed;
  }

  const isLovedOneQuality = kind === 'quality' && scope === 'loved_one';
  const isLovedOneDynamic =
    (kind === 'treatment' || kind === 'experience') && scope === 'loved_one';

  let prefix = 'I would prefer a volunteer with ';

  if (isLovedOneQuality) {
    prefix = 'I would prefer a volunteer whose loved one is ';
  } else if (isLovedOneDynamic) {
    prefix = 'I would prefer a volunteer whose loved one has ';
  } else if (kind === 'experience') {
    prefix = 'I would prefer a volunteer who has experienced ';
  } else if (kind === 'treatment') {
    prefix = 'I would prefer a volunteer who has undergone ';
  }

  return `${prefix}${trimmed}`;
};

export const buildRankingPreviewStatement = (entry: RankingEntry): string => {
  const label = entry.label?.trim() || 'this preference';
  const { kind, scope } = entry;

  if (/^I would prefer a volunteer/i.test(label)) {
    return label;
  }

  return buildRankingStatement(
    label,
    kind === 'experience' || kind === 'treatment' ? kind : 'quality',
    scope === 'loved_one' ? 'loved_one' : 'self',
  );
};

export const buildQualitySummaryLabel = (label: string): string => {
  if (!label) {
    return '';
  }
  let summary = label.trim();
  const prefixPatterns = [
    /^I would prefer a volunteer with /i,
    /^I would prefer a volunteer whose loved one is /i,
    /^I would prefer a volunteer whose loved one has /i,
    /^I would prefer a volunteer who has /i,
    /^I would prefer a volunteer who is /i,
    /^I would prefer a volunteer who can /i,
    /^I would prefer a volunteer experienced with /i,
    /^I would prefer a volunteer familiar with /i,
    /^I would prefer a volunteer comfortable discussing /i,
    /^I would prefer a volunteer who understands /i,
    /^I would prefer a volunteer who can share /i,
  ];

  for (const pattern of prefixPatterns) {
    if (pattern.test(summary)) {
      summary = summary.replace(pattern, '');
      break;
    }
  }

  summary = summary.replace(/\.$/, '');

  if (/^[a-zA-Z]+:[\w:-]+$/u.test(summary)) {
    const parts = summary.split(':');
    summary = parts[parts.length - 1];
  }

  summary = summary.replace(/[-_]/g, ' ');
  summary = summary.replace(/\s+/g, ' ').trim();

  if (!summary.length) {
    return label.trim();
  }

  return summary.charAt(0).toUpperCase() + summary.slice(1);
};

export const transformRankingOptionsResponse = (data: RankingOptionsResponse): RankingOption[] => {
  const options: RankingOption[] = [];

  (data.staticQualities || []).forEach((quality) => {
    const scopes =
      quality.allowedScopes && quality.allowedScopes.length
        ? quality.allowedScopes
        : (['self'] as Array<'self' | 'loved_one'>);
    scopes.forEach((scope) => {
      const shortLabel =
        scope === 'loved_one' ? `${quality.label} my loved one` : `${quality.label} me`;
      const key = `quality:${quality.qualityId}:${scope}`;
      options.push({
        key,
        label: shortLabel,
        statement: buildRankingStatement(shortLabel, 'quality', scope),
        scope,
        kind: 'quality',
      });
    });
  });

  (data.dynamicOptions || []).forEach((option) => {
    const shortLabel = `experience with ${option.name}`;
    const key = `${option.kind}:${option.id}:${option.scope}`;
    options.push({
      key,
      label: shortLabel,
      statement: buildRankingStatement(shortLabel, option.kind, option.scope),
      scope: option.scope,
      kind: option.kind,
    });
  });

  return options;
};

export const buildLegacyRankingOptions = (
  answers: ParticipantRankingAnswers | undefined,
): RankingOption[] => {
  if (!answers?.rankings?.length) {
    return [];
  }

  return answers.rankings.map((entry, index) => {
    const key =
      answers.selectedQualities?.[index] ||
      entry.label ||
      `legacy-${entry.kind || 'quality'}-${index}`;
    const scope = (entry.scope === 'loved_one' ? 'loved_one' : 'self') as 'self' | 'loved_one';
    const kind = (
      entry.kind === 'experience' || entry.kind === 'treatment' ? entry.kind : 'quality'
    ) as 'quality' | 'experience' | 'treatment';
    const shortLabel = buildQualitySummaryLabel(entry.label || key);

    return {
      key,
      label: shortLabel,
      statement: entry.label || buildRankingStatement(shortLabel, kind, scope),
      scope,
      kind,
    };
  });
};

const parseRankingEntries = (value: unknown, fallbackLabels: string[]): RankingEntry[] => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>;
          const label =
            typeof record.label === 'string'
              ? record.label
              : fallbackLabels[idx] || `Preference ${idx + 1}`;
          const scope = typeof record.scope === 'string' ? (record.scope as string) : undefined;
          const kind = typeof record.kind === 'string' ? (record.kind as string) : undefined;
          const rankValue = record.rank;
          const numericRank =
            typeof rankValue === 'number'
              ? rankValue
              : typeof rankValue === 'string' && !Number.isNaN(Number(rankValue))
                ? Number(rankValue)
                : idx + 1;
          return {
            label,
            rank: numericRank,
            scope,
            kind,
          };
        }
        return null;
      })
      .filter((entry): entry is RankingEntry => Boolean(entry));

    if (normalized.length) {
      return normalized
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    }
  }

  return fallbackLabels.map((label, index) => ({
    label,
    rank: index + 1,
  }));
};

export const normalizeParticipantRankingAnswers = (
  raw: Record<string, unknown> | ParticipantRankingAnswers | null | undefined,
): ParticipantRankingAnswers => {
  const source =
    raw && typeof raw === 'object'
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const selectedQualities =
    ensureStringArray(source['selectedQualities']) ||
    ensureStringArray(source['selected_qualities']);

  const rankedPreferencesInput =
    ensureStringArray(source['rankedPreferences']) ||
    ensureStringArray(source['ranked_preferences']);

  const rankingEntries = parseRankingEntries(
    source['rankings'] ?? source['ranked_entries'],
    rankedPreferencesInput.length ? rankedPreferencesInput : [],
  );

  const rankedPreferences =
    rankingEntries.length > 0 ? rankingEntries.map((entry) => entry.label) : rankedPreferencesInput;

  return {
    status:
      typeof source['status'] === 'string' ? (source['status'] as string) : 'pending-approval',
    selectedQualities,
    rankedPreferences,
    rankings: rankingEntries.length
      ? rankingEntries
      : rankedPreferences.map((label, index) => ({ label, rank: index + 1 })),
    volunteerType:
      (typeof source['volunteerType'] === 'string' && (source['volunteerType'] as string)) ||
      (typeof source['volunteer_type'] === 'string' && (source['volunteer_type'] as string)) ||
      undefined,
    isCaregiverVolunteerFlow:
      typeof source['isCaregiverVolunteerFlow'] === 'boolean'
        ? (source['isCaregiverVolunteerFlow'] as boolean)
        : typeof source['is_caregiver_volunteer_flow'] === 'boolean'
          ? (source['is_caregiver_volunteer_flow'] as boolean)
          : undefined,
    participantType:
      (typeof source['participantType'] === 'string' && (source['participantType'] as string)) ||
      (typeof source['participant_type'] === 'string' && (source['participant_type'] as string)) ||
      undefined,
    additionalNotes:
      (typeof source['additionalNotes'] === 'string' && (source['additionalNotes'] as string)) ||
      (typeof source['additional_notes'] === 'string' && (source['additional_notes'] as string)) ||
      undefined,
  };
};
