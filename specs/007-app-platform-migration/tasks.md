# DigitalOcean App Platform Migration: Phased Implementation Plan

**Status**: Planned, nothing started. All tasks below are unchecked.

**Goal**: Run the web app and API on DigitalOcean App Platform instead of the
droplet, with the droplet staying live as production until a verified DNS
cutover. Mobile apps move over with no app release, because they already call
`richfieldareachamber.com/api` and `members.richfieldareachamber.com/api`.

---

## Decisions already made

- The droplet keeps deploying production the whole time. App Platform is built
  alongside it as a separate instance.
- Resume uploads move from local disk to **DigitalOcean Spaces**, reachable by
  both the droplet and App Platform.
- The mobile apps are not changed. The cutover is a DNS change on the existing
  domain.
- `staging.richfieldareachamber.com` is the temporary hostname for testing the
  web app and a test mobile build before any DNS change.
- The cron jobs become **App Platform scheduled job components**.
- The staging instance does **not** point at the production database until
  cutover. It uses a copy.

## Open decisions (need an answer before the phase that depends on them)

| # | Decision | Needed by | Notes |
|---|----------|-----------|-------|
| 1 | Resume files: private bucket with signed links, or public with unguessable names | Phase 2 | Resumes are personal data. Recommend **private** plus a short-lived signed link, generated only for the job poster or an admin. Public is simpler but anyone with a link can read it. |
| 2 | Where DNS lives for `richfieldareachamber.com` | Phase 4 | Affects how easily the cutover can be rolled back (TTL control). |
| 3 | App Platform instance sizes and count | Phase 3 | One instance each is enough at first. See Phase 3 notes about the in-process caches. |
| 4 | Whether the GitHub Actions deploy job is removed or kept after cutover | Phase 6 | App Platform can auto-deploy from the branch itself. The build-and-test job is still useful. |

---

## What was found in the code (checked by reading, not by running)

- **Deploy today**: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)
  SSHes to the droplet as root, runs `git fetch` and `git reset --hard
  origin/dev`, rebuilds both parts with PM2, and rewrites the nginx config on
  every deploy. There is no `set -e`, so a failed step can still end green.
- **Resumes on local disk**: [ghl-api/src/routes/jobs.ts](../../ghl-api/src/routes/jobs.ts)
  saves uploads with multer disk storage into `ghl-api/public/uploads/resumes/`
  and stores `/uploads/resumes/<file>` in `JobApplication.resumeFileUrl`.
  [ghl-api/src/app.ts](../../ghl-api/src/app.ts) serves that folder at
  `/uploads`. App Platform's disk is wiped on every deploy and restart, so this
  must change.
- **Resume links may already be broken in production (unverified)**: the
  frontend ([src/pages/JobApplicationsList.tsx](../../src/pages/JobApplicationsList.tsx))
  links straight to `resumeFileUrl`. Nginx only forwards `/api` to the backend,
  so `/uploads/...` would reach the frontend server instead. Check this in
  production before building anything.
- **Avatars**: `ghl-api/public/avatars/` holds old test images tracked in git.
  No code writes to or serves that folder, so it is not part of this work and
  can be deleted separately.
- **In-process schedulers** (started in [ghl-api/src/server.ts](../../ghl-api/src/server.ts)):
  - `startEventReminderScheduler`: hourly. It records sent reminders in the
    database, so an accidental double run is lower risk than it first looks.
  - `startElectionScheduler`: every 5 minutes. It opens and closes voting and
    sends board notifications, so a double run could duplicate those.
  - `startDirectoryCachePrewarm`: refreshes an in-memory directory cache. This
    must keep running inside every API instance. It is **not** a job.
  - The hourly session cleanup in `authSession.ts` also stays in the API.
- **`serve.js` calls the API at `http://localhost:3000/api`** for the sitemap
  and blog link previews. That only works when both run on one machine.
- **Nginx behavior to reproduce** (from the deploy workflow):
  - `/api` goes to the backend; `/blog-image` and everything else go to the
    frontend server.
  - `www.` and `members.` redirect page visits to `richfieldareachamber.com`.
  - `members.` keeps serving `/api` for old mobile builds.
  - Request bodies up to 15 MB (base64 image uploads; Express also allows 15 MB).
  - TLS from Let's Encrypt, with HTTP redirected to HTTPS.

---

## Phase 0: Make the GitHub repo private safely (do first, on the droplet)

The droplet currently clones over unauthenticated HTTPS, which only works while
the repo is public.

- [ ] 0.1 On the droplet, run `git remote -v` in `/root/racc-membership-app` and
      note the URL.
- [ ] 0.2 Generate an SSH key on the droplet. Add the public key as a
      **read-only deploy key** on the repo (Settings, Deploy keys). Run
      `ssh-keyscan github.com >> ~/.ssh/known_hosts`.
- [ ] 0.3 Run `git remote set-url origin git@github.com:openskysolutions/racc-membership-app.git`
      on the droplet, then `git ls-remote origin` to prove it works while the repo
      is still public.
