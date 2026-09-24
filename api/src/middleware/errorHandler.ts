import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500

  res.status(statusCode).json({
    message: err instanceof Error ? err.message : 'Server error',
  })
}

export default errorHandler
