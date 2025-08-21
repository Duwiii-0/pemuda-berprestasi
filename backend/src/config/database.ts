import { PrismaClient, Prisma } from '@prisma/client';
import { config } from './env';

// Prisma Client Options
const prismaOptions: Prisma.PrismaClientOptions = {
  // Datasources configuration will be handled by DATABASE_URL from .env
  datasources: {
    db: {
      url: config.database.url,
    },
  },

  // Logging configuration based on environment
  log: config.app.isDevelopment
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ]
    : [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],

  // Error formatting
  errorFormat: config.app.isDevelopment ? 'pretty' : 'minimal',
};

// Create Prisma Client instance
export const prisma = new PrismaClient(prismaOptions);

// Enhanced query logging for development
if (config.app.isDevelopment) {
  prisma.$on('query', (e: Prisma.QueryEvent) => {
    console.log('\n📊 Database Query:');
    console.log(`   Query: ${e.query}`);
    console.log(`   Params: ${e.params}`);
    console.log(`   Duration: ${e.duration}ms`);
    console.log('─'.repeat(50));
  });
}

// Database connection handler
export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test database connection
    await prisma.$connect();
    
    console.log('✅ Database connected successfully');
    console.log(`   - Database URL: ${config.database.url.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`   - Environment: ${config.app.env}`);
    
    // Run a simple query to verify connection
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('   - Connection test: Passed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('   Please check your DATABASE_URL configuration');
    
    if (error instanceof Error) {
      console.error(`   Error details: ${error.message}`);
    }
    
    // Exit process in production, throw in development for better debugging
    if (config.app.isProduction) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

// Graceful database disconnection
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('📤 Database disconnected gracefully');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Database transaction helper
export const withTransaction = async <T>(
  operation: (prisma: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    return await operation(tx);
  });
};

// Database utility functions
export const databaseUtils = {
  // Get database statistics
  getStats: async () => {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          table_name,
          table_rows,
          data_length,
          index_length,
          (data_length + index_length) as total_size
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY total_size DESC
      `;
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  },

  // Reset database (development only)
  reset: async () => {
    if (!config.app.isDevelopment) {
      throw new Error('Database reset is only allowed in development environment');
    }

    try {
      console.log('🔄 Resetting database...');
      
      // Get all table names
      const tables = await prisma.$queryRaw<{table_name: string}[]>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_name != '_prisma_migrations'
      `;

      // Disable foreign key checks
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

      // Drop all tables except migrations
      for (const table of tables) {
        await prisma.$executeRaw`DROP TABLE IF EXISTS ${Prisma.raw(table.table_name)}`;
      }

      // Re-enable foreign key checks
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  },

  // Seed database
  seed: async () => {
    if (!config.features.seedData) {
      console.log('📋 Database seeding is disabled');
      return;
    }

    try {
      console.log('🌱 Seeding database...');
      
      // Import and run seed file
      const { runSeed } = await import('../../prisma/seed');
      await runSeed();
      
      console.log('✅ Database seeding completed');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  },
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT signal, closing database connections...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM signal, closing database connections...');
  await disconnectDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await disconnectDatabase();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await disconnectDatabase();
  process.exit(1);
});

export default prisma;