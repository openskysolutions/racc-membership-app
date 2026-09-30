# Member Referral Program: Feature Set (for proposal)

Working name: **Member Connect**. Client-facing feature list, grouped in the
order they'd be pitched/delivered. See [research-and-plan.md](research-and-plan.md)
for the supporting research and rationale.

## 1. Give & Track Referrals (core loop)
- **Refer a Member**: from any member's profile in the existing directory, a
  member can submit a referral — lead name/contact info, a short note, and
  an optional "temperature" (hot/warm/cold).
- **My Referrals inbox**: a dedicated screen showing referrals the member has
  *given* and *received*, each with a status.
- **Status pipeline**: the receiving member moves a referral through
  Submitted → Contacted → In Discussion → Closed-Won / Closed-Lost / Not a
  Fit, so the person who gave the referral always knows what happened to it.
- **Email notifications**: automatic email when a member receives a new
  referral or when a referral they gave changes status.

## 2. Public Recognition & Trust
- **Referral activity feed**: the app shows, chamber-wide, that a referral
  took place between two members ("Jane referred a lead to Mike's Print
  Shop") — visible by default, no opt-in required.
- **Lead privacy, always**: the identity and contact details of the lead
  being referred, and any dollar value of closed business, are never shown
  publicly — only the referrer and recipient ever see that information.
- **Testimonials**: a receiving member can post a short public thank-you
  about the referral partner, reusing the visual style of the existing
  Business of the Month / nomination badges.

## 3. Recognition & Leaderboard
- **Points & Connector tiers**: Bronze / Silver / Gold / Platinum badges
  based on referral activity, weighted toward closed business rather than
  raw volume (quality over spam).
- **Leaderboard**: monthly and all-time views of top connectors, finally
  delivering the "Leaderboard" feature originally envisioned for the portal.
- **Connector of the Month**: a spotlight slot admins can use in the app
  and/or newsletter, mirroring the existing Business of the Month program.

## 4. Admin & Moderation Tools
*(Included in the initial release, not deferred.)*
- An admin view of all referrals chamber-wide (volume, status breakdown,
  top connectors).
- Ability to hide/remove inappropriate entries or override a stuck status.
- Basic abuse guardrails: rate limits per member, de-duplication of repeat
  referrals to the same business pairing.

## 5. Optional add-ons (flag for the client as optional scope)
- Push notifications on mobile (Capacitor) in addition to email.
- Automation hook: closed-won referral optionally creates a GHL
  opportunity/contact note for the receiving business.

*Dollar-value tracking of closed business was considered and intentionally
excluded — that information stays private between the two member businesses
involved and is not tracked by the platform.*
