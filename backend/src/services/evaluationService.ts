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

import type { Answer, EvaluationResult, INetworkingContact, MarketSnapshot, PinnedRepo } from '../types/index.js'
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
  // Top LangChain voices — recommended follows for AI/ML engineers
  { name: 'Harrison Chase', role: 'Co-founder & CEO', company: 'LangChain', linkedinUrl: 'https://www.linkedin.com/in/harrison-chase-961287118', careerPathTags: ['data_science', 'software_engineering', 'langchain'], relevanceScore: 0.99 },
  { name: 'Ankush Gola', role: 'Co-founder', company: 'LangChain', linkedinUrl: 'https://www.linkedin.com/in/ankush-gola', careerPathTags: ['data_science', 'software_engineering', 'langchain'], relevanceScore: 0.98 },
  { name: 'Greg Kamradt', role: 'AI Developer & Educator', company: 'Independent', linkedinUrl: 'https://www.linkedin.com/in/gregkamradt', careerPathTags: ['data_science', 'langchain'], relevanceScore: 0.93 },
  { name: 'Sam Witteveen', role: 'AI Engineer & Content Creator', company: 'Red Dragon AI', linkedinUrl: 'https://www.linkedin.com/in/samwitteveen', careerPathTags: ['data_science', 'software_engineering', 'langchain'], relevanceScore: 0.91 },
  { name: 'Roie Schwaber-Cohen', role: 'Developer Advocate', company: 'Pinecone', linkedinUrl: 'https://www.linkedin.com/in/roie-schwaber-cohen', careerPathTags: ['data_science', 'langchain'], relevanceScore: 0.89 },
]

