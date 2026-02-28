import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailerService {
  private createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  async sendInvoice(to: string, subject: string, html: string, pdfBuffer: Buffer, filename: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new ServiceUnavailableException('Brak konfiguracji SMTP.')
    }

    const transporter = this.createTransporter()
    return transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })
  }
}
