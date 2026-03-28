/**
 * Shared TypeScript interfaces for the Career MicroSaaS backend.
 * These mirror the Mongoose schemas and are used for typed API I/O.
 */

export interface Answer {
  questionId: string;
  answer: string | string[] | number;
}

export interface IUserSession {
  sessionId: string;
  answers: Answer[];
  careerPath: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
  createdAt: Date;
  resultSnapshot?: EvaluationResult;
}

export interface IJobMarketData {
  careerPath: string;
  role: string;
  location: string;
  openPositionsCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  currency: string;
  dataSource: string;
  fetchedAt: Date;
}

export interface INetworkingContact {
  name: string;
  role: string;
  company: string;
  linkedinUrl: string;
  careerPathTags: string[];
  relevanceScore: number;
}

export interface SkillItem {
  name: string;
  demandLevel: 'low' | 'medium' | 'high';
  category: 'technical' | 'soft' | 'tool';
}

export interface EvaluationResult {
  timelineWeeksMin: number;
  timelineWeeksMax: number;
  timelineLabel: string;
  marketSnapshot: MarketSnapshot;
  tips: string[];
  networkingContacts: INetworkingContact[];
  pinnedRepos: PinnedRepo[];
  skills: SkillItem[];
  score: number;
}

export interface MarketSnapshot {
  careerPath: string;
  openPositions: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  currency: string;
  demandLevel: 'low' | 'medium' | 'high';
}

export interface PinnedRepo {
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  careerPathTags: string[];
}

export interface EvaluateRequest {
  sessionId: string;
  answers: Answer[];
}

export interface SkillsData {
  careerPath: string;
  skills: SkillItem[];
}
