import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../../config';
import { prisma } from '../../database/client';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { logger } from '../../utils/logger';

// ─── Tipagem do job ───────────────────────────────────────────────────────────
export interface CampaignJobData {
  campaignId: string;
  messageLogId: string;
  phone: string;
  templateName: string;
  language: string;
  components: object[];
}

// ─── Conexão Redis compartilhada ──────────────────────────────────────────────
export const redisConnection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null, // necessário para BullMQ
  enableReadyCheck: false,
});

// ─── Queue de campanhas ───────────────────────────────────────────────────────
export const campaignQueue = new Queue<CampaignJobData>('campaign-messages', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
    removeOnComplete: { age: 60 * 60 * 24 },   // mantém por 24h
    removeOnFail: { age: 60 * 60 * 24 * 7 },   // mantém por 7 dias
  },
});

// ─── Worker (processa os jobs) ────────────────────────────────────────────────
export function startCampaignWorker() {
  const worker = new Worker<CampaignJobData>(
    'campaign-messages',
    async (job: Job<CampaignJobData>) => {
      const { campaignId, messageLogId, phone, templateName, language, components } = job.data;

      // Marcar como "enviando"
      await prisma.messageLog.update({
        where: { id: messageLogId },
        data: { status: 'SENDING' },
      });

      // Verificar opt-out
      const contact = await prisma.contact.findFirst({ where: { phone } });
      if (contact?.optedOut) {
        await prisma.messageLog.update({
          where: { id: messageLogId },
          data: { status: 'OPTED_OUT', failedAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });
        return;
      }

      // Enviar via Meta Cloud API
      const result = await whatsappService.sendTemplate({
        to: phone,
        templateName,
        language,
        components: components as Parameters<typeof whatsappService.sendTemplate>[0]['components'],
      });

      if (result.success) {
        await prisma.messageLog.update({
          where: { id: messageLogId },
          data: {
            status: 'SENT',
            metaMessageId: result.messageId,
            sentAt: new Date(),
          },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });
      } else {
        await prisma.messageLog.update({
          where: { id: messageLogId },
          data: {
            status: 'FAILED',
            errorCode: result.errorCode,
            errorMessage: result.error,
            failedAt: new Date(),
          },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });
        // Propagar erro para ativar retry do BullMQ
        if (result.errorCode !== '131026' && result.errorCode !== '131047') {
          throw new Error(`[${result.errorCode}] ${result.error}`);
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: config.rateLimit.messagesPerSecond,
      limiter: {
        max: config.rateLimit.messagesPerSecond,
        duration: 1_000, // por segundo
      },
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed for campaign ${job.data.campaignId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

// ─── Enfileirar todos os contatos de uma campanha ────────────────────────────
export async function enqueueCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
      contactList: {
        include: {
          members: {
            include: { contact: true },
          },
        },
      },
    },
  });

  if (!campaign) throw new Error('Campanha não encontrada');

  const contacts = campaign.contactList.members.map((m) => m.contact);
  const jobs = contacts.map((contact) => {
    const logId = `log_${campaignId}_${contact.id}_${Date.now()}`;
    return {
      name: 'send-message',
      data: {
        campaignId,
        messageLogId: logId,
        phone: contact.phone,
        templateName: campaign.template.name,
        language: campaign.template.language,
        components: [],
      } as CampaignJobData,
      opts: {
        jobId: logId,
        // Delay entre mensagens para respeitar rate limit
        delay: 0,
      },
    };
  });

  await campaignQueue.addBulk(jobs);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
      totalContacts: contacts.length,
    },
  });

  logger.info(`Campanha ${campaignId}: ${contacts.length} mensagens enfileiradas`);
  return { enqueued: contacts.length };
}
