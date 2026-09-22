import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import resourceRoutes from './routes/resource.js'
import errorHandler from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use(errorHandler)

const startServer = async (): Promise<void> => {
  await connectDB()

  app.listen(port, () => {
    console.log(`API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})
