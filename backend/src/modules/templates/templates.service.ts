import { prisma } from '../../database/client';
import { whatsappService } from '../../services/whatsapp/whatsapp.service';

export class TemplatesService {
  async list() {
    return prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async findById(id: string) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw Object.assign(new Error('Template não encontrado'), { statusCode: 404 });
    return template;
  }

  async create(data: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language?: string;
    headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    headerContent?: string;
    body: string;
    footer?: string;
    buttons?: object[];
  }, userId: string) {
    return prisma.template.create({
      data: {
        name: data.name,
        category: data.category,
        language: data.language || 'pt_BR',
        headerType: data.headerType,
        headerContent: data.headerContent,
        body: data.body,
        footer: data.footer,
        buttons: data.buttons as object,
        createdById: userId,
        status: 'PENDING',
      },
    });
  }

  // Envia o template para aprovação na Meta
  async submitToMeta(id: string) {
    const template = await this.findById(id);

    const components: object[] = [];

    if (template.headerType) {
      const headerComponent: { type: string; format: string; text?: string; example?: { header_handle: string[] } } = {
        type: 'HEADER',
        format: template.headerType,
      };
      if (template.headerType === 'TEXT' && template.headerContent) {
        headerComponent.text = template.headerContent;
      } else if (template.headerContent) {
        headerComponent.example = { header_handle: [template.headerContent] };
      }
      components.push(headerComponent);
    }

    components.push({ type: 'BODY', text: template.body });

    if (template.footer) {
      components.push({ type: 'FOOTER', text: template.footer });
    }

    if (template.buttons) {
      components.push({ type: 'BUTTONS', buttons: template.buttons });
    }

    const result = await whatsappService.createTemplate({
      name: template.name,
      category: template.category,
      language: template.language,
      components,
    });

    if (result.success) {
      return prisma.template.update({
        where: { id },
        data: { status: 'SUBMITTED', metaTemplateId: result.templateId },
      });
    } else {
      throw Object.assign(new Error(`Falha ao enviar para Meta: ${result.error}`), { statusCode: 502 });
    }
  }

  async syncFromMeta() {
    const metaTemplates = await whatsappService.listTemplates() as Array<{
      id: string;
      name: string;
      status: string;
    }>;

    const updates = metaTemplates.map(async (mt) => {
      if (mt.status === 'APPROVED') {
        await prisma.template.updateMany({
          where: { metaTemplateId: mt.id },
          data: { status: 'APPROVED' },
        });
      }
    });

    await Promise.all(updates);
    return { synced: metaTemplates.length };
  }

  async delete(id: string) {
    await prisma.template.delete({ where: { id } });
  }
}

export const templatesService = new TemplatesService();
