import { parse } from 'csv-parse';
import { Readable } from 'stream';

export interface ContactRow {
  phone: string;
  name?: string;
  email?: string;
  [key: string]: string | undefined;
}

export async function parseContactsCSV(buffer: Buffer): Promise<ContactRow[]> {
  return new Promise((resolve, reject) => {
    const records: ContactRow[] = [];

    const parser = parse({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      bom: true,
    });

    parser.on('readable', () => {
      let record: ContactRow;
      while ((record = parser.read()) !== null) {
        const phone = sanitizePhone(record.phone || record.telefone || record.celular || '');
        if (phone) {
          records.push({
            ...record,
            phone,
            name: record.name || record.nome || undefined,
            email: record.email || undefined,
          });
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(records));

    Readable.from(buffer).pipe(parser);
  });
}

function sanitizePhone(raw: string): string {
  // Remove tudo exceto números e +
  const digits = raw.replace(/[^\d+]/g, '');
  // Normaliza para E.164 brasileiro
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 11) return `+55${digits}`;  // DDD + 9 dígitos
  if (digits.length === 10) return `+55${digits}`;  // DDD + 8 dígitos
  return '';
}
