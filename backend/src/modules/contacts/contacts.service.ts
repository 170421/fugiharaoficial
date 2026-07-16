import { prisma } from '../../database/client';
import { parseContactsCSV } from '../../utils/csv.parser';

export class ContactsService {
  // ─── Contatos ───────────────────────────────────────────────────────────────
  async list(params: { page: number; limit: number; search?: string; tag?: string }) {
    const { page, limit, search, tag } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(tag && { tags: { has: tag } }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);

    return { contacts, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw Object.assign(new Error('Contato não encontrado'), { statusCode: 404 });
    return contact;
  }

  async create(data: {
    phone: string;
    name?: string;
    email?: string;
    tags?: string[];
    metadata?: object;
  }) {
    const existing = await prisma.contact.findUnique({ where: { phone: data.phone } });
    if (existing) throw Object.assign(new Error('Telefone já cadastrado'), { statusCode: 409 });
    return prisma.contact.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    tags: string[];
    metadata: object;
    optedOut: boolean;
  }>) {
    return prisma.contact.update({
      where: { id },
      data: {
        ...data,
        ...(data.optedOut && { optedOutAt: new Date() }),
      },
    });
  }

  async delete(id: string) {
    await prisma.contact.delete({ where: { id } });
  }

  async optOut(phone: string) {
    return prisma.contact.updateMany({
      where: { phone },
      data: { optedOut: true, optedOutAt: new Date() },
    });
  }

  // ─── Import via CSV ──────────────────────────────────────────────────────────
  async importCSV(buffer: Buffer, listId?: string) {
    const rows = await parseContactsCSV(buffer);
    const results = { created: 0, skipped: 0, errors: 0 };

    for (const row of rows) {
      try {
        const contact = await prisma.contact.upsert({
          where: { phone: row.phone },
          update: { name: row.name, email: row.email },
          create: {
            phone: row.phone,
            name: row.name,
            email: row.email,
          },
        });

        if (listId) {
          await prisma.contactListMember.upsert({
            where: { contactId_listId: { contactId: contact.id, listId } },
            update: {},
            create: { contactId: contact.id, listId },
          });
        }

        if (!row._wasUpdated) results.created++;
      } catch {
        results.errors++;
      }
    }

    return { ...results, total: rows.length };
  }

  // ─── Listas ──────────────────────────────────────────────────────────────────
  async getLists() {
    return prisma.contactList.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createList(data: { name: string; description?: string }) {
    return prisma.contactList.create({ data });
  }

  async addToList(listId: string, contactIds: string[]) {
    const ops = contactIds.map((contactId) =>
      prisma.contactListMember.upsert({
        where: { contactId_listId: { contactId, listId } },
        update: {},
        create: { contactId, listId },
      }),
    );
    await Promise.all(ops);
    return { added: contactIds.length };
  }

  async removeFromList(listId: string, contactId: string) {
    await prisma.contactListMember.delete({
      where: { contactId_listId: { contactId, listId } },
    });
  }
}

export const contactsService = new ContactsService();
