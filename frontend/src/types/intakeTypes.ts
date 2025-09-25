export interface IntakeExperience {
  id: number;
  name: string;
  scope: string;
}

export interface IntakeTreatment {
  id: number;
  name: string;
}

export interface IntakeOptionsResponse {
  experiences: IntakeExperience[];
  treatments: IntakeTreatment[];
}
