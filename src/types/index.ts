export type UserRole = 'Patient' | 'Caregiver' | 'Healthcare Staff' | 'Administrator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  sourceQuote?: string;
}

export interface WarningSign {
  text: string;
  severity?: 'low' | 'medium' | 'high';
  sourceQuote?: string;
}

export interface FollowUp {
  description: string;
  date?: string;
  provider?: string;
  sourceQuote?: string;
}

export interface DietInstruction {
  text: string;
  sourceQuote?: string;
}

export interface CarePlan {
  medications: Medication[];
  warningSigns: WarningSign[];
  followUps: FollowUp[];
  diet: DietInstruction[];
  activity?: string;
  otherInstructions?: string[];
  faithfulnessStatus?: 'pending' | 'verified' | 'flagged';
}

export interface DischargeDocument {
  id: string;
  title: string;
  rawText: string;
  uploadedAt: string;
  extracted?: Partial<CarePlan>;
  carePlan?: CarePlan;
}
