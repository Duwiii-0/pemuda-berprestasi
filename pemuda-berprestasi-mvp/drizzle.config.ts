// drizzle.config.ts (di root project) - FIXED VERSION
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables
config();

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;