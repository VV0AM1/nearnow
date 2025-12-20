"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = class EmailService {
    transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    async sendOtp(email, otp) {
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
        await this.sendMail(mailOptions);
    }
    async sendWelcome(email, name) {
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
                      <a href="http://localhost:3000" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
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
    async sendMail(mailOptions) {
        try {
            if (!process.env.EMAIL_USER) {
                console.log(`[DEV MODE] Email skipped (no creds). Details:`, mailOptions.to, mailOptions.subject);
                return;
            }
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${mailOptions.to}`);
        }
        catch (error) {
            console.error('Error sending email:', error);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map