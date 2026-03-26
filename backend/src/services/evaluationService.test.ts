/**
 * Unit tests for the evaluation scoring algorithm.
 * These tests mock MongoDB models so no DB connection is needed.
 */

// Mock Mongoose models before importing the service
jest.mock('../models/JobMarketData.js', () => ({
  JobMarketData: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null as unknown),
    }),
  },
}))

jest.mock('../models/NetworkingContact.js', () => ({
  NetworkingContact: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([] as unknown[]),
        }),
      }),
    }),
  },
}))

import { runEvaluation } from './evaluationService.js'
import type { Answer } from '../types/index.js'

const baseAnswers: Answer[] = [
  { questionId: 'current_role', answer: 'software_engineering' },
  { questionId: 'years_experience', answer: 5 },
  { questionId: 'employment_status', answer: 'employed_looking' },
  { questionId: 'applications_per_week', answer: 8 },
  { questionId: 'location_preference', answer: 'remote' },
  { questionId: 'target_role', answer: 'software_engineering' },
  { questionId: 'linkedin_rating', answer: 4 },
]

describe('runEvaluation', () => {
  it('returns a valid EvaluationResult shape', async () => {
    const result = await runEvaluation(baseAnswers)

    expect(result).toHaveProperty('timelineWeeksMin')
    expect(result).toHaveProperty('timelineWeeksMax')
    expect(result).toHaveProperty('timelineLabel')
    expect(result).toHaveProperty('marketSnapshot')
    expect(result).toHaveProperty('tips')
    expect(result).toHaveProperty('networkingContacts')
    expect(result).toHaveProperty('score')
  })

  it('score is between 0 and 1', async () => {
    const result = await runEvaluation(baseAnswers)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(1)
  })

  it('timeline min is less than max', async () => {
    const result = await runEvaluation(baseAnswers)
    expect(result.timelineWeeksMin).toBeLessThan(result.timelineWeeksMax)
  })

  it('higher experience produces higher score', async () => {
    const juniorAnswers: Answer[] = baseAnswers.map(a =>
      a.questionId === 'years_experience' ? { ...a, answer: 0 } : a
    )
    const seniorAnswers: Answer[] = baseAnswers.map(a =>
      a.questionId === 'years_experience' ? { ...a, answer: 15 } : a
    )

    const [junior, senior] = await Promise.all([
      runEvaluation(juniorAnswers),
      runEvaluation(seniorAnswers),
    ])

    expect(senior.score).toBeGreaterThan(junior.score)
    expect(senior.timelineWeeksMax).toBeLessThanOrEqual(junior.timelineWeeksMax)
  })

  it('more applications per week produces higher score', async () => {
    const lowEffort: Answer[] = baseAnswers.map(a =>
      a.questionId === 'applications_per_week' ? { ...a, answer: 0 } : a
    )
    const highEffort: Answer[] = baseAnswers.map(a =>
      a.questionId === 'applications_per_week' ? { ...a, answer: 20 } : a
    )

    const [low, high] = await Promise.all([
      runEvaluation(lowEffort),
      runEvaluation(highEffort),
    ])

    expect(high.score).toBeGreaterThan(low.score)
  })

  it('returns tips array', async () => {
    const result = await runEvaluation(baseAnswers)
    expect(Array.isArray(result.tips)).toBe(true)
  })

  it('marketSnapshot has required fields', async () => {
    const result = await runEvaluation(baseAnswers)
    expect(result.marketSnapshot).toHaveProperty('careerPath')
    expect(result.marketSnapshot).toHaveProperty('openPositions')
    expect(result.marketSnapshot).toHaveProperty('demandLevel')
    expect(['low', 'medium', 'high']).toContain(result.marketSnapshot.demandLevel)
  })
})
