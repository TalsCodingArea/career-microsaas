/**
 * Core evaluation engine. Takes parsed questionnaire answers, runs the
 * scoring algorithm, and returns an EvaluationResult.
 *
 * v1 algorithm:
 *  - Base score from experience years (0-40 pts)
 *  - Effort score from apps/week (0-30 pts)
 *  - LinkedIn multiplier (0.8x – 1.2x)
 *  - Market demand modifier (from DB or mock data)
 *
 * Timeline is derived from the composite score.
 */

import type { Answer, EvaluationResult, INetworkingContact, MarketSnapshot } from '../types/index.js'
import { JobMarketData } from '../models/JobMarketData.js'
import { NetworkingContact } from '../models/NetworkingContact.js'

// Mock market data — Israeli market rates in ILS/month
const MOCK_MARKET: Record<string, Partial<MarketSnapshot>> = {
  software_engineering: { openPositions: 12000, avgSalaryMin: 20000, avgSalaryMax: 40000, demandLevel: 'high' },
  data_science: { openPositions: 4500, avgSalaryMin: 22000, avgSalaryMax: 42000, demandLevel: 'high' },
  product_management: { openPositions: 3000, avgSalaryMin: 24000, avgSalaryMax: 45000, demandLevel: 'medium' },
  design: { openPositions: 2500, avgSalaryMin: 15000, avgSalaryMax: 28000, demandLevel: 'medium' },
  cyber: { openPositions: 5000, avgSalaryMin: 22000, avgSalaryMax: 45000, demandLevel: 'high' },
  devops: { openPositions: 4000, avgSalaryMin: 20000, avgSalaryMax: 40000, demandLevel: 'high' },
  fintech: { openPositions: 2000, avgSalaryMin: 18000, avgSalaryMax: 35000, demandLevel: 'medium' },
  biotech: { openPositions: 1500, avgSalaryMin: 16000, avgSalaryMax: 30000, demandLevel: 'medium' },
  marketing: { openPositions: 3500, avgSalaryMin: 12000, avgSalaryMax: 25000, demandLevel: 'medium' },
  engineering_manager: { openPositions: 1800, avgSalaryMin: 35000, avgSalaryMax: 60000, demandLevel: 'medium' },
  default: { openPositions: 2000, avgSalaryMin: 15000, avgSalaryMax: 28000, demandLevel: 'medium' },
}

const MOCK_CONTACTS: INetworkingContact[] = [
  { name: 'יואב כהן', role: 'מהנדס תוכנה בכיר', company: 'Wix', linkedinUrl: 'https://linkedin.com', careerPathTags: ['software_engineering'], relevanceScore: 0.95 },
  { name: 'שירה לוי', role: 'מנהלת הנדסה', company: 'Monday.com', linkedinUrl: 'https://linkedin.com', careerPathTags: ['software_engineering', 'engineering_manager'], relevanceScore: 0.9 },
  { name: 'עמי ברק', role: 'מדען נתונים', company: 'IronSource', linkedinUrl: 'https://linkedin.com', careerPathTags: ['data_science'], relevanceScore: 0.92 },
  { name: 'נועה אברהם', role: 'מנהלת מוצר', company: 'Fiverr', linkedinUrl: 'https://linkedin.com', careerPathTags: ['product_management'], relevanceScore: 0.88 },
  { name: 'רן גולן', role: 'מומחה סייבר', company: 'CyberArk', linkedinUrl: 'https://linkedin.com', careerPathTags: ['cyber'], relevanceScore: 0.91 },
  { name: 'מיכל שפירא', role: 'מעצבת UX', company: 'Elementor', linkedinUrl: 'https://linkedin.com', careerPathTags: ['design'], relevanceScore: 0.85 },
]

function getAnswerValue(answers: Answer[], questionId: string): string | number | undefined {
  const found = answers.find(a => a.questionId === questionId)
  if (!found) return undefined
  const v = found.answer
  return Array.isArray(v) ? v[0] : v
}

function experienceScore(years: number): number {
  if (years >= 10) return 40
  if (years >= 6) return 35
  if (years >= 3) return 25
  if (years >= 1) return 15
  return 5
}

function effortScore(appsPerWeek: number): number {
  if (appsPerWeek >= 10) return 30
  if (appsPerWeek >= 5) return 22
  if (appsPerWeek >= 3) return 15
  if (appsPerWeek >= 1) return 8
  return 0
}

function linkedinMultiplier(rating: number): number {
  const clamped = Math.max(1, Math.min(5, rating))
  return 0.8 + (clamped - 1) * 0.1
}

