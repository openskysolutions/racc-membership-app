/**
 * One-time migration: copy all BusinessProfile rows from Postgres into
 * GHL Business custom properties via the Objects API.
 *
 * Run from ghl-api/:
 *   node scripts/migrate-business-profiles-to-ghl.js
 *
 * Reads .env automatically. No compilation needed.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const TOKEN       = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID = process.env.LOCATION_ID;
const BASE_URL    = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';

if (!TOKEN || !LOCATION_ID) {
  console.error('PRIVATE_INTEGRATION_TOKEN and LOCATION_ID must be set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function request(urlStr, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function updateBusinessProperties(businessId, props) {
  const clean = {};
  for (const [k, v] of Object.entries(props)) {
    if (v != null) clean[k] = v;
  }
  if (!Object.keys(clean).length) return Promise.resolve();
  return request(
    `${BASE_URL}/objects/business/records/${businessId}?locationId=${LOCATION_ID}`,
    'PUT',
    JSON.stringify({ properties: clean }),
  );
}

function updateBusinessDescription(businessId, description) {
  return request(
    `${BASE_URL}/businesses/${businessId}`,
    'PUT',
    JSON.stringify({ description }),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    let profiles;
    try {
      profiles = await prisma.businessProfile.findMany();
    } catch {
      // Model already removed from schema — query the table directly
      profiles = await prisma.$queryRaw`SELECT * FROM business_profiles`;
    }
    console.log(`Found ${profiles.length} BusinessProfile rows to migrate.\n`);

    let ok = 0;
    let failed = 0;

    for (const p of profiles) {
      const bizId = p.ghlBusinessId ?? p.ghl_business_id;
      if (!bizId) { console.warn(`Skipping row id=${p.id}: no ghlBusinessId`); continue; }

      const tier       = p.membershipTier ?? p.membership_tier ?? null;
      const memberSince = p.memberSince ?? p.member_since ?? null;
      const couponArr  = Array.isArray(p.couponCodes) ? p.couponCodes : [];
      const hideFlag   = !!(p.hideMembershipTier ?? p.hide_membership_tier);

      const orgTypeRaw = p.organizationType ?? p.organization_type ?? null;
      const ORG_TYPE_MAP = { 'Organization': 'Business' };
      const orgType = orgTypeRaw ? (ORG_TYPE_MAP[orgTypeRaw] ?? orgTypeRaw) : null;

      const props = {
        tagline:              p.tagline ?? null,
        logo_url:             p.avatar ?? null,
        cover_image_url:      p.coverImage ?? p.cover_image ?? null,
        organization_type:    orgType,
        facebook_url:         p.facebookUrl ?? p.facebook_url ?? null,
        instagram_url:        p.instagramUrl ?? p.instagram_url ?? null,
        twitter_url:          p.twitterUrl ?? p.twitter_url ?? null,
        linkedin_url:         p.linkedinUrl ?? p.linkedin_url ?? null,
        hide_membership_tier: hideFlag ? 'true' : 'false',
        coupon_codes:         couponArr.length ? JSON.stringify(couponArr) : null,
      };

      if (tier) {
        props.membership_tier   = `${tier}_membership_package`;
        props.membership_status = 'active';
      }
      if (memberSince) props.membership_start_date = memberSince;

      try {
        await updateBusinessProperties(bizId, props);
        if (p.bio) await updateBusinessDescription(bizId, p.bio);
        console.log(`✓ ${bizId}`);
        ok++;
      } catch (err) {
        console.error(`✗ ${bizId}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\nDone. Success: ${ok}, Failed: ${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
