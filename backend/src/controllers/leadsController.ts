import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Lead } from '../models/Lead.js'

const LeadSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).max(100).optional(),
  sessionId: z.string().uuid().optional(),
  careerPath: z.string().min(1).max(100).optional(),
})

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = LeadSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
      return
    }

    const { email, name, sessionId, careerPath } = parsed.data

    // Upsert by email so duplicate submissions don't create duplicate records
    const lead = await Lead.findOneAndUpdate(
      { email },
      { email, name, sessionId, careerPath },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.status(201).json({ id: lead._id, email: lead.email })
  } catch (err) {
    next(err)
  }
}
