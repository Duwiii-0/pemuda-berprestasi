// src/app.ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth'
import pelatihRoutes from './routes/pelatih'
import dojangRoutes from './routes/dojang'
import atletRoutes from './routes/atlet'
import kelasRoutes from './routes/kelas'
import kompetisiRoutes from './routes/kompetisi'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { validateGoogleDriveSetup } from './scripts/validateGoogleDriveSetup'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Startup function with Google Drive validation
async function startServer() {
  try {
    console.log('🚀 Starting Pemuda Berprestasi MVP Server...\n')

    // Validate Google Drive setup during startup
    console.log('📋 Validating Google Drive integration...')
    
    try {
      const validationResult = await validateGoogleDriveSetup()
      
      const isFullyValid = validationResult.environment && 
                          validationResult.connection && 
                          validationResult.summary.inaccessibleFolders === 0

      if (!isFullyValid) {
        console.warn('\n⚠️ Google Drive setup has issues but server will continue starting')
        console.warn('💡 Run "npm run gdrive:validate" for detailed diagnostics')
        
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Cannot start in production with invalid Google Drive setup')
          process.exit(1)
        }
      } else {
        console.log('\n✅ Google Drive integration validated successfully')
      }
    } catch (error: any) {
      console.error('\n❌ Google Drive validation failed:', error.message)
      
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Cannot start in production without Google Drive')
        process.exit(1)
      } else {
        console.warn('⚠️ Continuing in development mode without Google Drive')
      }
    }

    // Start server
    app.listen(PORT, () => {
      console.log('\n🎉 Server started successfully!')
      console.log(`📍 Server running on: http://localhost:${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`)
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`)
      console.log(`☁️ Upload Health: http://localhost:${PORT}/api/upload/health`)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📝 Available Google Drive commands:')
        console.log('   npm run gdrive:validate - Validate setup')
        console.log('   npm run gdrive:test     - Test connection')
        console.log('   npm run gdrive:setup    - Complete setup check')
      }
      
      console.log('\n' + '='.repeat(60))
    })

  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

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

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Pemuda Berprestasi API is running',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/pelatih',
      'GET /api/dojang',
      'GET /api/atlet',
      'GET /api/kompetisi',
      'GET /api/kelas'
    ]
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/pelatih', pelatihRoutes)

// Routes untuk Developer B nanti:
app.use('/api/dojang', dojangRoutes)
app.use('/api/atlet', atletRoutes)
app.use('/api/kompetisi', kompetisiRoutes)
// app.use('/api/admin', adminRoutes)
app.use('/api/kelas', kelasRoutes) 
// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API Base: http://localhost:${PORT}/api`)
})

export default app