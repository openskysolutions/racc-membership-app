'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const raw = fs.readFileSync('/Users/schott/Downloads/BusinessProfiles.csv', 'utf8');

// Parse CSV properly — handles quoted fields with embedded newlines/commas
function parseCSV(text) {
  const records = [];
  let fields = [], cur = '', inQ = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i += 2; }  // escaped quote
      else if (c === '"') { inQ = false; i++; }
      else { cur += c; i++; }
    } else {
      if (c === '"') { inQ = true; i++; }
      else if (c === ',') { fields.push(cur); cur = ''; i++; }
      else if (c === '\r' && text[i + 1] === '\n') { fields.push(cur); records.push(fields); fields = []; cur = ''; i += 2; }
      else if (c === '\n') { fields.push(cur); records.push(fields); fields = []; cur = ''; i++; }
      else { cur += c; i++; }
    }
  }
  if (cur || fields.length) { fields.push(cur); records.push(fields); }
  return records;
}

const records = parseCSV(raw);
const header = records[0];
console.log(`Parsed ${records.length - 1} rows (expected 132)`);

function n(v) { return (!v || v === 'NULL') ? null : v; }

function arr(v) {
  if (!v || v === '{}') return [];
  const m = v.match(/^\{(.*)\}$/s);
  if (!m || !m[1]) return [];
  return m[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
}

function safeDate(v) {
  if (!v || v === 'NULL') return new Date();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

const rows = records.slice(1).map(f => ({
  ghlBusinessId:     f[1],
  avatar:            n(f[2]),
  coverImage:        n(f[3]),
  tagline:           n(f[4]),
  bio:               n(f[5]),
  membershipTier:    n(f[6]),
  memberSince:       n(f[7]),
  couponCodes:       arr(f[8]),
  specialties:       arr(f[9]),
  organizationType:  n(f[10]),
  facebookUrl:       n(f[11]),
  instagramUrl:      n(f[12]),
  twitterUrl:        n(f[13]),
  linkedinUrl:       n(f[14]),
  hideMembershipTier: f[15] === 'True',
  createdAt:         safeDate(f[16]),
  updatedAt:         safeDate(f[17]),
})).filter(r => r.ghlBusinessId);

async function main() {
  let ok = 0, skip = 0;
  for (const r of rows) {
    try {
      await prisma.businessProfile.upsert({
        where:  { ghlBusinessId: r.ghlBusinessId },
        create: r,
        update: r,
      });
      ok++;
    } catch (e) {
      console.error('Skip', r.ghlBusinessId, e.message);
      skip++;
    }
  }
  console.log(`Done. Inserted/updated: ${ok}, Skipped: ${skip}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

