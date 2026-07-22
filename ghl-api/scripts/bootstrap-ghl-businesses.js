/**
 * bootstrap-ghl-businesses.js
 *
 * One-time migration script: reads all active-member GHL Contacts, groups them by
 * business name, creates a GHL Business record for each unique business, then links
 * every contact back to that business by setting contact.businessId.
 *
 * Usage:
 *   node scripts/bootstrap-ghl-businesses.js --stats     # coverage report only — no changes
 *   node scripts/bootstrap-ghl-businesses.js --unlinked  # list contacts with no businessId set
 *   node scripts/bootstrap-ghl-businesses.js             # dry-run (no changes made)
 *   node scripts/bootstrap-ghl-businesses.js --execute   # actually create/link records
 *
 * Required env vars (loaded from ../.env automatically if present):
 *   PRIVATE_INTEGRATION_TOKEN  — GHL sub-account private integration token
 *   LOCATION_ID                — GHL sub-account location ID
 *
 * What it does:
 *   1. Fetches all GHL Contacts that have the "active" tag (paginated).
 *   2. Groups them by normalised business name (businessName or companyName field).
 *   3. Fetches all existing GHL Businesses so the script is safe to re-run (idempotent).
 *   4. For each unique business name that doesn't already have a GHL Business:
 *        - Creates a new GHL Business record using POST /businesses/ (v3 API).
 *        - Picks the most complete contact in the group as the data source (prefers
 *          any contact tagged "main-contact", then the one with the most fields).
 *   5. For every contact in each group, sets contact.businessId via PUT /contacts/:id
 *      so GHL knows which Business the contact belongs to.
 *
 * The script prints a full summary at the end. Review it carefully.
 */

'use strict';

const axios = require('axios');
const path  = require('path');
const fs    = require('fs');

// ---------------------------------------------------------------------------
// Load .env from the ghl-api directory if present
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
const TOKEN         = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID   = process.env.LOCATION_ID;
const STATS_ONLY    = process.argv.includes('--stats');
const UNLINKED_ONLY = process.argv.includes('--unlinked');
const DRY_RUN       = !process.argv.includes('--execute');

if (!TOKEN || !LOCATION_ID) {
  console.error('❌ PRIVATE_INTEGRATION_TOKEN and LOCATION_ID must be set');
  process.exit(1);
}

if (STATS_ONLY) {
  console.log('\n📊 STATS MODE — fetching contacts and reporting coverage only. No changes will be made.\n');
} else if (UNLINKED_ONLY) {
  console.log('\n🔍 UNLINKED MODE — listing contacts not yet associated with a GHL Business.\n');
} else if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN MODE — no changes will be made.');
  console.log('   Pass --execute to actually create/update records.\n');
} else {
  console.log('\n🚀 EXECUTE MODE — GHL records will be created and updated.\n');
}

/** Milliseconds to wait between API calls to avoid hitting rate limits. */
const RATE_LIMIT_DELAY_MS = 300;

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

const clientV3 = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Version: 'v3',
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retry wrapper with exponential backoff for 429 / 5xx responses. */
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

/**
 * Normalise a business name for deduplication purposes:
 * lowercase, collapse whitespace, strip trailing punctuation.
 */
function normalise(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');
}

/**
 * Common free/generic email providers whose domain should NOT be used
 * to infer a business affiliation.
 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com', 'outlook.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'protonmail.com', 'pm.me',
  'zoho.com',
  'comcast.net', 'att.net', 'verizon.net', 'sbcglobal.net',
]);

/** Extract email domain; returns null for free providers or malformed addresses. */
function businessDomain(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@').pop().toLowerCase().trim();
  return FREE_EMAIL_DOMAINS.has(domain) ? null : domain;
}

// ---------------------------------------------------------------------------
// GHL API calls
// ---------------------------------------------------------------------------

/**
 * Fetch ALL contacts that have the "active" tag, paginating through results.
 * GHL's search endpoint supports a maximum of 100 results per page.
 */
