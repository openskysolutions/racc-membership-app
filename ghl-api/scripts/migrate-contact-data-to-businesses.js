/**
 * migrate-contact-data-to-businesses.js
 *
 * Phase 9 — One-time data migration script.
 *
 * What it does:
 *   1. Fetches all active GHL Contacts (paginated).
 *   2. Groups contacts by their GHL businessId.
 *   3. For each business group, picks the "best" contact (main-contact tag first,
 *      then most complete) and extracts custom-field data to seed BusinessProfile.
 *   4. Upserts one BusinessProfile row per GHL Business.
 *   5. Updates every User row whose ghlBusinessId is null (or mismatched) with
 *      the businessId from their GHL Contact.
 *   6. Backfills MemberCategory.ghlBusinessId from the linked user's ghlBusinessId.
 *
 * Usage:
 *   node scripts/migrate-contact-data-to-businesses.js             # dry-run
 *   node scripts/migrate-contact-data-to-businesses.js --execute   # apply changes
 *   node scripts/migrate-contact-data-to-businesses.js --stats     # report only
 *
 * Required env vars (loaded from ../.env automatically):
 *   PRIVATE_INTEGRATION_TOKEN
 *   LOCATION_ID
 *   DATABASE_URL
 */

'use strict';

const axios  = require('axios');
const path   = require('path');
const fs     = require('fs');
const { PrismaClient } = require('@prisma/client');

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
  console.log(`✅ Loaded env from ${envPath}`);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TOKEN       = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID = process.env.LOCATION_ID;
const DRY_RUN     = !process.argv.includes('--execute');
const STATS_ONLY  = process.argv.includes('--stats');

if (!TOKEN || !LOCATION_ID) {
  console.error('❌ PRIVATE_INTEGRATION_TOKEN and LOCATION_ID must be set');
  process.exit(1);
}

if (STATS_ONLY) {
  console.log('\n📊 STATS MODE — reporting only. No changes will be made.\n');
} else if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN — no DB or GHL changes will be made.');
  console.log('   Run with --execute to apply.\n');
} else {
  console.log('\n🚀 EXECUTE MODE — changes will be written to the database.\n');
}

const RATE_LIMIT_DELAY_MS = 300;
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// GHL custom field IDs (from membersController.ts)
// ---------------------------------------------------------------------------
const CF = {
  avatar:          '331dKIcjgTa8z8a6mu37',
  coverImage:      '3tSDY90RIMPP4W7uQxF9',
  tagline:         '3PZ7J4UcjLwnzWudAZHi',
  bio:             'b3Yfp0NjO23zFXzwjswu',
  memberSince:     'Dxt6gzc4osQhaCBPhslY',
  couponCodes:     '9rtkCBAUmFZdHs9ALwQl',
  organizationType:'kPoBTUVldHyg3WbywLJ9',
  facebookUrl:     '1Yv2752kZqX9YQD2YWQI',
  instagramUrl:    'VVMVScdl9xkx24OiBZeP',
  twitterUrl:      'acDP54JNNtqdxJh7Ee5h',
  linkedinUrl:     'b5LrmKi7eRpvD8r3FPmQ',
};

