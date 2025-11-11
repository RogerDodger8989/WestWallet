import { Injectable, InternalServerErrorException } from '@nestjs/common';
import SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY saknas i miljövariablerna');
    }
  SendGrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  private async sendMail(to: string, subject: string, html: string) {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@dinapp.se',
      subject,
      html,
    };

    try {
      await SendGrid.send(msg);
    } catch (err) {
      console.error('Fel vid mejlutskick:', err);
      throw new InternalServerErrorException('Kunde inte skicka mejl.');
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Verifiera din e-postadress</h2>
        <p>Tack för att du registrerade dig! Klicka nedan för att bekräfta:</p>
        <p>
          <a href="${verifyUrl}" style="background-color:#4CAF50;color:white;padding:10px 16px;text-decoration:none;border-radius:5px;">
            Verifiera e-post
          </a>
        </p>
        <p>Om knappen inte fungerar, kopiera länken nedan:</p>
        <p style="word-break:break-all;">${verifyUrl}</p>
        <hr/>
        <small>Denna länk är giltig i 24 timmar.</small>
      </div>
    `;

    await this.sendMail(to, 'Verifiera din e-postadress', html);
  }

  async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Återställ ditt lösenord</h2>
        <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>
        <p>
          <a href="${resetUrl}" style="background-color:#007BFF;color:white;padding:10px 16px;text-decoration:none;border-radius:5px;">
            Återställ lösenord
          </a>
        </p>
        <p>Om knappen inte fungerar, använd länken nedan:</p>
        <p style="word-break:break-all;">${resetUrl}</p>
        <hr/>
        <small>Länken är giltig i 15 minuter.</small>
      </div>
    `;

    await this.sendMail(to, 'Återställ ditt lösenord', html);
  }

  async sendNotification(to: string, subject: string, message: string) {
    const html = `<div style="font-family:Arial,sans-serif;"><p>${message}</p></div>`;
    await this.sendMail(to, subject, html);
  }
}
