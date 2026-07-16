import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: number;
  parameters: Array<{
    type: 'text' | 'image' | 'video' | 'document' | 'currency' | 'date_time';
    text?: string;
    image?: { link: string };
    video?: { link: string };
    document?: { link: string; filename?: string };
  }>;
}

export interface SendTemplateOptions {
  to: string;               // E.164 format: +5511999999999
  templateName: string;
  language?: string;        // default: pt_BR
  components?: TemplateComponent[];
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export class WhatsAppService {
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;

  constructor() {
    this.phoneNumberId = config.whatsapp.phoneNumberId;

    this.client = axios.create({
      baseURL: config.whatsapp.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  // ─── Enviar mensagem usando template aprovado ────────────────────────────────
  async sendTemplate(opts: SendTemplateOptions): Promise<SendMessageResult> {
    const { to, templateName, language = 'pt_BR', components = [] } = opts;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),  // apenas dígitos
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        ...(components.length > 0 && { components }),
      },
    };

    try {
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        payload,
      );

      const messageId = response.data?.messages?.[0]?.id;
      logger.info(`Mensagem enviada para ${to} - ID: ${messageId}`);

      return { success: true, messageId };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string; code?: string | number } } }; message?: string };
      const metaError = error.response?.data?.error;
      const errorMsg = metaError?.message || error.message || 'Erro desconhecido';
      const errorCode = String(metaError?.code || 'UNKNOWN');

      logger.error(`Falha ao enviar para ${to}: [${errorCode}] ${errorMsg}`);
      return { success: false, error: errorMsg, errorCode };
    }
  }

  // ─── Criar template na plataforma Meta ───────────────────────────────────────
  async createTemplate(params: {
    name: string;
    category: string;
    language: string;
    components: object[];
  }): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const response = await this.client.post(
        `/${config.whatsapp.businessAccountId}/message_templates`,
        {
          name: params.name,
          category: params.category,
          language: params.language,
          components: params.components,
        },
      );

      return { success: true, templateId: response.data?.id };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const errorMsg = error.response?.data?.error?.message || error.message;
      logger.error(`Falha ao criar template: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  // ─── Listar templates aprovados ───────────────────────────────────────────────
  async listTemplates(): Promise<object[]> {
    try {
      const response = await this.client.get(
        `/${config.whatsapp.businessAccountId}/message_templates`,
        { params: { fields: 'id,name,category,language,status,components', limit: 100 } },
      );
      return response.data?.data || [];
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error(`Falha ao listar templates: ${error.message}`);
      return [];
    }
  }

  // ─── Verificar saúde da conta ─────────────────────────────────────────────────
  async getAccountHealth(): Promise<{
    status: string;
    qualityRating?: string;
    messagingLimit?: string;
  }> {
    try {
      const response = await this.client.get(
        `/${this.phoneNumberId}`,
        { params: { fields: 'display_phone_number,verified_name,quality_rating,messaging_limit_tier' } },
      );
      return {
        status: 'connected',
        qualityRating: response.data?.quality_rating,
        messagingLimit: response.data?.messaging_limit_tier,
      };
    } catch {
      return { status: 'error' };
    }
  }
}

export const whatsappService = new WhatsAppService();
