/**
 * TypeScript definitions for the questionnaire config (questionnaire.json)
 * and runtime state used across the frontend.
 */

export interface QuestionOption {
  value: string;
  label: string;
}

export interface ConditionalBranch {
  when?: {
    field: string;
    equals: string;
  };
  default?: boolean;
  goto: string;
}

export type NextRule =
  | string
  | null
  | {
      type: 'conditional';
      branches: ConditionalBranch[];
    };

export type QuestionType = 'single' | 'multi' | 'slider' | 'text';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  labels?: Record<string, string>;
  next: NextRule;
}

export interface QuestionnaireConfig {
  version: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  answer: string | string[] | number;
}

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'executive';

export interface QuestionnaireState {
  sessionId: string;
  currentQuestionIndex: number;
  answers: Answer[];
  isComplete: boolean;
  isSubmitting: boolean;
  result: EvaluationResult | null;
  error: string | null;
}

export interface MarketSnapshot {
  careerPath: string;
  openPositions: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  currency: string;
  demandLevel: 'low' | 'medium' | 'high';
}

export interface NetworkingContact {
  name: string;
  role: string;
  company: string;
  linkedinUrl: string;
  careerPathTags: string[];
  relevanceScore: number;
}

export interface EvaluationResult {
  timelineWeeksMin: number;
  timelineWeeksMax: number;
  timelineLabel: string;
  marketSnapshot: MarketSnapshot;
  tips: string[];
  networkingContacts: NetworkingContact[];
  score: number;
}
