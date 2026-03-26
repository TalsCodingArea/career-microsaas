import { Router } from 'express'
import { getJobMarket } from '../controllers/jobMarketController.js'

const router = Router()

router.get('/job-market/:careerPath', getJobMarket)

export default router
