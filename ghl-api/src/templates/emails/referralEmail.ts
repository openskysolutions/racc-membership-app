/**
 * Email Templates: Member Referrals
 * Referral received (to the recipient business) and status update (to the referrer).
 */

interface ReferralReceivedParams {
  firstName?: string;
  referrerBusinessName: string;
  leadName: string;
  appUrl: string;
}

interface ReferralStatusParams {
  firstName?: string;
  recipientBusinessName: string;
  leadName: string;
  statusLabel: string;
  appUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Branded layout shared with the invite/confirmation emails (logo header, amber CTA, grey footer). */
function layout(heading: string, bodyHtml: string, appUrl: string, buttonLabel = 'View My Referrals', footerHtml = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(heading)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #57534e; margin: 0; padding: 0; }
        .email-wrapper { width: 100%; background-color: #f5f5f4; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: #FFFFFF; padding: 40px 30px 0px; text-align: center; }
        .logo-section { margin-bottom: 10px; }
        .logo { width: auto; height: 60px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 16px 0 0; color: #1c1917; }
        .content { padding: 30px 30px 40px; }
        .content p { font-size: 16px; color: #57534e; margin-bottom: 20px; line-height: 1.8; }
        .content p:first-child { font-size: 18px; color: #78350f; font-weight: 600; margin-bottom: 16px; }
        .content strong { color: #1c1917; }
        .cta-container { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background-color: #b45309; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e7e5e4, transparent); margin: 30px 0; }
        .note { font-size: 14px; color: #78716c; line-height: 1.7; }
        .footer { background-color: #525252; padding: 20px; text-align: center; color: #FFFFFF; }
        .footer-brand { font-size: 18px; font-weight: 500; margin-bottom: 10px; }
        .footer-tagline { font-size: 14px; margin-bottom: 20px; font-style: italic; }
        .footer-contact { font-size: 13px; }
        .footer-contact a { color: #eab308; text-decoration: none; font-weight: 400; }
        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .header { padding: 30px 20px 0; }
            .content { padding: 24px 20px 32px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo-section">
                    <img src="https://richfieldareachamber.com/assets/racc-logo-BHZqyYn3.png" alt="Richfield Area Chamber of Commerce Logo" class="logo">
                </div>
                <h1>${esc(heading)}</h1>
            </div>

            <div class="content">
                ${bodyHtml}

                <div class="cta-container">
                    <a href="${esc(appUrl)}" class="cta-button">${esc(buttonLabel)}</a>
                </div>
                ${footerHtml ? `<div class="divider"></div>\n                <p class="note">${footerHtml}</p>` : ''}
            </div>

            <div class="footer">
                <div class="footer-brand">Richfield Area Chamber of Commerce</div>
                <div class="footer-tagline">Connecting business, building community.</div>
                <div class="footer-contact">
                    Questions? <a href="mailto:info@richfieldareachamber.com">info@richfieldareachamber.com</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

export function generateReferralReceivedEmail(p: ReferralReceivedParams): string {
  return layout(
    'You received a new referral',
    `<p>Hi ${esc(p.firstName || 'there')},</p>
      <p><strong>${esc(p.referrerBusinessName)}</strong> referred <strong>${esc(p.leadName)}</strong> to your business. Log in to see the details and let them know how it goes.</p>`,
    p.appUrl
  );
}

export function generateReferralReceivedEmailText(p: ReferralReceivedParams): string {
  return `Hi ${p.firstName || 'there'},\n\n${p.referrerBusinessName} referred ${p.leadName} to your business. View it here: ${p.appUrl}`;
}

export function generateReferralStatusUpdateEmail(p: ReferralStatusParams): string {
  return layout(
    'Your referral was updated',
    `<p>Hi ${esc(p.firstName || 'there')},</p>
      <p><strong>${esc(p.recipientBusinessName)}</strong> updated your referral of <strong>${esc(p.leadName)}</strong> to <strong>${esc(p.statusLabel)}</strong>.</p>`,
    p.appUrl
  );
}

export function generateReferralStatusUpdateEmailText(p: ReferralStatusParams): string {
  return `Hi ${p.firstName || 'there'},\n\n${p.recipientBusinessName} updated your referral of ${p.leadName} to ${p.statusLabel}. View it here: ${p.appUrl}`;
}

/*
 * TODO: Placeholder wording for the non-member invitation. Chamber leadership must confirm
 * this copy and what a non-member may access before this goes live. Edit only this block.
 */
export const NON_MEMBER_EMAIL_COPY = {
  subject: 'A Richfield Area Chamber member has a referral for your business',
  heading: 'A local business thought of you',
  buttonLabel: 'Learn about membership',
  about: 'The Richfield Area Chamber of Commerce is a local business community that helps area businesses connect and grow.',
  details: 'The details of the referral are available to chamber members.',
  contactLine: 'Richfield Area Chamber of Commerce - info@richfieldareachamber.com',
  optOut: 'Not interested? Reply to this email and ask to be removed, and we will not contact you again.',
};

interface NonMemberInviteParams {
  contactName?: string | null;
  businessName: string;
  referrerBusinessName: string;
  joinUrl: string;
}

// Never include the lead's name, contact details or note here.
export function generateNonMemberInviteEmail(p: NonMemberInviteParams): string {
  const c = NON_MEMBER_EMAIL_COPY;
  return layout(
    c.heading,
    `<p>Hi ${esc(p.contactName || 'there')},</p>
      <p>A member of the Richfield Area Chamber of Commerce, <strong>${esc(p.referrerBusinessName)}</strong>, referred a potential customer to <strong>${esc(p.businessName)}</strong>.</p>
      <p>${esc(c.about)} ${esc(c.details)}</p>
      <p>Learn about joining the chamber to see and follow up on referrals like this.</p>`,
    p.joinUrl,
    c.buttonLabel,
    `${esc(c.contactLine)}<br>${esc(c.optOut)}`
  );
}

export function generateNonMemberInviteEmailText(p: NonMemberInviteParams): string {
  const c = NON_MEMBER_EMAIL_COPY;
  return `Hi ${p.contactName || 'there'},\n\nA member of the Richfield Area Chamber of Commerce, ${p.referrerBusinessName}, referred a potential customer to ${p.businessName}.\n\n${c.about} ${c.details}\n\n${c.buttonLabel}: ${p.joinUrl}\n\n${c.contactLine}\n${c.optOut}`;
}
