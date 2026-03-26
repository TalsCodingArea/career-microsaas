import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { runEvaluation } from '../services/evaluationService.js'
import { UserSession } from '../models/UserSession.js'

const AnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.union([z.string(), z.array(z.string()), z.number()]),
})

const EvaluateSchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID'),
  answers: z.array(AnswerSchema).min(1, 'At least one answer is required'),
})

function deriveCareerPath(answers: Array<{ questionId: string; answer: unknown }>): string {
  const targetRole = answers.find(a => a.questionId === 'target_role')
  if (targetRole && typeof targetRole.answer === 'string') return targetRole.answer
  const currentRole = answers.find(a => a.questionId === 'current_role')
  if (currentRole && typeof currentRole.answer === 'string') return currentRole.answer
  return 'other'
}

function deriveExperienceLevel(answers: Array<{ questionId: string; answer: unknown }>) {
  const exp = answers.find(a => a.questionId === 'years_experience')
  const years = exp ? Number(exp.answer) : 0
  if (years >= 10) return 'executive' as const
  if (years >= 5) return 'senior' as const
  if (years >= 2) return 'mid' as const
  return 'junior' as const
}

export async function evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = EvaluateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
      return
    }

    const { sessionId, answers } = parsed.data
    const result = await runEvaluation(answers as Array<{ questionId: string; answer: string | string[] | number }>)

    // Upsert session record
    await UserSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        answers,
        careerPath: deriveCareerPath(answers),
        experienceLevel: deriveExperienceLevel(answers),
        resultSnapshot: result,
      },
      { upsert: true, new: true }
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
}
