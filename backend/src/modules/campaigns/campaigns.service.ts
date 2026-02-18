import { prisma } from '../../database/client';
import { enqueueCampaign } from '../../services/queue/campaign.queue';

export class CampaignsService {
  async list(params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as Parameters<typeof prisma.campaign.findMany>[0]['where'] } : {};

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: { select: { id: true, name: true, category: true } },
          contactList: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return { campaigns, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        contactList: { include: { _count: { select: { members: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!campaign) throw Object.assign(new Error('Campanha não encontrada'), { statusCode: 404 });
    return campaign;
  }

  async create(data: {
    name: string;
    description?: string;
    templateId: string;
    contactListId: string;
    scheduledAt?: string;
    templateVars?: object;
  }, userId: string) {
    return prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        templateId: data.templateId,
        contactListId: data.contactListId,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        templateVars: data.templateVars as object,
        createdById: userId,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });
  }

  async launch(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw Object.assign(new Error('Campanha não encontrada'), { statusCode: 404 });
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      throw Object.assign(new Error(`Campanha em status "${campaign.status}" não pode ser iniciada`), { statusCode: 409 });
    }

    return enqueueCampaign(id);
  }

  async pause(id: string) {
    return prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async cancel(id: string) {
    return prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getMessages(campaignId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where = {
      campaignId,
      ...(status && { status }),
    };

    const [messages, total] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.messageLog.count({ where }),
    ]);

    return { messages, total, page, limit };
  }
}

export const campaignsService = new CampaignsService();
