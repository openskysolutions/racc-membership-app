import { describe, it, expect } from 'vitest';
import { buildVCard, vCardFilename } from '@/lib/vcard';

describe('buildVCard', () => {
  it('includes only the fields provided', () => {
    const vcf = buildVCard({ firstName: 'Ada', lastName: 'Lovelace', organization: 'Analytical Engines' });
    expect(vcf).toContain('BEGIN:VCARD');
    expect(vcf).toContain('FN:Ada Lovelace');
    expect(vcf).toContain('N:Lovelace;Ada;;;');
    expect(vcf).toContain('ORG:Analytical Engines');
    expect(vcf).not.toContain('TEL');
    expect(vcf).not.toContain('EMAIL');
    expect(vcf).not.toContain('URL');
    expect(vcf.trimEnd().endsWith('END:VCARD')).toBe(true);
  });

  it('escapes commas, semicolons and newlines and uses CRLF line endings', () => {
    const vcf = buildVCard({ firstName: 'A', lastName: 'B', organization: 'Smith, Jones; & Co\nLLC' });
    expect(vcf).toContain('ORG:Smith\\, Jones\; & Co\\nLLC');
    expect(vcf.split('\r\n').length).toBeGreaterThan(4);
  });

  it('falls back to the organization when there is no name', () => {
    expect(buildVCard({ organization: 'Acme' })).toContain('FN:Acme');
  });
});

describe('vCardFilename', () => {
  it('produces a safe ASCII filename', () => {
    expect(vCardFilename({ firstName: 'Zoë', lastName: "O'Neil" })).toBe('zo-o-neil.vcf');
    expect(vCardFilename({})).toBe('contact.vcf');
  });
});
