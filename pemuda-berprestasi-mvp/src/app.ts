// src/app.ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth'
import pelatihRoutes from './routes/pelatih'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// Load environment variables
dotenv.config()

const app = express()

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/pelatih', pelatihRoutes)

// Routes untuk Developer B nanti:
// app.use('/api/dojang', dojangRoutes)
// app.use('/api/atlet', atletRoutes)
// app.use('/api/kompetisi', kompetisiRoutes)
// app.use('/api/admin', adminRoutes)

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

export default app