/**
 * Email Template: Team Member Invite
 * Sent when a new contact is added to a business via the member portal or admin panel.
 * Invites the recipient to connect / set up their account.
 */

interface InviteEmailParams {
  firstName: string;
  businessName: string;
  connectUrl: string;
}

export function generateInviteEmail(params: InviteEmailParams): string {
  const { firstName, businessName, connectUrl } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been added to ${businessName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #57534e;
            margin: 0;
            padding: 0;
        }

        .email-wrapper {
            width: 100%;
            background-color: #f5f5f4;
            padding: 40px 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: #FFFFFF;
            padding: 40px 30px 0px;
            text-align: center;
        }

        .logo-section {
            margin-bottom: 10px;
        }

        .logo {
            width: auto;
            height: 60px;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 16px 0 0;
            color: #1c1917;
        }

        .content {
            padding: 30px 30px 40px;
        }

        .greeting {
            font-size: 18px;
            color: #78350f;
            margin-bottom: 16px;
            font-weight: 600;
        }

        .message {
            font-size: 16px;
            color: #57534e;
            margin-bottom: 20px;
            line-height: 1.8;
        }

        .business-name {
            font-weight: 700;
            color: #1c1917;
        }

        .cta-container {
            text-align: center;
            margin: 32px 0;
        }

        .cta-button {
            display: inline-block;
            background-color: #b45309;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 16px;
            font-weight: 700;
            padding: 14px 32px;
            border-radius: 8px;
            letter-spacing: 0.5px;
        }

        .cta-hint {
            font-size: 13px;
            color: #78716c;
            margin-top: 12px;
            font-style: italic;
        }

        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e7e5e4, transparent);
            margin: 30px 0;
        }

        .note {
            font-size: 14px;
            color: #78716c;
            line-height: 1.7;
        }

        .footer {
            background-color: #525252;
            padding: 20px;
            text-align: center;
            color: #FFFFFF;
        }

        .footer-brand {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 10px;
        }

        .footer-tagline {
            font-size: 14px;
            margin-bottom: 20px;
            font-style: italic;
        }

        .footer-contact {
            font-size: 13px;
        }

        .footer-contact a {
            color: #eab308;
            text-decoration: none;
            font-weight: 400;
        }

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
            <!-- Header -->
            <div class="header">
                <div class="logo-section">
                    <img src="https://richfieldareachamber.com/assets/racc-logo-BHZqyYn3.png" alt="Richfield Area Chamber of Commerce Logo" class="logo">
                </div>
                <h1>You've been added to<br><span class="business-name">${businessName}</span></h1>
            </div>

            <!-- Content -->
            <div class="content">
                <p class="greeting">Hi ${firstName},</p>

                <p class="message">
                    You've been added as a team member of <span class="business-name">${businessName}</span> in the
                    Richfield Area Chamber of Commerce member portal.
                </p>

                <p class="message">
                    To access the portal — including your business profile, member directory, events, and more —
                    click the button below to connect your account and set a password.
                </p>

                <!-- CTA -->
                <div class="cta-container">
                    <a href="${connectUrl}" class="cta-button">Connect Your Account</a>
                    <p class="cta-hint">This link pre-fills your email address on the account setup page.</p>
                </div>

                <div class="divider"></div>

                <p class="note">
                    If you weren't expecting this invitation or believe it was sent in error, you can safely
                    ignore this email. No account will be created unless you click the button above and
                    complete the setup.
                </p>
            </div>

            <!-- Footer -->
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

export function generateInviteEmailText(params: InviteEmailParams): string {
  const { firstName, businessName, connectUrl } = params;
  return [
    `Hi ${firstName},`,
    '',
    `You've been added as a team member of ${businessName} in the Richfield Area Chamber of Commerce member portal.`,
    '',
    'To access the portal, visit the link below to connect your account and set a password:',
    connectUrl,
    '',
    'If you weren\'t expecting this invitation, you can safely ignore this email.',
    '',
    '— Richfield Area Chamber of Commerce',
  ].join('\n');
}
