import type { Request, Response, NextFunction } from 'express'
import { JobMarketData } from '../models/JobMarketData.js'
import type { SkillItem } from '../types/index.js'

const MOCK_MARKET: Record<string, object> = {
  software_engineering: { careerPath: 'software_engineering', role: 'Software Engineer', location: 'global', openPositionsCount: 48000, avgSalaryMin: 95000, avgSalaryMax: 155000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  data_science: { careerPath: 'data_science', role: 'Data Scientist', location: 'global', openPositionsCount: 22000, avgSalaryMin: 100000, avgSalaryMax: 160000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  product_management: { careerPath: 'product_management', role: 'Product Manager', location: 'global', openPositionsCount: 15000, avgSalaryMin: 110000, avgSalaryMax: 170000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
  design: { careerPath: 'design', role: 'UX Designer', location: 'global', openPositionsCount: 12000, avgSalaryMin: 80000, avgSalaryMax: 130000, currency: 'USD', dataSource: 'mock', fetchedAt: new Date() },
}

const MOCK_SKILLS: Record<string, SkillItem[]> = {
  software_engineering: [
    { name: 'TypeScript', demandLevel: 'high', category: 'technical' },
    { name: 'React', demandLevel: 'high', category: 'technical' },
    { name: 'Node.js', demandLevel: 'high', category: 'technical' },
    { name: 'System Design', demandLevel: 'high', category: 'technical' },
    { name: 'Docker', demandLevel: 'medium', category: 'tool' },
    { name: 'AWS', demandLevel: 'medium', category: 'tool' },
    { name: 'SQL', demandLevel: 'medium', category: 'technical' },
    { name: 'Git', demandLevel: 'high', category: 'tool' },
  ],
  data_science: [
    { name: 'Python', demandLevel: 'high', category: 'technical' },
    { name: 'Machine Learning', demandLevel: 'high', category: 'technical' },
    { name: 'SQL', demandLevel: 'high', category: 'technical' },
    { name: 'TensorFlow/PyTorch', demandLevel: 'high', category: 'technical' },
    { name: 'Statistics', demandLevel: 'high', category: 'technical' },
    { name: 'Data Visualization', demandLevel: 'medium', category: 'technical' },
    { name: 'Spark', demandLevel: 'medium', category: 'tool' },
    { name: 'Communication', demandLevel: 'high', category: 'soft' },
  ],
  product_management: [
    { name: 'Product Strategy', demandLevel: 'high', category: 'soft' },
    { name: 'User Research', demandLevel: 'high', category: 'technical' },
    { name: 'Agile/Scrum', demandLevel: 'high', category: 'soft' },
    { name: 'SQL', demandLevel: 'medium', category: 'technical' },
    { name: 'Analytics Tools', demandLevel: 'medium', category: 'tool' },
    { name: 'Stakeholder Management', demandLevel: 'high', category: 'soft' },
    { name: 'Figma', demandLevel: 'medium', category: 'tool' },
    { name: 'Communication', demandLevel: 'high', category: 'soft' },
  ],
  design: [
    { name: 'Figma', demandLevel: 'high', category: 'tool' },
    { name: 'UX Research', demandLevel: 'high', category: 'technical' },
    { name: 'Prototyping', demandLevel: 'high', category: 'technical' },
    { name: 'Design Systems', demandLevel: 'high', category: 'technical' },
    { name: 'CSS', demandLevel: 'medium', category: 'technical' },
    { name: 'Motion Design', demandLevel: 'medium', category: 'technical' },
    { name: 'User Testing', demandLevel: 'high', category: 'soft' },
    { name: 'Communication', demandLevel: 'high', category: 'soft' },
  ],
  cyber: [
    { name: 'Penetration Testing', demandLevel: 'high', category: 'technical' },
    { name: 'Network Security', demandLevel: 'high', category: 'technical' },
    { name: 'Python', demandLevel: 'high', category: 'technical' },
    { name: 'SIEM Tools', demandLevel: 'medium', category: 'tool' },
    { name: 'Incident Response', demandLevel: 'high', category: 'technical' },
    { name: 'Cloud Security', demandLevel: 'high', category: 'technical' },
    { name: 'Reverse Engineering', demandLevel: 'medium', category: 'technical' },
    { name: 'Compliance/Regulation', demandLevel: 'medium', category: 'soft' },
  ],
  devops: [
    { name: 'Kubernetes', demandLevel: 'high', category: 'tool' },
    { name: 'Docker', demandLevel: 'high', category: 'tool' },
    { name: 'CI/CD Pipelines', demandLevel: 'high', category: 'technical' },
    { name: 'Terraform', demandLevel: 'high', category: 'tool' },
    { name: 'AWS/GCP/Azure', demandLevel: 'high', category: 'tool' },
    { name: 'Linux', demandLevel: 'high', category: 'technical' },
    { name: 'Python/Bash', demandLevel: 'medium', category: 'technical' },
    { name: 'Monitoring (Prometheus)', demandLevel: 'medium', category: 'tool' },
  ],
  engineering_manager: [
    { name: 'Leadership', demandLevel: 'high', category: 'soft' },
    { name: 'Technical Architecture', demandLevel: 'high', category: 'technical' },
    { name: 'Agile/Scrum', demandLevel: 'high', category: 'soft' },
    { name: 'Hiring & Mentoring', demandLevel: 'high', category: 'soft' },
    { name: 'Stakeholder Management', demandLevel: 'high', category: 'soft' },
    { name: 'System Design', demandLevel: 'medium', category: 'technical' },
    { name: 'Budget Planning', demandLevel: 'medium', category: 'soft' },
    { name: 'Communication', demandLevel: 'high', category: 'soft' },
  ],
  default: [
    { name: 'Problem Solving', demandLevel: 'high', category: 'soft' },
    { name: 'Communication', demandLevel: 'high', category: 'soft' },
    { name: 'Teamwork', demandLevel: 'high', category: 'soft' },
    { name: 'Continuous Learning', demandLevel: 'high', category: 'soft' },
    { name: 'Git', demandLevel: 'medium', category: 'tool' },
    { name: 'Agile', demandLevel: 'medium', category: 'soft' },
  ],
}

export async function getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { careerPath } = req.params
    if (!careerPath || careerPath.trim().length === 0) {
      res.status(400).json({ error: 'careerPath parameter is required' })
      return
    }
    const skills = MOCK_SKILLS[careerPath] ?? MOCK_SKILLS['default']!
    res.json({ careerPath, skills })
  } catch (err) {
    next(err)
  }
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
