import { prisma } from '../../database/client';

export class ReportsService {
  async getDashboardStats() {
    const [
      totalContacts,
      totalCampaigns,
      activeCampaigns,
      totalMessages,
      deliveredMessages,
      readMessages,
      failedMessages,
      recentCampaigns,
    ] = await Promise.all([
      prisma.contact.count({ where: { optedOut: false } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
      prisma.messageLog.count(),
      prisma.messageLog.count({ where: { status: 'DELIVERED' } }),
      prisma.messageLog.count({ where: { status: 'READ' } }),
      prisma.messageLog.count({ where: { status: 'FAILED' } }),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { template: { select: { name: true } } },
      }),
    ]);

    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;

    return {
      totals: {
        contacts: totalContacts,
        campaigns: totalCampaigns,
        activeCampaigns,
        messages: totalMessages,
        delivered: deliveredMessages,
        read: readMessages,
        failed: failedMessages,
      },
      rates: {
        delivery: Math.round(deliveryRate * 100) / 100,
        read: Math.round(readRate * 100) / 100,
      },
      recentCampaigns,
    };
  }

  async getCampaignReport(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true, contactList: { select: { name: true } } },
    });

    if (!campaign) throw Object.assign(new Error('Campanha não encontrada'), { statusCode: 404 });

    // Distribuição de status
    const statusCounts = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });

    // Linha do tempo (msgs entregues por hora)
    const timeline = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
      SELECT date_trunc('hour', "deliveredAt") as hour, COUNT(*) as count
      FROM message_logs
      WHERE "campaignId" = ${campaignId}
        AND "deliveredAt" IS NOT NULL
      GROUP BY hour
      ORDER BY hour ASC
    `;

    return {
      campaign,
      statusDistribution: statusCounts.reduce<Record<string, number>>((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {}),
      timeline: timeline.map((t) => ({
        hour: t.hour,
        count: Number(t.count),
      })),
    };
  }

  async getOptOutReport() {
    const [total, optedOut, recentOptOuts] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { optedOut: true } }),
      prisma.contact.findMany({
        where: { optedOut: true },
        orderBy: { optedOutAt: 'desc' },
        take: 20,
        select: { id: true, name: true, phone: true, optedOutAt: true },
      }),
    ]);

    return {
      total,
      optedOut,
      rate: total > 0 ? Math.round((optedOut / total) * 10000) / 100 : 0,
      recentOptOuts,
    };
  }
}

export const reportsService = new ReportsService();
