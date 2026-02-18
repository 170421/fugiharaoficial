import { Request, Response } from 'express';
import { config } from '../../config';
import { prisma } from '../../database/client';
import { logger } from '../../utils/logger';

// Mapeamento de status da Meta para nosso enum
const META_STATUS_MAP: Record<string, string> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
};

export const webhooksController = {
  // GET /webhooks/whatsapp — verificação do webhook pela Meta
  verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
      logger.info('Webhook da Meta verificado com sucesso');
      return res.status(200).send(challenge);
    }

    logger.warn('Falha na verificação do webhook - token inválido');
    return res.status(403).send('Forbidden');
  },

  // POST /webhooks/whatsapp — recebe notificações de status
  async handle(req: Request, res: Response) {
    // Meta espera resposta 200 imediata
    res.status(200).send('EVENT_RECEIVED');

    try {
      const body = req.body;
      if (body.object !== 'whatsapp_business_account') return;

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // ─── Atualização de status de mensagem ───────────────────────────────
          for (const status of value.statuses || []) {
            const metaStatus = META_STATUS_MAP[status.status];
            if (!metaStatus) continue;

            const updateData: Record<string, unknown> = { status: metaStatus };
            if (metaStatus === 'DELIVERED') updateData.deliveredAt = new Date();
            if (metaStatus === 'READ') updateData.readAt = new Date();
            if (metaStatus === 'FAILED') {
              updateData.failedAt = new Date();
              updateData.errorCode = String(status.errors?.[0]?.code || '');
              updateData.errorMessage = status.errors?.[0]?.title || '';
            }

            await prisma.messageLog.updateMany({
              where: { metaMessageId: status.id },
              data: updateData,
            });

            // Atualizar contadores da campanha
            if (metaStatus === 'DELIVERED') {
              const log = await prisma.messageLog.findFirst({ where: { metaMessageId: status.id } });
              if (log) {
                await prisma.campaign.update({
                  where: { id: log.campaignId },
                  data: { deliveredCount: { increment: 1 } },
                });
              }
            }
            if (metaStatus === 'READ') {
              const log = await prisma.messageLog.findFirst({ where: { metaMessageId: status.id } });
              if (log) {
                await prisma.campaign.update({
                  where: { id: log.campaignId },
                  data: { readCount: { increment: 1 } },
                });
              }
            }
          }

          // ─── Mensagens recebidas (opt-out, respostas) ─────────────────────────
          for (const message of value.messages || []) {
            const text = message.text?.body?.toLowerCase() || '';

            // Palavras-chave para opt-out
            const optOutKeywords = ['sair', 'parar', 'cancelar', 'stop', 'remover', 'descadastrar'];
            if (optOutKeywords.some((kw) => text.includes(kw))) {
              const phone = `+${message.from}`;
              await prisma.contact.updateMany({
                where: { phone },
                data: { optedOut: true, optedOutAt: new Date() },
              });
              logger.info(`Opt-out registrado para: ${phone}`);
            }
          }
        }
      }
    } catch (err) {
      logger.error('Erro ao processar webhook:', err);
    }
  },
};
