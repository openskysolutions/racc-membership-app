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
    
    // Log configuration status (without exposing credentials)
    console.log('🔧 Initializing email service...');
    console.log(`   Provider: ${provider}`);
    console.log(`   From: ${this.fromEmail}`);
    
    try {
      switch (provider) {
        case 'gmail':
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Gmail provider selected but EMAIL_USER or EMAIL_PASS not set');
            this.transporter = null;
            return;
          }
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });
          break;

        case 'sendgrid':
          if (!process.env.SENDGRID_API_KEY) {
            console.error('❌ SendGrid provider selected but SENDGRID_API_KEY not set');
            this.transporter = null;
            return;
          }
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });
          break;

        case 'mailgun':
          if (!process.env.MAILGUN_USER || !process.env.MAILGUN_PASS) {
            console.error('❌ Mailgun provider selected but MAILGUN_USER or MAILGUN_PASS not set');
            this.transporter = null;
            return;
          }
          this.transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: process.env.MAILGUN_USER,
              pass: process.env.MAILGUN_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });
          break;

        case 'smtp':
        default:
          if (!process.env.SMTP_HOST) {
            console.error('❌ SMTP provider selected but SMTP_HOST not set');
            this.transporter = null;
            return;
          }
          if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️  SMTP_USER or SMTP_PASS not set - authentication may fail');
          }
          console.log(`   SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}`);
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 15000,      // 15 seconds
            pool: true,                // Use connection pooling
            maxConnections: 5,         // Max 5 concurrent connections
            maxMessages: 100,          // Max 100 messages per connection
            rateDelta: 1000,          // Rate limiting window (1 second)
            rateLimit: 10,             // Max 10 emails per rateDelta
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

      // Add timeout wrapper at the sendMail level as well
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('sendMail timeout after 12 seconds')), 12000)
      );
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ Email sent successfully to ${emailData.to}:`, result.messageId);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send email to ${emailData.to}:`, errorMsg);
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