const PINNED_REPOS: PinnedRepo[] = [
  // Software Engineering
  { name: 'freeCodeCamp', description: 'פלטפורמת לימוד קוד עם אלפי תרגילים ופרויקטים', url: 'https://github.com/freeCodeCamp/freeCodeCamp', language: 'TypeScript', stars: 400000, careerPathTags: ['software_engineering'] },
  { name: 'public-apis', description: 'רשימה מקיפה של APIs ציבוריים לפרויקטי צד', url: 'https://github.com/public-apis/public-apis', language: 'Python', stars: 320000, careerPathTags: ['software_engineering', 'devops'] },
  { name: 'system-design-primer', description: 'מדריך לעיצוב מערכות — חובה לכל ראיון בכיר', url: 'https://github.com/donnemartin/system-design-primer', language: 'Python', stars: 280000, careerPathTags: ['software_engineering', 'engineering_manager'] },
  { name: 'react', description: 'ספריית ה-UI הפופולרית ביותר — תרומה מוסיפה לפרופיל', url: 'https://github.com/facebook/react', language: 'JavaScript', stars: 230000, careerPathTags: ['software_engineering'] },
  { name: 'awesome-interview-questions', description: 'שאלות ראיון קלאסיות — הכנה מצוינת לתהליכי גיוס', url: 'https://github.com/DopplerHQ/awesome-interview-questions', language: 'Markdown', stars: 68000, careerPathTags: ['software_engineering'] },
  { name: 'build-your-own-x', description: 'בנה כלים מפורסמים מאפס — מדגים הבנה עמוקה', url: 'https://github.com/codecrafters-io/build-your-own-x', language: 'Markdown', stars: 320000, careerPathTags: ['software_engineering'] },
  // Data Science / ML
  { name: 'scikit-learn', description: 'ספריית ML קנונית — תרומות מוכיחות מיומנות', url: 'https://github.com/scikit-learn/scikit-learn', language: 'Python', stars: 60000, careerPathTags: ['data_science'] },
  { name: 'pytorch', description: 'framework מוביל לדיפ לרנינג — ביקוש גבוה בשוק', url: 'https://github.com/pytorch/pytorch', language: 'Python', stars: 84000, careerPathTags: ['data_science'] },
  { name: 'awesome-machine-learning', description: 'קולקציית כלים ומשאבים ב-ML — מייצגת ידע רחב', url: 'https://github.com/josephmisiti/awesome-machine-learning', language: 'Python', stars: 67000, careerPathTags: ['data_science'] },
  { name: 'pandas', description: 'ספריית עיבוד נתונים מובילה — בסיסית לכל מדען נתונים', url: 'https://github.com/pandas-dev/pandas', language: 'Python', stars: 44000, careerPathTags: ['data_science'] },
  { name: 'streamlit', description: 'יצירת אפליקציות נתונים מהירה — מדגים יכולת end-to-end', url: 'https://github.com/streamlit/streamlit', language: 'Python', stars: 37000, careerPathTags: ['data_science'] },
  { name: 'mlflow', description: 'ניהול מחזור חיי ML — רלוונטי לתפקידים ב-MLOps', url: 'https://github.com/mlflow/mlflow', language: 'Python', stars: 19000, careerPathTags: ['data_science'] },
  // DevOps
  { name: 'kubernetes', description: 'תזמון containers מוביל — חובה לכל DevOps Engineer', url: 'https://github.com/kubernetes/kubernetes', language: 'Go', stars: 112000, careerPathTags: ['devops'] },
  { name: 'terraform', description: 'Infrastructure as Code — סטנדרט תעשייתי', url: 'https://github.com/hashicorp/terraform', language: 'Go', stars: 43000, careerPathTags: ['devops'] },
  { name: 'ansible', description: 'אוטומציית IT — נפוץ מאוד בחברות ישראליות', url: 'https://github.com/ansible/ansible', language: 'Python', stars: 63000, careerPathTags: ['devops'] },
  { name: 'prometheus', description: 'מוניטורינג ואלרטינג — מרכזי בסטאק DevOps מודרני', url: 'https://github.com/prometheus/prometheus', language: 'Go', stars: 56000, careerPathTags: ['devops'] },
  { name: 'docker-compose', description: 'הגדרת סביבות multi-container — כלי יומיומי', url: 'https://github.com/docker/compose', language: 'Go', stars: 34000, careerPathTags: ['devops'] },
  { name: 'awesome-devops', description: 'קולקציית כלי DevOps — מדגים היכרות רחבה עם התחום', url: 'https://github.com/wmariuss/awesome-devops', language: 'Markdown', stars: 8000, careerPathTags: ['devops'] },
  // Cyber
  { name: 'metasploit-framework', description: 'פריימוורק לבדיקות חדירה — רלוונטי לאנשי סייבר', url: 'https://github.com/rapid7/metasploit-framework', language: 'Ruby', stars: 34000, careerPathTags: ['cyber'] },
  { name: 'awesome-hacking', description: 'משאבי אבטחת מידע — מדגים עומק בתחום', url: 'https://github.com/Hack-with-Github/Awesome-Hacking', language: 'Markdown', stars: 84000, careerPathTags: ['cyber'] },
  { name: 'PayloadsAllTheThings', description: 'Payloads לבדיקות אבטחה — חומר מחקרי מקצועי', url: 'https://github.com/swisskyrepo/PayloadsAllTheThings', language: 'Markdown', stars: 62000, careerPathTags: ['cyber'] },
  { name: 'theHarvester', description: 'כלי OSINT לאיסוף מידע — נפוץ בתחום', url: 'https://github.com/laramies/theHarvester', language: 'Python', stars: 11000, careerPathTags: ['cyber'] },
  { name: 'WebGoat', description: 'אפליקציה לתרגול אבטחת אפליקציות ווב', url: 'https://github.com/WebGoat/WebGoat', language: 'Java', stars: 6900, careerPathTags: ['cyber'] },
  { name: 'nuclei', description: 'סריקת פגיעויות מהירה — כלי מוביל בתחום', url: 'https://github.com/projectdiscovery/nuclei', language: 'Go', stars: 21000, careerPathTags: ['cyber'] },
  // Product Management
  { name: 'awesome-product-management', description: 'משאבי ניהול מוצר — מדגים ידע מקצועי רחב', url: 'https://github.com/dend/awesome-product-management', language: 'Markdown', stars: 1700, careerPathTags: ['product_management'] },
  { name: 'public-apis', description: 'APIs ציבוריים לבניית פרויקטי POC מהירים', url: 'https://github.com/public-apis/public-apis', language: 'Python', stars: 320000, careerPathTags: ['product_management'] },
  // Design
  { name: 'material-ui', description: 'ספריית UI מבוססת Material Design — ביקוש גבוה', url: 'https://github.com/mui/material-ui', language: 'TypeScript', stars: 94000, careerPathTags: ['design'] },
  { name: 'tailwindcss', description: 'Utility-first CSS framework — פופולרי מאוד', url: 'https://github.com/tailwindlabs/tailwindcss', language: 'CSS', stars: 84000, careerPathTags: ['design', 'software_engineering'] },
  // Engineering Manager
  { name: 'engineering-blogs', description: 'בלוגי הנדסה של חברות מובילות — לימוד וידע ניהולי', url: 'https://github.com/kilimchoi/engineering-blogs', language: 'Markdown', stars: 32000, careerPathTags: ['engineering_manager'] },
  { name: 'awesome-leading-and-managing', description: 'תוכן על מסלול ניהול הנדסה — מדגים בשלות מנהיגותית', url: 'https://github.com/LappleApple/awesome-leading-and-managing', language: 'Markdown', stars: 12000, careerPathTags: ['engineering_manager'] },
]

function pickPinnedRepos(careerPath: string): PinnedRepo[] {
  const relevant = PINNED_REPOS.filter(r => r.careerPathTags.includes(careerPath))
  if (relevant.length >= 6) return relevant.slice(0, 6)
  const fallback = PINNED_REPOS.filter(r => r.careerPathTags.includes('software_engineering') && !relevant.includes(r))
  return [...relevant, ...fallback].slice(0, 6)
}

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
    pinnedRepos: pickPinnedRepos(targetRole),
    score,
  }
}
