import type { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500
  const message = err.message ?? 'Internal Server Error'

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${status} — ${message}`, err.stack)
  }

  res.status(status).json({ error: message })
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' })
}
