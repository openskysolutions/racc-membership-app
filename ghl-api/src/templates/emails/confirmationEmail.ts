/**
 * Email Template: Email Verification
 * Sends a 6-digit confirmation code to verify email address
 */

interface ConfirmationEmailParams {
  code: string;
  recipientEmail?: string;
}

export function generateConfirmationEmail(params: ConfirmationEmailParams): string {
  const { code } = params;
  
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview - Confirmation Code</title>
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
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .content {
            padding: 0 30px 40px ;
        }
        
        .greeting {
            font-size: 18px;
            color: #78350f;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: #57534e;
            margin-bottom: 20px;
            text-align: center;
            line-height: 1.8;
        }
        
        .code-container {
            border: 1px solid #c7c7c7;
            border-radius: 12px;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
        }
        
        .code-label {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
        }
        
        .verification-code {
            font-size: 36px;
            font-weight: 500;
            letter-spacing: 12px;
            margin: 10px 0;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .code-hint {
            font-size: 13px;
            margin-top: 15px;
            font-style: italic;
            text-align: center;
        }
        
        .expiry-notice {
            background-color: #fffae7;
            padding: 10px;
            margin: 30px 0;
            border-radius: 6px;
        }
        
        .expiry-notice p {
            font-size: 14px;
            color: #6e4731;
        }
        
        .expiry-notice strong {
            color: #6e4731;
            font-weight: 700;
        }
        
        .security-warning {
            margin: 30px 0 0;
        }
        
        .security-warning p {
            font-size: 14px;
            color: #6e4731;
        }
        
        .security-warning strong {
            color: #6e4731;
            font-weight: 700;
        }
        
        .security-icon {
            display: inline-block;
            margin-right: 8px;
            font-size: 18px;
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
        
        .footer-contact a:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e7e5e4, transparent);
            margin: 30px 0;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 10px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .verification-code {
                font-size: 32px;
                letter-spacing: 8px;
            }
            
            .code-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container"> 
            <!-- Header -->
            <div class="header">
                <div class="logo-section">
                    <img src="https://members.richfieldareachamber.com/assets/racc-logo-BHZqyYn3.png" alt="Richfield Area Chamber of Commerce Logo" class="logo">
                </div>
                <h1>Welcome</h1>
                <p class="greeting">to Richfield Area Chamber of Commerce!</p>
                
                <p class="message">
                    Thank you for starting your registration with the chamber. To complete your account setup and unlock member benefits, please verify your email address using the code below.
                </p>
                <div class="divider"></div>
            </div>
            <!-- Content -->
            <div class="content">
                <!-- Verification Code -->
                <div class="code-label">Your Verification Code</div>
                <div class="code-container">
                    <div class="verification-code">${code}</div>
                </div>
                <div class="code-hint">Enter this code on the registration page</div>
                
                <!-- Expiry Notice -->
                <div class="expiry-notice">
                    <p>
                        This code will expire in <strong>10 minutes</strong> for your security.<br>
                        If the code expires, you can request a new one on the registration page.
                    </p>
                </div>
                
                <div class="divider"></div>
                
                <p class="message" style="font-size: 14px; color: #78716c;">
                    If you didn't request this verification code, you can safely ignore this email.<br>
                    No account will be created without completing the verification process.
                </p>
                
                <!-- Security Warning -->
                <div class="security-warning">
                    <p>
                        <strong>Security Reminder:</strong> Never share this verification code with anyone. 
                        Richfield Area Chamber staff will <strong>never</strong> ask for your verification code via phone, email, or text message.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-brand">Richfield Area Chamber of Commerce</div>
                <div class="footer-tagline">Supporting local business and community growth</div>
                <div class="footer-contact">
                    Questions? Contact us at <a href="mailto:info@richfieldchamber.com">info@richfieldchamber.com</a><br>
                    Visit us online at <a href="https://richfieldchamber.com">richfieldchamber.com</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Plain text version for email clients that don't support HTML
export function generateConfirmationEmailText(params: ConfirmationEmailParams): string {
  const { code } = params;
  
  return `
VERIFY YOUR EMAIL ADDRESS

Welcome to Richfield Area Chamber of Commerce!

Thank you for starting your registration with the Richfield Area Chamber of Commerce.

Your Verification Code: ${code}

This code will expire in 10 minutes for your security.

Enter this code on the registration page to complete your account setup.

If you didn't request this verification, please ignore this email.

SECURITY REMINDER: Never share this code with anyone. Richfield Area Chamber staff will never ask for your verification code.

---
Richfield Area Chamber of Commerce
Supporting local business and community growth
info@richfieldchamber.com
richfieldchamber.com
`;
}