- [ ] 0.4 In `deploy.yml`, add `set -e` at the top of the remote script so a
      failed fetch stops the deploy instead of rebuilding old code.
- [ ] 0.5 Push a small change to `dev` and confirm the droplet really updates.
- [ ] 0.6 Make the repo private. Push again and confirm the deploy still works.
- [ ] 0.7 Rotate the GoHighLevel client secret that was committed in `.env` in
      August 2025 (commit `66ccb56`), if that OAuth app is still used.
- [ ] 0.8 Restrict the Firebase API keys in Google Cloud. The config files
      `google-services.json` and `GoogleService-Info.plist` are in the history.
- [ ] 0.9 Update the README clone URL if anyone else needs it.

---

## Phase 1: Code changes that are safe on the droplet

Each change must keep the droplet working with no new settings.

### 1.1 Scheduler switch
- [ ] Add env flag `ENABLE_SCHEDULERS` (default **true** when unset) in
      `server.ts`. When `false`, skip `startEventReminderScheduler` and
      `startElectionScheduler`. Leave `startDirectoryCachePrewarm` always on.
- [ ] Deploy to the droplet and confirm the schedulers still start.

### 1.2 Run-once entry points for scheduled jobs
- [ ] Create `ghl-api/src/jobs/electionTick.ts` and
      `ghl-api/src/jobs/eventReminders.ts`. Each calls the existing function
      once, closes the Prisma connection, and exits with the right code.
      `checkElectionTransitions` is currently not exported, so export it.
      `checkAndSendEventReminders` is already exported.
- [ ] Add npm scripts `job:election` and `job:reminders` that run the built files.
- [ ] Confirm `tsc && tsc-alias` puts them under `dist/jobs/` with aliases
      resolved.

### 1.3 `serve.js` API address
- [ ] Replace the hard-coded `http://localhost:${PORT}/api` with
      `process.env.API_INTERNAL_URL`, falling back to the current value.

### 1.4 Spaces storage for resumes (see Phase 2 for the Spaces setup)
- [ ] Add a small storage service, for example
      `ghl-api/src/services/fileStorage.ts`, using `@aws-sdk/client-s3` (Spaces
      speaks the S3 API). It reads `SPACES_*` settings. With no settings, it
      falls back to the current disk behavior so the droplet keeps working.
- [ ] In `jobs.ts`, switch multer to memory storage (the 5 MB limit stays) and
      send the file through the storage service. Keep the PDF/DOC/DOCX filter.
- [ ] Store the object key for new uploads. Make reads handle both old
      `/uploads/resumes/...` values and new keys.
- [ ] If decision 1 is "private": add an endpoint that returns a short-lived
      signed link, allowed only for the job's poster and admins, and change
      `JobApplicationsList.tsx` to use it.
- [ ] Add unit tests for the storage service (disk fallback, key creation) and
      for the permission check on the signed link.

---

## Phase 2: DigitalOcean Spaces

- [ ] 2.1 Create a Spaces bucket in the same region as the database, with
      access keys for the app only.
- [ ] 2.2 Set the bucket private or public per decision 1.
- [ ] 2.3 Add `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_REGION`
      and `SPACES_ENDPOINT` to GitHub secrets and vars, and to the deploy
      workflow's env list, so the droplet can use Spaces too.
- [ ] 2.4 Write a one-time script that uploads every file in
      `public/uploads/resumes/` on the droplet to Spaces and updates the
      matching `resumeFileUrl` rows. Run it first with a dry-run flag. Keep the
      files on disk as a backup afterward.
- [ ] 2.5 Test an upload and a download from the droplet and from staging
      against the same bucket.

---

## Phase 3: App Platform app (staging)

### 3.1 App spec file (`.do/app.yaml`, committed to the repo)
- [ ] Service **api**: source dir `ghl-api`, build `npm ci && npx prisma
      generate && npm run build`, run `npm start`, port 3000, HTTP route
      `/api` (keep the path prefix), health check `/health`.
- [ ] Service **web**: repo root, build `npm ci --legacy-peer-deps && npm run
      build`, run `node serve.js`, port from `FRONTEND_PORT`, routes `/` and
      `/blog-image`, `API_INTERNAL_URL` pointing at the api service's internal
      address. Check DigitalOcean's current docs for how services address each
      other privately.
- [ ] Job **election-tick**: scheduled every 5 minutes, runs `npm run
      job:election`.
- [ ] Job **event-reminders**: scheduled hourly, runs `npm run job:reminders`.
      Check the minimum schedule interval App Platform allows.
- [ ] Set `ENABLE_SCHEDULERS=false` on the api service (the jobs replace it).

### 3.2 Environment variables
- [ ] Copy every variable from the deploy workflow's env list (database, GHL,
      email, Firebase, frontend) into the app, marking secrets as encrypted.
