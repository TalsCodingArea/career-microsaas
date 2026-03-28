import type { Answer, EvaluationResult, SkillsData } from '../types/QuestionnaireTypes.ts'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function submitEvaluation(
  sessionId: string,
  answers: Answer[]
): Promise<EvaluationResult> {
  const res = await fetch(`${API_BASE}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, answers }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }

  return res.json()
}

export async function getJobMarket(careerPath: string) {
  const res = await fetch(`${API_BASE}/api/job-market/${encodeURIComponent(careerPath)}`)
  if (!res.ok) throw new Error('Failed to fetch job market data')
  return res.json()
}

export async function getSkills(careerPath: string): Promise<SkillsData> {
  const res = await fetch(`${API_BASE}/api/skills/${encodeURIComponent(careerPath)}`)
  if (!res.ok) throw new Error('Failed to fetch skills data')
  return res.json()
}
