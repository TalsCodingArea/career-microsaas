import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import evaluateRouter from './routes/evaluate.js'
import jobMarketRouter from './routes/jobMarket.js'
import leadsRouter from './routes/leads.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
]

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`CORS policy: origin ${origin} not allowed`))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
)

app.use(express.json({ limit: '1mb' }))

// Routes
app.use('/', healthRouter)
app.use('/api', evaluateRouter)
app.use('/api', jobMarketRouter)
app.use('/api', leadsRouter)

// 404 and error handlers (must be last)
app.use(notFound)
app.use(errorHandler)

export default app
