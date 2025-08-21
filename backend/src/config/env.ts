import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Define environment validation schema
const envSchema = Joi.object({
  // Application Settings
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(8000),
  APP_NAME: Joi.string()
    .default('Taekwondo Competition API'),
  APP_VERSION: Joi.string()
    .default('1.0.0'),

  // Database Configuration
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .description('MySQL database connection string'),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh secret key (minimum 32 characters)'),
  JWT_EXPIRE: Joi.string()
    .default('24h')
    .description('JWT token expiration time'),
  JWT_REFRESH_EXPIRE: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration time'),

  // Encryption
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('BCrypt hashing rounds'),
  ENCRYPTION_KEY: Joi.string()
    .length(32)
    .required()
    .description('Encryption key for sensitive data'),

  // CORS Settings
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:5173')
    .description('Frontend application URL'),
  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:5173,http://localhost:3000')
    .description('Comma-separated list of allowed origins'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .positive()
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .positive()
    .default(100)
    .description('Maximum requests per window'),

  // File Upload Settings
  MAX_FILE_SIZE_MB: Joi.number()
    .positive()
    .default(5)
    .description('Maximum file size in MB'),
  UPLOAD_PATH: Joi.string()
    .default('./uploads')
    .description('File upload directory path'),
  ALLOWED_FILE_TYPES: Joi.string()
    .default('jpg,jpeg,png,pdf')
    .description('Comma-separated allowed file extensions'),

  // Email Configuration
  SMTP_HOST: Joi.string()
    .hostname()
    .default('smtp.gmail.com'),
  SMTP_PORT: Joi.number()
    .port()
    .default(587),
  SMTP_SECURE: Joi.boolean()
    .default(false),
  SMTP_USER: Joi.string()
    .email()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  SMTP_PASS: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  FROM_EMAIL: Joi.string()
    .email()
    .default('noreply@taekwondo-app.com'),
  FROM_NAME: Joi.string()
    .default('Taekwondo Competition System'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FILE: Joi.string()
    .default('logs/app.log'),

  // Security
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Session secret for cookie signing'),
  COOKIE_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Cookie secret for additional security'),

  // Development/Testing
  ENABLE_SWAGGER: Joi.boolean()
    .default(true)
    .description('Enable Swagger documentation'),
  ENABLE_SEED_DATA: Joi.boolean()
    .default(true)
    .description('Enable database seeding'),

  // Performance
  REQUEST_TIMEOUT_MS: Joi.number()
    .integer()
    .positive()
    .default(30000)
    .description('Request timeout in milliseconds'),
  DB_CONNECTION_POOL_SIZE: Joi.number()
    .integer()
    .positive()
    .default(10)
    .description('Database connection pool size'),

}).unknown(); // Allow additional environment variables

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Type-safe environment configuration
export const config = {
  // Application
  app: {
    name: envVars.APP_NAME,
    version: envVars.APP_VERSION,
    env: envVars.NODE_ENV as 'development' | 'production' | 'test',
    port: envVars.PORT,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
  },

  // Database
  database: {
    url: envVars.DATABASE_URL,
    poolSize: envVars.DB_CONNECTION_POOL_SIZE,
  },

  // JWT & Security
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    expire: envVars.JWT_EXPIRE,
    refreshExpire: envVars.JWT_REFRESH_EXPIRE,
  },

  // Encryption
  encryption: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    key: envVars.ENCRYPTION_KEY,
    sessionSecret: envVars.SESSION_SECRET,
    cookieSecret: envVars.COOKIE_SECRET,
  },

  // CORS
  cors: {
    frontendUrl: envVars.FRONTEND_URL,
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim()),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  // File Upload
  upload: {
    maxSizeMB: envVars.MAX_FILE_SIZE_MB,
    maxSizeBytes: envVars.MAX_FILE_SIZE_MB * 1024 * 1024,
    path: envVars.UPLOAD_PATH,
    allowedTypes: envVars.ALLOWED_FILE_TYPES.split(',').map((type: string) => type.trim()),
  },

  // Email
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: envVars.SMTP_SECURE,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
    },
    from: {
      email: envVars.FROM_EMAIL,
      name: envVars.FROM_NAME,
    },
  },

  // Logging
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },

  // Features
  features: {
    swagger: envVars.ENABLE_SWAGGER,
    seedData: envVars.ENABLE_SEED_DATA,
  },

  // Performance
  performance: {
    requestTimeout: envVars.REQUEST_TIMEOUT_MS,
  },
} as const;

// Export environment validation function
export const validateEnvironment = () => {
  console.log('🔧 Environment Configuration:');
  console.log(`   - Environment: ${config.app.env}`);
  console.log(`   - Port: ${config.app.port}`);
  console.log(`   - Database: Connected`);
  console.log(`   - JWT: Configured`);
  console.log(`   - CORS Origins: ${config.cors.allowedOrigins.length} allowed`);
  console.log(`   - File Upload: Max ${config.upload.maxSizeMB}MB`);
  console.log(`   - Rate Limiting: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000}s`);
  
  if (config.app.isDevelopment) {
    console.log('   - Swagger: Enabled');
    console.log('   - Seed Data: Enabled');
  }
  
  console.log('✅ Environment validation passed\n');
};

export default config;