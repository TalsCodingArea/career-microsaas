import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

const PORT = Number(process.env.PORT ?? 4000)
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/career-microsaas'

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log(`[DB] Connected to MongoDB`)
  } catch (err) {
    console.warn(`[DB] Could not connect to MongoDB — running without persistence:`, (err as Error).message)
  }

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`)
    console.log(`[Server] Health: http://localhost:${PORT}/health`)
  })
}

main()