// ---------------------------------------------------------------------------
// Axios clients
// ---------------------------------------------------------------------------
const clientV2 = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status >= 500) && attempt < maxRetries) {
        console.warn(`   ⏳ HTTP ${status} — retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

/** Extract a GHL custom field value by its ID. */
function getCustomField(contact, fieldId) {
  const field = contact.customFields?.find(f => f.id === fieldId);
  return field?.value || field?.field_value || null;
}

/** Parse coupon codes — stored as JSON array or comma-separated string. */
function parseCouponCodes(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (_) { /* fall through */ }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/** Derive membership tier from contact tags. */
function getMembershipTier(tags) {
  if (tags.includes('elite membership package'))    return 'elite';
  if (tags.includes('enhanced membership package')) return 'enhanced';
  if (tags.includes('basic membership package'))    return 'basic';
  return null; // don't assume a tier if none is tagged
}

/** Score a contact for "best data source" — higher is better. */
function contactScore(contact) {
  const tags = contact.tags || [];
  const isMain = tags.includes('main-contact') ? 1000 : 0;
  const hasTier = getMembershipTier(tags) ? 100 : 0;
  let fields = 0;
  for (const id of Object.values(CF)) {
    if (getCustomField(contact, id)) fields++;
  }
  return isMain + hasTier + fields;
}

// ---------------------------------------------------------------------------
// GHL API
// ---------------------------------------------------------------------------
async function fetchAllActiveContacts() {
  const contacts = [];
  let page = 1;
  const pageLimit = 100;
  console.log('📥 Fetching active GHL contacts...');

  while (true) {
    await sleep(RATE_LIMIT_DELAY_MS);
    const body = {
      locationId: LOCATION_ID,
      pageLimit,
      page,
      filters: [{ field: 'tags', operator: 'contains', value: 'active' }],
    };
    const response = await withRetry(() => clientV2.post('/contacts/search', body));
    const batch = response.data?.contacts ?? [];
    contacts.push(...batch);
    console.log(`   Page ${page}: ${batch.length} contacts (total: ${contacts.length})`);
    if (batch.length < pageLimit) break;
    page++;
  }

  console.log(`✅ Fetched ${contacts.length} active contacts.\n`);
  return contacts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // ── 1. Fetch GHL contacts ──────────────────────────────────────────────
  const allContacts = await fetchAllActiveContacts();

  // Build a map: contactId → contact
  const contactById = new Map(allContacts.map(c => [c.id, c]));

  // ── 2. Group contacts by businessId ────────────────────────────────────
  const businessGroups = new Map(); // businessId → contact[]
  let noBusinessId = 0;

  for (const contact of allContacts) {
    const bid = contact.businessId;
    if (!bid) { noBusinessId++; continue; }
    if (!businessGroups.has(bid)) businessGroups.set(bid, []);
    businessGroups.get(bid).push(contact);
  }

  console.log(`📊 Contacts linked to a business:  ${allContacts.length - noBusinessId}`);
  console.log(`   Contacts with NO businessId:    ${noBusinessId}`);
  console.log(`   Unique GHL businesses:           ${businessGroups.size}\n`);

  if (STATS_ONLY) {
    // Extra stats: how many already have a BusinessProfile
    const existing = await prisma.businessProfile.count();
    console.log(`BusinessProfile rows in DB:        ${existing}`);
    const usersWithBiz = await prisma.user.count({ where: { ghlBusinessId: { not: null } } });
    const usersTotal   = await prisma.user.count({ where: { ghlContactId: { not: null } } });
    console.log(`Users with ghlBusinessId set:      ${usersWithBiz} / ${usersTotal}`);
    const catsMigrated = await prisma.memberCategory.count({ where: { ghlBusinessId: { not: null } } });
    const catsTotal    = await prisma.memberCategory.count();
    console.log(`MemberCategory rows migrated:      ${catsMigrated} / ${catsTotal}`);
    await prisma.$disconnect();
    return;
  }

  // ── 3. Upsert BusinessProfile for each business group ─────────────────
  console.log('── Step 3: Upsert BusinessProfile rows ──────────────────────────────\n');
  let profilesUpserted = 0;
  let profilesSkipped  = 0;

  for (const [businessId, contacts] of businessGroups) {
    // Pick the best contact as data source
    const best = contacts.slice().sort((a, b) => contactScore(b) - contactScore(a))[0];
    const tags = best.tags || [];

    const tier       = getMembershipTier(tags);
    const avatar     = getCustomField(best, CF.avatar);
    const coverImage = getCustomField(best, CF.coverImage);
    const tagline    = getCustomField(best, CF.tagline);
    const bio        = getCustomField(best, CF.bio);
    const memberSince= getCustomField(best, CF.memberSince);
    const rawCoupons = getCustomField(best, CF.couponCodes);
    const couponCodes= parseCouponCodes(rawCoupons);
    const orgType    = getCustomField(best, CF.organizationType);
    const fbUrl      = getCustomField(best, CF.facebookUrl);
    const igUrl      = getCustomField(best, CF.instagramUrl);
    const twUrl      = getCustomField(best, CF.twitterUrl);
    const liUrl      = getCustomField(best, CF.linkedinUrl);

    // Only upsert if there's meaningful data (at minimum a tier or bio)
    const hasMeaningfulData = !!(tier || bio || tagline || avatar);
    if (!hasMeaningfulData) {
      profilesSkipped++;
      continue;
    }

    const data = {
      ...(avatar     && { avatar }),
      ...(coverImage && { coverImage }),
      ...(tagline    && { tagline }),
      ...(bio        && { bio }),
      ...(memberSince&& { memberSince }),
      ...(couponCodes.length && { couponCodes }),
      ...(orgType    && { organizationType: orgType }),
      ...(fbUrl      && { facebookUrl: fbUrl }),
      ...(igUrl      && { instagramUrl: igUrl }),
      ...(twUrl      && { twitterUrl: twUrl }),
      ...(liUrl      && { linkedinUrl: liUrl }),
      ...(tier       && { membershipTier: tier }),
    };

    const bizName = best.businessName || best.companyName || businessId;

    if (DRY_RUN) {
      console.log(`  [DRY] Would upsert BusinessProfile for "${bizName}" (${businessId})`);
      console.log(`        tier=${tier}, bio=${bio ? bio.slice(0,40)+'…' : 'none'}, avatar=${!!avatar}`);
    } else {
      await prisma.businessProfile.upsert({
        where: { ghlBusinessId: businessId },
        create: { ghlBusinessId: businessId, ...data },
        // On update: only fill in fields that are currently null/empty (don't overwrite manual edits)
        update: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v])
        ),
      });
      console.log(`  ✅ Upserted BusinessProfile for "${bizName}" (${businessId}) tier=${tier}`);
    }
    profilesUpserted++;
  }

  console.log(`\n   Profiles upserted: ${profilesUpserted}, skipped (no data): ${profilesSkipped}\n`);

  // ── 4. Update User.ghlBusinessId ──────────────────────────────────────
  console.log('── Step 4: Update User.ghlBusinessId ────────────────────────────────\n');

  const dbUsers = await prisma.user.findMany({
    where: { ghlContactId: { not: null } },
    select: { id: true, email: true, ghlContactId: true, ghlBusinessId: true },
  });

  console.log(`   Found ${dbUsers.length} DB users with a ghlContactId.`);
  let userUpdated = 0;
  let userAlready = 0;
  let userNotFound = 0;

  for (const dbUser of dbUsers) {
    const contact = contactById.get(dbUser.ghlContactId);
    if (!contact) { userNotFound++; continue; }

    const contactBusinessId = contact.businessId ?? null;
    if (contactBusinessId === dbUser.ghlBusinessId) { userAlready++; continue; }

    if (DRY_RUN) {
      console.log(`  [DRY] Would set User(${dbUser.email}).ghlBusinessId = ${contactBusinessId}`);
    } else {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { ghlBusinessId: contactBusinessId },
      });
      console.log(`  ✅ Updated User(${dbUser.email}) → ghlBusinessId=${contactBusinessId}`);
    }
    userUpdated++;
  }

  console.log(`\n   Updated: ${userUpdated}, already correct: ${userAlready}, contact not in fetch: ${userNotFound}\n`);

  // ── 5. Migrate MemberCategory.ghlBusinessId ───────────────────────────
  console.log('── Step 5: Migrate MemberCategory.ghlBusinessId ─────────────────────\n');

  const unmigratedCats = await prisma.memberCategory.findMany({
    where: { ghlBusinessId: null, ghlContactId: { not: null } },
  });

  console.log(`   Found ${unmigratedCats.length} MemberCategory rows with no ghlBusinessId.`);

  // Build a contactId → businessId lookup from all DB users + GHL contacts
  const userBizMap = new Map(); // ghlContactId → ghlBusinessId
  for (const dbUser of dbUsers) {
    const contact = contactById.get(dbUser.ghlContactId);
    const biz = contact?.businessId ?? dbUser.ghlBusinessId;
    if (biz) userBizMap.set(dbUser.ghlContactId, biz);
  }

  let catsMigrated = 0;
  let catsNoMatch  = 0;

  // Group rows by (contactId, businessId) to detect duplicates we need to merge
  const catsByBizAndSub = new Map(); // `bizId:subcategory` → first row id

  for (const row of unmigratedCats) {
    const businessId = userBizMap.get(row.ghlContactId);
    if (!businessId) { catsNoMatch++; continue; }

    const dedupeKey = `${businessId}:${row.subcategory}`;
    if (catsByBizAndSub.has(dedupeKey)) {
      // Duplicate — delete this row (keep the first one that will be updated)
      if (!DRY_RUN) {
        await prisma.memberCategory.delete({ where: { id: row.id } });
        console.log(`  🗑  Deleted duplicate MemberCategory(${row.id}) ${dedupeKey}`);
      } else {
        console.log(`  [DRY] Would delete duplicate MemberCategory(${row.id}) ${dedupeKey}`);
      }
      continue;
    }

    catsByBizAndSub.set(dedupeKey, row.id);

    if (DRY_RUN) {
      console.log(`  [DRY] Would set MemberCategory(${row.id}).ghlBusinessId = ${businessId} (sub: ${row.subcategory})`);
    } else {
      await prisma.memberCategory.update({
        where: { id: row.id },
        data: { ghlBusinessId: businessId },
      });
      console.log(`  ✅ Migrated MemberCategory(${row.id}) ${row.subcategory} → ${businessId}`);
    }
    catsMigrated++;
  }

  console.log(`\n   Categories migrated: ${catsMigrated}, no match found: ${catsNoMatch}\n`);

  // ── Summary ─────────────────────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(DRY_RUN ? '✅ DRY RUN COMPLETE — re-run with --execute to apply changes.' : '✅ MIGRATION COMPLETE');
  console.log(`   BusinessProfile rows upserted: ${profilesUpserted}`);
  console.log(`   User.ghlBusinessId updated:    ${userUpdated}`);
  console.log(`   MemberCategory rows migrated:  ${catsMigrated}`);
  console.log('══════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch(err => { console.error('❌ Migration failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
