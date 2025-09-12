// src/mailer/resend.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async enviarCorreoRecuperacion(destinatario: string, token: string) {
    const resetUrl = `${process.env.APP_FRONTEND_URL}/reset-password/${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: destinatario,
      subject: 'Recuperación de contraseña',
      html: `
        <p>Hola,</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Si no solicitaste esto, puedes ignorar este correo.</p>
      `,
    });
  }
}


