/**
 * sync-contact-to-business.js
 *
 * For each GHL business, finds the main contact and copies these fields to the
 * business record IF the business field is not already set:
 *   - renewal_date        (from contact custom field J3yL94KqDhUnjurcIG8G)
 *   - membership_status   ('active' if contact has 'active' tag, else 'expired')
 *   - membership_tier     (from contact tier tag, e.g. 'basic_membership_package')
 *   - membership_start_date (from contact custom field Dxt6gzc4osQhaCBPhslY)
 *
 * Usage:
 *   node scripts/sync-contact-to-business.js           # dry run (no writes)
 *   node scripts/sync-contact-to-business.js --write   # actually update GHL
 */

require('dotenv').config();
const axios = require('axios');

const DRY_RUN = !process.argv.includes('--write');

const token      = process.env.PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.LOCATION_ID;

const contactHeaders  = { Authorization: 'Bearer ' + token, Version: '2021-07-28' };
const businessHeaders = { Authorization: 'Bearer ' + token, Version: 'v3' };
const objectsHeaders  = { Authorization: 'Bearer ' + token, Version: '2021-07-28' };

const TIER_TAGS = [
  'basic membership package',
  'enhanced membership package',
  'elite membership package',
];
const RENEWAL_FIELD_ID = 'J3yL94KqDhUnjurcIG8G'; // contact: Renewal Date (DATE)
const START_FIELD_ID   = 'Dxt6gzc4osQhaCBPhslY'; // contact: Membership Start Date (TEXT)

function normalizeDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function getBizProp(biz, key) {
  const f = (biz.customFields ?? []).find(f => f.key === key);
  return f?.valueString ?? f?.valueDate ?? null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(DRY_RUN ? '=== DRY RUN (pass --write to apply) ===' : '=== LIVE RUN — writing to GHL ===');
  console.log();

  // ── 1. Fetch all contacts ────────────────────────────────────────────────
  let allContacts = [], page = 1;
  while (true) {
    const res = await axios.post(
      'https://services.leadconnectorhq.com/contacts/search',
      { locationId, pageLimit: 100, page },
      { headers: contactHeaders }
    );
    const batch = res.data.contacts ?? [];
    allContacts.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  console.log(`Fetched ${allContacts.length} contacts`);

  // ── 2. Build businessId → best main contact ──────────────────────────────
  const byBiz = new Map();
  for (const c of allContacts) {
    if (!c.businessId) continue;
    if (!byBiz.has(c.businessId)) byBiz.set(c.businessId, []);
    byBiz.get(c.businessId).push(c);
  }

  const bizToContact = new Map();
  for (const [bizId, contacts] of byBiz) {
    // Prefer: main-contact + tier tag → then just main-contact → then any
    const main =
      contacts.find(c => {
        const t = c.tags ?? [];
        return (t.includes('main-contact') || t.includes('main contact')) &&
               TIER_TAGS.some(tt => t.includes(tt));
      }) ??
      contacts.find(c => {
        const t = c.tags ?? [];
        return t.includes('main-contact') || t.includes('main contact');
      }) ??
      contacts[0];
    bizToContact.set(bizId, main);
  }
  console.log(`Businesses with at least one contact: ${bizToContact.size}`);
  console.log();

  // ── 3. For each business: fetch record, compare, maybe update ────────────
  let updated = 0, skipped = 0, noChange = 0;

  const bizIds = [...bizToContact.keys()];
  for (let i = 0; i < bizIds.length; i++) {
    const bizId  = bizIds[i];
    const contact = bizToContact.get(bizId);

    // Fetch the current business record (has customFields)
    let biz;
    try {
      const res = await axios.get(
        `https://services.leadconnectorhq.com/businesses/${bizId}`,
        { headers: businessHeaders, params: { locationId } }
      );
      biz = res.data.business ?? res.data;
    } catch (e) {
      console.warn(`  SKIP ${bizId}: fetch failed (${e.response?.status ?? e.message})`);
      skipped++;
      continue;
    }

    const bizName = biz.name ?? contact.companyName ?? bizId;

    // ── Derive values from contact ─────────────────────────────────────────
    const contactTags     = contact.tags ?? [];
    const tierTag         = TIER_TAGS.find(t => contactTags.includes(t));
    const contactTierVal  = tierTag ? tierTag.replace(/ /g, '_') : null;
    const contactStatus   = contactTags.includes('active') ? 'active' : 'expired';

    const renewalField    = (contact.customFields ?? []).find(f => f.id === RENEWAL_FIELD_ID);
    const contactRenewal  = normalizeDate(renewalField?.value ?? renewalField?.fieldValue ?? null);

    const startField      = (contact.customFields ?? []).find(f => f.id === START_FIELD_ID);
    const contactStart    = normalizeDate(startField?.value ?? startField?.fieldValue ?? null);

    // ── Check what the business currently has ─────────────────────────────
    const bizRenewal  = getBizProp(biz, 'renewal_date');
    const bizStatus   = getBizProp(biz, 'membership_status');
    const bizTier     = getBizProp(biz, 'membership_tier');
    const bizStart    = getBizProp(biz, 'membership_start_date');

    // ── Build update payload (only fill blanks) ────────────────────────────
    const update = {};
    if (!bizRenewal  && contactRenewal)  update.renewal_date           = contactRenewal;
    if (!bizStatus   && contactStatus)   update.membership_status       = contactStatus;
    if (!bizTier     && contactTierVal)  update.membership_tier         = contactTierVal;
    if (!bizStart    && contactStart)    update.membership_start_date   = contactStart;

    if (Object.keys(update).length === 0) {
      noChange++;
      continue;
    }

    // ── Log / apply ───────────────────────────────────────────────────────
    console.log(`[${i + 1}/${bizIds.length}] ${bizName}`);
    for (const [k, v] of Object.entries(update)) {
      const current = getBizProp(biz, k) ?? '(empty)';
      console.log(`  ${k}: "${current}" → "${v}"`);
    }

    if (!DRY_RUN) {
      try {
        await axios.put(
          `https://services.leadconnectorhq.com/objects/business/records/${bizId}`,
          { properties: update },
          { headers: objectsHeaders, params: { locationId } }
        );
        console.log('  ✓ updated');
        updated++;
      } catch (e) {
        console.error('  ✗ failed:', e.response?.data ?? e.message);
        skipped++;
      }
      await sleep(100); // avoid rate limiting
    } else {
      updated++;
    }
  }

  console.log();
  console.log(`Done. Would update: ${updated} | no change needed: ${noChange} | errors: ${skipped}`);
  if (DRY_RUN && updated > 0) {
    console.log('Run with --write to apply changes.');
  }
}

run().catch(e => console.error(e.response?.data ?? e.message));
