import { config } from 'dotenv';
import { join } from 'path';
import { Pool } from 'pg';

config({ path: join(process.cwd(), '../../.env') });

export const db = new Pool({
  host: process.env.SUBSCRIPTION_DB_HOST || 'localhost',
  port: Number(process.env.SUBSCRIPTION_DB_PORT || 5434),
  user: process.env.SUBSCRIPTION_DB_USER || 'subscription',
  password: process.env.SUBSCRIPTION_DB_PASSWORD || 'admin',
  database: process.env.SUBSCRIPTION_DB_NAME || 'subscription',
});