async function fetchAllActiveContacts() {
  const contacts = [];
  let page = 1;
  const pageLimit = 100;

  console.log('📥 Fetching active contacts from GHL...');

  while (true) {
    await sleep(RATE_LIMIT_DELAY_MS);

    const body = {
      locationId: LOCATION_ID,
      pageLimit,
      page,
      filters: [
        { field: 'tags', operator: 'contains', value: 'active' },
      ],
    };

    const response = await withRetry(() => clientV2.post('/contacts/search', body));
    const batch = response.data?.contacts ?? [];
    contacts.push(...batch);

    console.log(`   Page ${page}: ${batch.length} contacts (total so far: ${contacts.length})`);

    if (batch.length < pageLimit) break;
    page++;
  }

  console.log(`✅ Fetched ${contacts.length} active contacts total.\n`);
  return contacts;
}

/**
 * Fetch ALL existing GHL Businesses for this location (paginated).
 * Used to make the script idempotent — we skip creating a business if one
 * with the same name already exists.
 */
async function fetchExistingBusinesses() {
  const businesses = [];
  let skip = 0;
  const limit = 100;

  console.log('📥 Fetching existing GHL Businesses...');

  while (true) {
    await sleep(RATE_LIMIT_DELAY_MS);

    const response = await withRetry(() =>
      clientV3.get('/businesses/', { params: { locationId: LOCATION_ID, limit, skip } })
    );
    const batch = response.data?.businesses ?? [];
    businesses.push(...batch);

    console.log(`   Batch (skip=${skip}): ${batch.length} businesses (total so far: ${businesses.length})`);

    if (batch.length < limit) break;
    skip += limit;
  }

  console.log(`✅ Found ${businesses.length} existing businesses.\n`);
  return businesses;
}

/**
 * Create a new GHL Business record.
 * Returns the created business object (with its new `id`).
 */
async function createBusiness(data) {
  await sleep(RATE_LIMIT_DELAY_MS);
  const response = await withRetry(() =>
    clientV3.post('/businesses/', { ...data, locationId: LOCATION_ID })
  );
  return response.data?.business ?? response.data;
}

/**
 * Update a GHL Business record with the given fields.
 */
async function updateBusiness(businessId, data) {
  await sleep(RATE_LIMIT_DELAY_MS);
  const response = await withRetry(() =>
    clientV3.put(`/businesses/${businessId}`, data)
  );
  return response.data?.business ?? response.data;
}

/**
 * Update a GHL Contact to set its businessId.
 * Tries v2 first (PUT /contacts/:id with { businessId }).
 * Falls back to v3 if v2 returns an error, since some GHL accounts
 * require v3 for the businessId field.
 */
async function linkContactToBusiness(contactId, businessId) {
  await sleep(RATE_LIMIT_DELAY_MS);

  // Try v2 first
  try {
    await withRetry(() =>
      clientV2.put(`/contacts/${contactId}`, { businessId })
    );
    return; // success
  } catch (errV2) {
    const status = errV2.response?.status;
    const body   = JSON.stringify(errV2.response?.data ?? {});
    console.warn(`      ⚠️  v2 link failed (HTTP ${status}): ${body} — retrying with v3`);
  }

  // Fall back to v3
  await withRetry(() =>
    clientV3.put(`/contacts/${contactId}`, { businessId })
  );
}

// ---------------------------------------------------------------------------
// Business field extraction
// ---------------------------------------------------------------------------

/**
 * Given a contact object, extract the fields that map to a GHL Business record.
 * Returns null if the contact has no business name at all.
 */
function extractBusinessFields(contact) {
  const name = (contact.businessName || contact.companyName || '').trim();
  if (!name) return null;

  return {
    name,
    phone:      contact.phone      || undefined,
    email:      contact.email      || undefined,
    website:    contact.website    || undefined,
    address:    contact.address1   || undefined,
    city:       contact.city       || undefined,
    state:      contact.state      || undefined,
    postalCode: contact.postalCode || undefined,
    country:    contact.country    || undefined,
    // GHL Business has a `description` field — we leave this blank here.
    // The full bio text will be migrated to BusinessProfile.bio separately.
  };
}