- [ ] Add `SPACES_*`, `API_INTERNAL_URL` and `ENABLE_SCHEDULERS`.
- [ ] Set `FRONTEND_URL` and `VITE_API_BASE_URL` to the staging hostname for now.

### 3.3 Staging database
- [ ] Fork a copy of the production database from a backup and use it as
      staging's `DATABASE_URL`.
- [ ] Add the staging app to the copy's trusted sources.
- [ ] Check Prisma's connection pool size against the managed database's
      connection limit, since the api and each job open their own connections.

### 3.4 Keep staging from touching real people
- [ ] Leave both job components **disabled** on staging until cutover.
- [ ] Use test accounts only. Staging still talks to the real GoHighLevel
      account and the real push service, so a referral sent to a real business
      would really notify them.
- [ ] Consider pointing staging at a test email sender or an email sink.

### 3.5 Connect GitHub
- [ ] Authorize DigitalOcean's GitHub app for the private repo and auto-deploy
      the `dev` branch to staging.

---

## Phase 4: Staging domain and testing

- [ ] 4.1 Add `staging.richfieldareachamber.com` to the app and create the DNS
      record DigitalOcean asks for. Wait for the certificate.
- [ ] 4.2 Web test checklist: sign in, directory, member pages and slugs, jobs
      with resume upload and download, blog link previews and `/blog-image`,
      `sitemap.xml`, `/.well-known/apple-app-site-association`, unknown paths
      return 404, referrals, My Card, voting, and a large image upload near the
      15 MB limit (check whether App Platform enforces its own request size
      limit).
- [ ] 4.3 Run each job once by hand and check its logs.
- [ ] 4.4 Build a **test mobile app** with `VITE_API_BASE_URL` set to
      `https://staging.richfieldareachamber.com/api` (see `.env.mobile.production`
      for how the mobile build picks it up). Install it on a device and test
      sign-in, push notification registration, referrals, My Card (including the
      signed-out and Face ID parts) and the notification bell.
- [ ] 4.5 Test email delivery from staging. If email uses SMTP, confirm the
      provider's ports work from App Platform.
- [ ] 4.6 Record load times and any errors for a week of normal use.

---

## Phase 5: Cutover

Do this in a quiet period. Nothing here requires a new mobile release.

**Before the day**
- [ ] 5.1 Lower the DNS TTL on the apex, `www` and `members` records to a few
      minutes, 24 to 48 hours ahead.
- [ ] 5.2 Make sure Phase 1's `ENABLE_SCHEDULERS` code is already deployed on
      the droplet.
- [ ] 5.3 Do a final resume sync from the droplet to Spaces (task 2.4 script).

**On the day, in this order**
- [ ] 5.4 On the droplet set `ENABLE_SCHEDULERS=false` and reload, so no
      scheduler runs there.
- [ ] 5.5 On App Platform, point `DATABASE_URL` at the **production** database,
      add the app to its trusted sources, and set `FRONTEND_URL` and
      `VITE_API_BASE_URL` to the real domain.
- [ ] 5.6 Enable both job components.
- [ ] 5.7 Add `richfieldareachamber.com`, `www.` and `members.` to the app. Set
      up the redirects (`www` and `members` to the apex for pages, with `/api`
      still served on `members`).
- [ ] 5.8 Change the DNS records and wait for the certificates to validate.
- [ ] 5.9 Verify with the Phase 4.2 checklist on the real domain, plus an
      installed mobile app on a real phone.

**Rollback**: set DNS back to the droplet, re-enable `ENABLE_SCHEDULERS` there,
and disable the job components. Do not run both sets of schedulers at once.

---

## Phase 6: Clean up

- [ ] 6.1 Keep the droplet running with schedulers off for 3 to 7 days.
- [ ] 6.2 Take a final snapshot of the droplet, then remove it.
- [ ] 6.3 Remove the deploy job and the SSH, nginx, certbot and swap steps from
      `deploy.yml` (or delete the workflow, per decision 4). Remove the
      `DO_DEPLOY_KEY` secret.
- [ ] 6.4 Remove the debug steps that print `.env` contents.
- [ ] 6.5 Update the README and the deployment docs in `docs/` to describe the
      new setup.
- [ ] 6.6 Delete the unused `ghl-api/public/avatars/` test files and the stale
      `ghl-api/prisma/migrations/add_referrals_and_member_cards.sql` if they are
      still unused.

---

## Risks to watch

- **Resume links**: check task 4.2's resume test closely. They may be broken
  today (see the code findings above).
- **Duplicate scheduled work**: never let the droplet and the job components
  both run schedulers against production.
- **Cost**: a service per component plus two jobs. Confirm current pricing
  before committing.
- **Outbound IP**: App Platform's outbound address is not fixed unless you add
  a dedicated one. Matters only if something (the database allow-list, GHL)
  restricts by IP.
- **In-memory caches**: the directory cache is per instance. That is fine for
  one or two instances, but each warms separately.
