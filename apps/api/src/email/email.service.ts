import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly configured = Boolean(
    process.env.EMAIL_USER && process.env.EMAIL_PASS,
  );
  private readonly webAppUrl =
    process.env.WEB_APP_URL || 'http://localhost:3000';

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Sends a one-time code. Throws ServiceUnavailableException when delivery fails so the
   * caller never tells the user "code sent" when it was not. Outside production, when no
   * mail credentials are configured, the code is written to the server log instead.
   */
  async sendOtp(email: string, otp: string) {
    if (!this.configured) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'Email delivery is not configured (EMAIL_USER/EMAIL_PASS); cannot send verification code',
        );
        throw new ServiceUnavailableException(
          'Email delivery is temporarily unavailable. Please try again later.',
        );
      }
      this.logger.warn(`[DEV ONLY] Verification code for ${email}: ${otp}`);
      return;
    }
    const mailOptions = {
      from: '"NearNow Security" <no-reply@nearnow.app>',
      to: email,
      subject: 'Your Verification Code',
      text: `Your validation code is ${otp}. It expires in 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  <!-- Header -->
                  <div style="background-color: #2563eb; padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">NearNow</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 40px 32px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 20px; text-align: center;">Verify Your Identity</h2>
                    <p style="color: #64748b; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                      Use the code below to complete your sign-in process. This code is valid for 10 minutes.
                    </p>
                    
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</span>
                    </div>
                    
                    <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} NearNow. All rights reserved.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(
        `Verification email delivery failed: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'We could not send the verification email. Please try again.',
      );
    }
  }

  async sendWelcome(email: string, rawName: string) {
    const name = escapeHtml(rawName);
    const mailOptions = {
      from: '"NearNow Community" <no-reply@nearnow.app>',
      to: email,
      subject: 'Welcome to the Neighborhood! 🏡',
      text: `Welcome to NearNow, ${name}! We're excited to have you join your local community.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to NearNow</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 48px 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Welcome Home!</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 40px 32px;">
                    <p style="color: #64748b; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 0 0 32px;">
                      Welcome to <strong>NearNow</strong>! You've just joined a community of neighbors looking out for one another. 
                      From lost pets to local events, everything happening around you is now at your fingertips.
                    </p>
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${escapeHtml(this.webAppUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                        Explore Your Neighborhood
                      </a>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} NearNow. Connect with your community.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await this.sendMail(mailOptions);
  }

  /** Best-effort delivery for non-critical mail (welcome). Never throws. */
  private async sendMail(mailOptions: nodemailer.SendMailOptions) {
    if (!this.configured) return;
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.warn(
        `Optional email delivery failed: ${(error as Error).message}`,
      );
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
