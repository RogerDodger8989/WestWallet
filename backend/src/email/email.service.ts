import { Injectable } from '@nestjs/common';
const sgMail = require('@sendgrid/mail');

@Injectable()
export class EmailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY || '';
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY saknas i miljövariabler!');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM || 'no-reply@westwallet.local',
      subject: 'Återställ ditt lösenord',
      text: `Hej! Klicka på länken för att återställa ditt lösenord: ${resetLink}`,
      html: `
        <h1>Återställ ditt lösenord</h1>
        <p>Klicka på länken nedan för att välja ett nytt lösenord:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Om du inte bad om detta kan du ignorera mejlet.</p>
      `,
    };

    try {
      await sgMail.send(msg);
        console.log(`🟢 Återställningsmail skickat till ${email}`);
    } catch (error) {
      console.error(
        '🔴 Fel vid utskick av återställningsmail:',
        error.response?.body || error.message,
      );
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM || 'no-reply@westwallet.local',
      subject: 'Bekräfta din e-postadress',
      text: `Hej! Klicka på länken för att bekräfta din e-postadress: ${verifyLink}`,
      html: `
        <h1>Välkommen till WestWallet</h1>
        <p>Klicka på länken nedan för att bekräfta din e-postadress:</p>
        <a href="${verifyLink}">${verifyLink}</a>
        <p>Om du inte skapade ett konto kan du ignorera mejlet.</p>
      `,
    };

    try {
      await sgMail.send(msg);
        console.log(`🟢 Verifieringsmail skickat till ${email}`);
    } catch (error) {
      console.error(
        '🔴 Fel vid utskick av verifieringsmail:',
        error.response?.body || error.message,
      );
      throw error;
    }
  }
}
