import type { Request, Response, NextFunction } from 'express'
import { JobMarketData } from '../models/JobMarketData.js'

const MOCK_MARKET: Record<string, object> = {
  software_engineering: { careerPath: 'software_engineering', role: 'Software Engineer', location: 'global', openPositionsCount: 48000, avgSalaryMin: 95000, avgSalaryMax: 155000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  data_science: { careerPath: 'data_science', role: 'Data Scientist', location: 'global', openPositionsCount: 22000, avgSalaryMin: 100000, avgSalaryMax: 160000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  product_management: { careerPath: 'product_management', role: 'Product Manager', location: 'global', openPositionsCount: 15000, avgSalaryMin: 110000, avgSalaryMax: 170000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  design: { careerPath: 'design', role: 'UX Designer', location: 'global', openPositionsCount: 12000, avgSalaryMin: 80000, avgSalaryMax: 130000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
}

export async function getJobMarket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { careerPath } = req.params

    if (!careerPath || careerPath.trim().length === 0) {
      res.status(400).json({ error: 'careerPath parameter is required' })
      return
    }

    const data = await JobMarketData.findOne({ careerPath }).lean()
    if (data) {
      res.json(data)
      return
    }

    const mock = MOCK_MARKET[careerPath]
    if (mock) {
      res.json(mock)
      return
    }

    res.status(404).json({ error: `No market data found for career path: ${careerPath}` })
  } catch (err) {
    next(err)
  }
}
