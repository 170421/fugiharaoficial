import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable ${key} is required`);
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
    expiresIn: '7d',
  },

  database: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  whatsapp: {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    apiVersion: process.env.META_API_VERSION || 'v19.0',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'verify_token',
    get apiBaseUrl() {
      return `https://graph.facebook.com/${this.apiVersion}`;
    },
  },

  rateLimit: {
    messagesPerSecond: Number(process.env.MESSAGES_PER_SECOND) || 10,
    messagesPerMinute: Number(process.env.MESSAGES_PER_MINUTE) || 250,
  },
} as const;