function demandModifier(level: 'low' | 'medium' | 'high'): number {
  if (level === 'high') return 1.1
  if (level === 'low') return 0.85
  return 1.0
}

function derivateTimeline(score: number): { min: number; max: number; label: string } {
  if (score >= 75) return { min: 2, max: 6, label: '2–6 שבועות' }
  if (score >= 55) return { min: 4, max: 10, label: '4–10 שבועות' }
  if (score >= 35) return { min: 8, max: 16, label: '8–16 שבועות' }
  return { min: 16, max: 26, label: '16–26 שבועות' }
}

function buildTips(answers: Answer[], score: number, demandLevel: 'low' | 'medium' | 'high'): string[] {
  const tips: string[] = []
  const apps = Number(getAnswerValue(answers, 'applications_per_week') ?? 0)
  const linkedin = Number(getAnswerValue(answers, 'linkedin_rating') ?? 3)
  const employed = getAnswerValue(answers, 'employment_status')

  if (apps < 5) tips.push('הגדל את כמות המועמדויות ל-5–10 בשבוע כדי לראות תוצאות מהירות יותר.')
  if (linkedin < 4) tips.push('השלם את פרופיל הלינקדאין שלך לרמת "All-Star" — זה מגדיל משמעותית את החשיפה לרקרוטרים.')
  if (employed === 'unemployed') tips.push('שקול עבודת פרילנס או קבלנות כדי למלא פערי תעסוקה בזמן החיפוש.')
  if (demandLevel === 'low') tips.push('התחום שלך נמצא בביקוש נמוך כעת. שקול תפקידים סמוכים כדי להרחיב את האפשרויות.')
  if (score < 40) tips.push('התמקד במועמדות ממוקדת ואחת ביום במקום שליחה המונית — איכות על פני כמות.')
  if (linkedin >= 4 && apps >= 5) tips.push('בסיס מצוין! נסה לפנות ישירות למנהלי גיוס בלינקדאין לקבלת מענה מהיר יותר.')

  return tips.slice(0, 4) // cap at 4 tips
}

export async function runEvaluation(answers: Answer[]): Promise<EvaluationResult> {
  const targetRole = String(getAnswerValue(answers, 'target_role') ?? 'software_engineering')
  const yearsExp = Number(getAnswerValue(answers, 'years_experience') ?? 0)
  const appsPerWeek = Number(getAnswerValue(answers, 'applications_per_week') ?? 0)
  const linkedinRating = Number(getAnswerValue(answers, 'linkedin_rating') ?? 3)

  // Try to get market data from DB, fall back to mock
  let marketData = await JobMarketData.findOne({ careerPath: targetRole }).lean()
  const mockFallback = MOCK_MARKET[targetRole] ?? MOCK_MARKET['default']!

  const marketSnapshot: MarketSnapshot = {
    careerPath: targetRole,
    openPositions: marketData?.openPositionsCount ?? mockFallback.openPositions ?? 10000,
    avgSalaryMin: marketData?.avgSalaryMin ?? mockFallback.avgSalaryMin ?? 70000,
    avgSalaryMax: marketData?.avgSalaryMax ?? mockFallback.avgSalaryMax ?? 120000,
    currency: marketData?.currency ?? 'ILS',
    demandLevel: (mockFallback.demandLevel as 'low' | 'medium' | 'high') ?? 'medium',
  }

  // Composite score
  const expPts = experienceScore(yearsExp)
  const effortPts = effortScore(appsPerWeek)
  const liMultiplier = linkedinMultiplier(linkedinRating)
  const demandMod = demandModifier(marketSnapshot.demandLevel)

  const rawScore = (expPts + effortPts) * liMultiplier * demandMod
  const score = Math.min(1, rawScore / 100) // normalize to 0–1

  const timeline = derivateTimeline(rawScore)
  const tips = buildTips(answers, rawScore, marketSnapshot.demandLevel)

  // Networking contacts
  let contacts = await NetworkingContact.find({ careerPathTags: targetRole })
    .sort({ relevanceScore: -1 })
    .limit(3)
    .lean()

  if (contacts.length === 0) {
    contacts = MOCK_CONTACTS.filter(c => c.careerPathTags.includes(targetRole)).slice(0, 3) as typeof contacts
    if (contacts.length === 0) {
      contacts = MOCK_CONTACTS.slice(0, 2) as typeof contacts
    }
  }

  return {
    timelineWeeksMin: timeline.min,
    timelineWeeksMax: timeline.max,
    timelineLabel: timeline.label,
    marketSnapshot,
    tips,
    networkingContacts: contacts as INetworkingContact[],
    score,
  }
}