/**
 * Given a list of contacts in the same business group, pick the best one to use
 * as the data source for the GHL Business record:
 *   1. Prefer a contact tagged "main-contact" — they are the designated representative.
 *   2. Otherwise, pick the contact with the most non-empty fields.
 */
function pickBestContact(contacts) {
  const mainContact = contacts.find(c => Array.isArray(c.tags) && c.tags.includes('main-contact'));
  if (mainContact) return mainContact;

  // Score each contact by number of non-empty business-relevant fields.
  const score = c => [c.phone, c.website, c.address1, c.city, c.state, c.postalCode].filter(Boolean).length;
  return contacts.slice().sort((a, b) => score(b) - score(a))[0];
}

// ---------------------------------------------------------------------------
// Stats-only mode
// ---------------------------------------------------------------------------

/**
 * Fetch all active contacts, analyse business name / email domain coverage,
 * and print a detailed report. Does not touch GHL in any way.
 */
async function runStats() {
  const allContacts = await fetchAllActiveContacts();
  const total = allContacts.length;

  // Already have a businessId linked in GHL (the ideal end-state)
  const alreadyLinked = allContacts.filter(c => c.businessId);

  // Have a business name (businessName or companyName field)
  const hasBusinessName = allContacts.filter(c =>
    (c.businessName || c.companyName || '').trim().length > 0
  );

  // No business name, but a non-generic email domain
  const noNameButDomain = allContacts.filter(c => {
    const hasName = (c.businessName || c.companyName || '').trim().length > 0;
    return !hasName && businessDomain(c.email) !== null;
  });

  // Truly orphaned — no business name, no usable email domain
  const orphaned = allContacts.filter(c => {
    const hasName = (c.businessName || c.companyName || '').trim().length > 0;
    return !hasName && businessDomain(c.email) === null;
  });

  // Unique business names
  const uniqueNames = new Set(
    hasBusinessName.map(c => normalise(c.businessName || c.companyName))
  );

  // Unique non-generic domains among name-less contacts
  const domainCounts = new Map();
  for (const c of noNameButDomain) {
    const d = businessDomain(c.email);
    domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
  }

  const pct = (n) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';

  console.log('='.repeat(60));
  console.log('CONTACT BUSINESS COVERAGE REPORT');
  console.log('='.repeat(60));
  console.log(`Total active contacts:                    ${total}`);
  console.log('');
  console.log(`Already linked to a GHL Business:         ${alreadyLinked.length} (${pct(alreadyLinked.length)})`);
  console.log(`Have a business name field:               ${hasBusinessName.length} (${pct(hasBusinessName.length)}) → ${uniqueNames.size} unique names`);
  console.log(`No name, but non-generic email domain:    ${noNameButDomain.length} (${pct(noNameButDomain.length)})`);
  console.log(`No name, no usable domain (orphaned):     ${orphaned.length} (${pct(orphaned.length)})`);

  if (domainCounts.size > 0) {
    console.log('\nEmail domains for name-less contacts:');
    const sorted = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [domain, count] of sorted) {
      console.log(`  @${domain.padEnd(35)} ${count} contact(s)`);
    }
  }

  if (orphaned.length > 0) {
    console.log(`\nOrphaned contacts (no business name, no usable domain):`);
    for (const c of orphaned) {
      console.log(`  ${c.id}  ${(c.firstName || '') + ' ' + (c.lastName || '')}  <${c.email || 'no email'}>`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Run without --stats to see the full dry-run grouping plan.');
  console.log('='.repeat(60) + '\n');
}

// ---------------------------------------------------------------------------
// Unlinked-contacts report
// ---------------------------------------------------------------------------

/**
 * List every active contact that has no businessId set in GHL.
 * Groups them into three buckets:
 *   1. Has a business name — should have been linked; something went wrong.
 *   2. Has a non-generic email domain — may be linkable via domain matching.
 *   3. Truly orphaned — no name, no usable domain.
 */
async function runUnlinked() {
  const allContacts = await fetchAllActiveContacts();
  const unlinked = allContacts.filter(c => !c.businessId);

  if (unlinked.length === 0) {
    console.log('✅ All active contacts are linked to a GHL Business. Nothing to do.\n');
    return;
  }

  const withName    = unlinked.filter(c => (c.businessName || c.companyName || '').trim().length > 0);
  const withDomain  = unlinked.filter(c => !(c.businessName || c.companyName || '').trim() && businessDomain(c.email));
  const orphaned    = unlinked.filter(c => !(c.businessName || c.companyName || '').trim() && !businessDomain(c.email));

  const col = (s, w) => (s || '').toString().padEnd(w);
  const header = `${'Contact ID'.padEnd(26)} ${'Name'.padEnd(28)} ${'Email'.padEnd(36)} Business Name / Domain`;
  const divider = '-'.repeat(header.length);

  if (withName.length > 0) {
    console.log(`\n⚠️  ${withName.length} contact(s) have a business name but no businessId (link failed):`);
    console.log(divider);
    console.log(header);
    console.log(divider);
    for (const c of withName) {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      const biz  = (c.businessName || c.companyName || '').trim();
      console.log(`${col(c.id,26)} ${col(name,28)} ${col(c.email,36)} ${biz}`);
    }
  }

  if (withDomain.length > 0) {
    console.log(`\n🔍 ${withDomain.length} contact(s) have no business name but a non-generic email domain:`);
    console.log(divider);
    console.log(header);
    console.log(divider);
    for (const c of withDomain) {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      console.log(`${col(c.id,26)} ${col(name,28)} ${col(c.email,36)} @${businessDomain(c.email)}`);
    }
  }

  if (orphaned.length > 0) {
    console.log(`\n❌ ${orphaned.length} contact(s) are truly orphaned (no name, no usable domain):`);
    console.log(divider);
    console.log(header);
    console.log(divider);
    for (const c of orphaned) {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      console.log(`${col(c.id,26)} ${col(name,28)} ${col(c.email,36)} —`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total unlinked: ${unlinked.length}  (with name: ${withName.length}, domain only: ${withDomain.length}, orphaned: ${orphaned.length})`);
  console.log(`Re-run with --execute to retry linking those with a business name.`);
  console.log('='.repeat(60) + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (STATS_ONLY) {
    await runStats();
    return;
  }

  if (UNLINKED_ONLY) {
    await runUnlinked();
    return;
  }

  // 1. Fetch data
  const allContacts        = await fetchAllActiveContacts();
  const existingBusinesses = await fetchExistingBusinesses();

  // Build a lookup of normalised name → existing GHL Business
  const existingByName = new Map();
  for (const biz of existingBusinesses) {
    existingByName.set(normalise(biz.name), biz);
  }

  // 2. Group contacts by normalised business name.
  //    For contacts with no business name, fall back to email domain matching:
  //      Pass 1 — match against a domain already seen in a named group.
  //      Pass 2 — group remaining domain-sharing contacts together (flagged for review).
  const groups = new Map(); // normalisedName → contact[]

  // Pass A: contacts that have a business name.
  const noNameContacts = [];
  for (const contact of allContacts) {
    const key = normalise(contact.businessName || contact.companyName);
    if (!key) {
      noNameContacts.push(contact);
      continue;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(contact);
  }

  // Build domain → normalisedBusinessName lookup from named groups.
  const domainToGroup = new Map(); // domain → normalisedName
  for (const [normName, contacts] of groups) {
    for (const c of contacts) {
      const domain = businessDomain(c.email);
      if (domain && !domainToGroup.has(domain)) {
        domainToGroup.set(domain, normName);
      }
    }
  }

  // Pass B: contacts without a business name — try domain match.
  const stillUnmatched = [];
  for (const contact of noNameContacts) {
    const domain = businessDomain(contact.email);
    if (domain && domainToGroup.has(domain)) {
      const normName = domainToGroup.get(domain);
      groups.get(normName).push(contact);
      console.log(`   🔍 Matched contact ${contact.id} (${contact.email}) → "${normName}" via email domain`);
    } else {
      stillUnmatched.push({ contact, domain });
    }
  }

  // Pass C: group remaining unmatched contacts by shared non-generic domain.
  const domainGroups = new Map(); // domain → contact[]
  const trulyOrphaned = [];
  for (const { contact, domain } of stillUnmatched) {
    if (domain) {
      if (!domainGroups.has(domain)) domainGroups.set(domain, []);
      domainGroups.get(domain).push(contact);
    } else {
      trulyOrphaned.push(contact);
    }
  }

  // Add domain groups into the main groups map with a provisional name.
  // These are flagged with a leading "?" so the summary makes them obvious.
  for (const [domain, contacts] of domainGroups) {
    const provisionalKey = `?domain:${domain}`;
    groups.set(provisionalKey, contacts);
    console.log(`   ⚠️  ${contacts.length} contact(s) with no business name share domain @${domain} — grouped as "${provisionalKey}" (review needed)`);
  }

  const noBusinessName = trulyOrphaned.length;
  // (trulyOrphaned contacts are still counted but excluded from processing below)

  console.log(`📊 Summary of contacts:`);
  console.log(`   Total active contacts fetched:  ${allContacts.length}`);
  console.log(`   Contacts matched to a business: ${allContacts.length - noBusinessName - domainGroups.size}`);
  console.log(`   Contacts matched via email domain to named group: ${noNameContacts.length - stillUnmatched.length}`);
  console.log(`   Contacts grouped by shared email domain (review needed): ${[...domainGroups.values()].reduce((s, a) => s + a.length, 0)}`);
  console.log(`   Contacts with NO business name AND no usable domain (skipped): ${noBusinessName}`);
  console.log(`   Unique business groups (named + domain): ${groups.size}\n`);
  console.log(`   Unique business names identified: ${groups.size}`);
  console.log(`   Existing GHL Businesses already present: ${existingBusinesses.length}\n`);

  // 3. Process each unique business
  const results = {
    created:       [],  // { name, id, contactsLinked }
    alreadyExists: [],  // { name, id, contactsLinked, fieldsPatched }
    patched:       [],  // { name, id, fields }
    errors:        [],  // { name, error }
  };

  let groupIndex = 0;
  for (const [normName, contacts] of groups) {
    groupIndex++;
    const best      = pickBestContact(contacts);
    const fields    = extractBusinessFields(best);
    const existing  = existingByName.get(normName);
    const contactIds = contacts.map(c => c.id);

    console.log(`\n[${groupIndex}/${groups.size}] "${fields.name}"`);
    console.log(`   Contacts in this group: ${contacts.length} (${contactIds.join(', ')})`);

    if (existing) {
      console.log(`   ⏭️  GHL Business already exists (id: ${existing.id}).`);

      // Patch any fields that are missing on the existing business record.
      // Only send fields where the business has no value but the contact does.
      const patch = {};
      const fieldMap = [
        ['phone',      fields.phone],
        ['email',      fields.email],
        ['website',    fields.website],
        ['address',    fields.address],
        ['city',       fields.city],
        ['state',      fields.state],
        ['postalCode', fields.postalCode],
        ['country',    fields.country],
        ['description', fields.description],
      ];
      for (const [key, contactVal] of fieldMap) {
        const bizVal = (existing[key] || '').toString().trim();
        if (!bizVal && contactVal) patch[key] = contactVal;
      }

      if (Object.keys(patch).length > 0) {
        console.log(`   ✏️  Missing fields to patch: ${Object.keys(patch).join(', ')}`);
        if (!DRY_RUN) {
          try {
            await updateBusiness(existing.id, patch);
            console.log(`      ✅ Patched business ${existing.id}`);
            results.patched.push({ name: fields.name, id: existing.id, fields: Object.keys(patch) });
          } catch (err) {
            console.error(`      ❌ Failed to patch business ${existing.id}: ${err.response?.data?.message ?? err.message}`);
          }
        } else {
          console.log(`      [dry-run] Would patch: ${JSON.stringify(patch, null, 8).replace(/\n/g, '\n      ')}`);
          results.patched.push({ name: fields.name, id: existing.id, fields: Object.keys(patch) });
        }
      } else {
        console.log(`   ✅ All fields already populated — no patch needed.`);
      }

      results.alreadyExists.push({ name: fields.name, id: existing.id, contactsLinked: contactIds.length });

      // Still link contacts that aren't already linked.
      const unlinked = contacts.filter(c => c.businessId !== existing.id);
      if (unlinked.length === 0) {
        console.log(`   ✅ All contacts already linked to this business.`);
      } else {
        console.log(`   🔗 ${unlinked.length} contact(s) need linking to businessId ${existing.id}.`);
        if (!DRY_RUN) {
          for (const c of unlinked) {
            try {
              await linkContactToBusiness(c.id, existing.id);
              console.log(`      ✅ Linked contact ${c.id} (${c.email})`);
            } catch (err) {
              console.error(`      ❌ Failed to link contact ${c.id}: ${err.response?.data?.message ?? err.message}`);
            }
          }
        } else {
          for (const c of unlinked) {
            console.log(`      [dry-run] Would link contact ${c.id} (${c.email})`);
          }
        }
      }
      continue;
    }

    // No existing business — create it.
    console.log(`   ➕ Would create GHL Business: ${JSON.stringify(fields, null, 6).replace(/\n/g, '\n      ')}`);
    console.log(`   🔗 Would link ${contacts.length} contact(s).`);

    if (DRY_RUN) continue;

    try {
      const created = await createBusiness(fields);
      console.log(`   ✅ Created business id: ${created.id}`);

      // Brief pause so GHL has time to propagate the new business record
      // before we try to link contacts to it.
      await sleep(1500);

      // Link all contacts in the group to the new business.
      for (const c of contacts) {
        try {
          await linkContactToBusiness(c.id, created.id);
          console.log(`      ✅ Linked contact ${c.id} (${c.email})`);
        } catch (linkErr) {
          console.error(`      ❌ Failed to link contact ${c.id}: ${linkErr.response?.data?.message ?? linkErr.message}`);
        }
      }

      results.created.push({ name: fields.name, id: created.id, contactsLinked: contacts.length });
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message;
      console.error(`   ❌ Failed to create business "${fields.name}": ${msg}`);
      results.errors.push({ name: fields.name, error: msg });
    }
  }

  // 4. Final summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN — none of the above changes were applied.\n');
  }
  console.log(`Businesses to create:          ${groups.size - existingByName.size} (of ${groups.size} unique names)`);
  console.log(`Already existing:              ${results.alreadyExists.length}`);
  console.log(`Existing businesses patched:   ${results.patched.length}${DRY_RUN ? ' (dry-run)' : ''}`);
  if (!DRY_RUN) {
    console.log(`Successfully created:          ${results.created.length}`);
    console.log(`Errors during creation:        ${results.errors.length}`);
  }
  if (results.patched.length > 0) {
    console.log('\nPatched businesses:');
    for (const p of results.patched) {
      console.log(`  "${p.name}" (${p.id}): ${p.fields.join(', ')}`);
    }
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const e of results.errors) {
      console.log(`  - "${e.name}": ${e.error}`);
    }
  }

  if (noBusinessName > 0) {
    console.log(`\n⚠️  ${noBusinessName} active contact(s) had no business name and were skipped.`);
    console.log('   These contacts cannot be linked to a GHL Business automatically.');
    console.log('   Handle them manually in GoHighLevel.');
  }

  console.log('\n✅ Done.\n');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
