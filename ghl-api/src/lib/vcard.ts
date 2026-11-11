/**
 * Builds a vCard 3.0 string for a member's digital business card.
 * Pure function — no I/O — so it can be unit tested.
 */

export interface VCardInput {
  firstName?: string;
  lastName?: string;
  organization?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// RFC 6350 §3.4: escape backslash, comma, semicolon and newlines in text values.
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\;');
}

export function buildVCard(card: VCardInput): string {
  const first = (card.firstName || '').trim();
  const last = (card.lastName || '').trim();
  const fullName = `${first} ${last}`.trim();

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${escapeValue(last)};${escapeValue(first)};;;`);
  lines.push(`FN:${escapeValue(fullName || card.organization || 'Chamber Member')}`);
  if (card.organization) lines.push(`ORG:${escapeValue(card.organization.trim())}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeValue(card.phone.trim())}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeValue(card.email.trim())}`);
  if (card.website) lines.push(`URL:${card.website.trim()}`);
  lines.push('END:VCARD');

  return lines.join('\r\n') + '\r\n';
}

/** Safe filename for the Content-Disposition header (ASCII letters, digits, dashes). */
export function vCardFilename(card: VCardInput): string {
  const base = `${card.firstName || ''} ${card.lastName || ''}`.trim() || card.organization || 'contact';
  const safe = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe || 'contact'}.vcf`;
}
