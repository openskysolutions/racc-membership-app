/**
 * Email Service for sending confirmation emails and other transactional emails
 * Supports multiple email providers (Gmail, SendGrid, Mailgun, etc.)
 */

import nodemailer from 'nodemailer';
import { generateConfirmationEmail, generateConfirmationEmailText } from '@/templates/emails';

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
    const html = generateConfirmationEmail({ code, recipientEmail: email });
    const text = generateConfirmationEmailText({ code, recipientEmail: email });
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
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