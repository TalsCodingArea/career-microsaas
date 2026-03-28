import { Router } from 'express'
import { getJobMarket, getSkills } from '../controllers/jobMarketController.js'

const router = Router()

router.get('/job-market/:careerPath', getJobMarket)
router.get('/skills/:careerPath', getSkills)

export default router
