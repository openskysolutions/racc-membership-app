/**
 * Email Service for sending confirmat        case 'gmail':
          this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
            // Add timeout settings for Gmail
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000,   // 30 seconds
            socketTimeout: 60000,     // 60 seconds
          });s and other transactional emails
 * Supports multiple email providers (Gmail, SendGrid, Mailgun, etc.)
 */

import nodemailer from 'nodemailer';

interface EmailConfig {
  provider: 'gmail' | 'sendgrid' | 'mailgun' | 'smtp';
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user?: string;
    pass?: string;
    api_key?: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@racc.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Richfield Area Chamber of Commerce';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const provider = process.env.EMAIL_PROVIDER as EmailConfig['provider'] || 'smtp';
    
    try {
      switch (provider) {
        case 'gmail':
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
          });
          break;

        case 'sendgrid':
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY,
            },
          });
          break;

        case 'mailgun':
          this.transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: process.env.MAILGUN_USER,
              pass: process.env.MAILGUN_PASS,
            },
          });
          break;

        case 'smtp':
        default:
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          break;
      }

      console.log(`📧 Email service initialized with provider: ${provider}`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${emailData.to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  async sendConfirmationCode(email: string, code: string): Promise<boolean> {
    const subject = 'Verify Your Email - RACC Membership Portal';
    const html = this.generateConfirmationEmailHtml(code);
    
    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private generateConfirmationEmailHtml(code: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-top: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            max-width: 200px;
            height: auto;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
            border: 2px dashed #2563eb;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            text-align: center;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email Address</h1>
        </div>
        
        <div class="message">
            <p>Thank you for starting your registration with the Richfield Area Chamber of Commerce!</p>
            <p>To complete your account setup, please enter the verification code below:</p>
        </div>
        
        <div class="verification-code">
            ${code}
        </div>
        
        <div class="message">
            <p>This code will expire in <strong>10 minutes</strong> for your security.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        
        <div class="warning">
            <strong>Security Note:</strong> Never share this code with anyone. RACC staff will never ask for your verification code.
        </div>
        
        <div class="footer">
            <p>
                <strong>Richfield Area Chamber of Commerce</strong><br>
                Supporting local business and community growth<br>
                <a href="mailto:info@richfieldchamber.com">info@richfieldchamber.com</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();