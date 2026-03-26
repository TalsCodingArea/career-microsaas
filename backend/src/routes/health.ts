import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected'

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus,
    version: '1.0.0',
  })
})

export default router
