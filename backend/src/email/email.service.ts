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

  // 🔹 Hjälpfunktion för att skicka mejl
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
      console.error('Fel vid utskick av mejl:', err);
      throw new InternalServerErrorException('Misslyckades med att skicka mejl.');
    }
  }

  // 🔹 Skicka verifieringsmejl (uppdaterad till GET-länk)
  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Verifiera din e-postadress</h2>
        <p>Tack för att du registrerade dig! Klicka på länken nedan för att verifiera din e-postadress:</p>
        <p>
          <a href="${verifyUrl}" 
             style="background-color: #4CAF50; color: white; padding: 10px 16px; text-decoration: none; border-radius: 5px;">
             Verifiera e-post
          </a>
        </p>
        <p>Om knappen inte fungerar, kopiera länken nedan och klistra in i din webbläsare:</p>
        <p style="word-break: break-all;">${verifyUrl}</p>
        <hr />
        <p style="font-size: 12px; color: gray;">Den här länken är giltig i 24 timmar.</p>
      </div>
    `;

    await this.sendMail(to, 'Verifiera din e-postadress', html);
  }

  // 🔹 Skicka återställningsmejl
  async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Återställ ditt lösenord</h2>
        <p>Klicka på länken nedan för att återställa ditt lösenord:</p>
        <p>
          <a href="${resetUrl}" 
             style="background-color: #007BFF; color: white; padding: 10px 16px; text-decoration: none; border-radius: 5px;">
             Återställ lösenord
          </a>
        </p>
        <p>Om knappen inte fungerar, kopiera länken nedan och klistra in i din webbläsare:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <hr />
        <p style="font-size: 12px; color: gray;">Länken är giltig i 15 minuter.</p>
      </div>
    `;

    await this.sendMail(to, 'Återställ ditt lösenord', html);
  }

  // 🔹 Skicka enkel notifiering (ex. till admin)
  async sendNotification(to: string, subject: string, message: string) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>${message}</p>
      </div>
    `;

    await this.sendMail(to, subject, html);
  }
}
