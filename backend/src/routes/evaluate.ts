import { Router } from 'express'
import { evaluate } from '../controllers/evaluateController.js'

const router = Router()

router.post('/evaluate', evaluate)

export default router
