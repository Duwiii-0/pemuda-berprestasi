import { PrismaClient } from '@prisma/client'

// Global variable untuk development (prevent multiple instances)
declare global {
  var __prisma: PrismaClient | undefined
}

// Create single Prisma instance
 const prisma = 
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    errorFormat: 'pretty'
  })

// In development, save to global to prevent re-instantiation during hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

// src/config/database.ts (additional functions)

export async function connectToDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date() }
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() }
  }
}

// Usage in app startup
export async function initializeDatabase() {
  const isConnected = await connectToDatabase()
  
  if (!isConnected) {
    console.error('Failed to connect to database. Exiting...')
    process.exit(1)
  }
  
  // Check if tables exist
  try {
    await prisma.tb_akun.findFirst()
    console.log('✅ Database tables are accessible')
  } catch (error) {
    console.error('❌ Database tables not found. Please run migrations:', error)
    process.exit(1)
  }
}

export default prisma;