import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { startCampaignWorker } from './services/queue/campaign.queue';
import { prisma } from './database/client';
import { whatsappService } from './services/whatsapp/whatsapp.service';

// ─── Routers ──────────────────────────────────────────────────────────────────
import authRouter from './modules/auth/auth.router';
import contactsRouter from './modules/contacts/contacts.router';
import campaignsRouter from './modules/campaigns/campaigns.router';
import templatesRouter from './modules/templates/templates.router';
import webhooksRouter from './modules/webhooks/webhooks.router';
import reportsRouter from './modules/reports/reports.router';

const app = express();

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// Rate limit global (API)
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Muitas requisições, tente novamente em alguns minutos' },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/templates', templatesRouter);
app.use('/webhooks', webhooksRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/health', async (_req, res) => {
  const wa = await whatsappService.getAccountHealth();
  res.json({ status: 'ok', whatsapp: wa, timestamp: new Date().toISOString() });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Conectado ao PostgreSQL');

    startCampaignWorker();
    logger.info(`Worker BullMQ iniciado (${config.rateLimit.messagesPerSecond} msg/s)`);

    app.listen(config.port, () => {
      logger.info(`Servidor rodando em http://localhost:${config.port}`);
      logger.info(`Ambiente: ${config.nodeEnv}`);
    });
  } catch (err) {
    logger.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();

export default app;
