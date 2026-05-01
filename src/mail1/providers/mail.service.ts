import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, readFile } from 'fs/promises';
import { join } from 'path';
import { Resend } from 'resend';
import { User } from 'src/user/user.schema';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendUserWelcome(user: User): Promise<void> {
    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Waseet',
      html: await this.renderTemplate('welcome.ejs', {
        name: user.firstName,
        email: user.email,
        loginUrl: 'http://localhost:3000/auth/login',
      }),
      text: `Welcome to Waseet, ${user.firstName}. Login here: http://localhost:3000/auth/login`,
    });
  }

  async sendSignupCode(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Waseet verification code',
      text: `Hello ${name}, your Waseet verification code is ${code}.`,
      html: await this.renderTemplate('signup-code.ejs', {
        name,
        code,
      }),
    });
  }

  async sendSessionInvitation(input: {
    clientEmail: string;
    clientName: string;
    freelancerName: string;
    freelancerEmail: string;
    freelancerPhone: string;
    joinCode: string;
    joinUrl: string;
    projectTitle: string;
    projectDescription: string;
    deadline: string;
  }): Promise<void> {
    await this.sendEmail({
      to: input.clientEmail,
      subject: `Your Waseet join code for "${input.projectTitle}"`,
      text:
        `Hello ${input.clientName}, ` +
        `you have been invited to a Waseet session by ${input.freelancerName}. ` +
        `Join code: ${input.joinCode}. Join here: ${input.joinUrl}. ` +
        `Freelancer email: ${input.freelancerEmail}. Freelancer phone: ${input.freelancerPhone}. ` +
        `Deadline: ${input.deadline}.`,
      html: await this.renderTemplate('session-invitation.ejs', {
        clientName: input.clientName,
        freelancerName: input.freelancerName,
        freelancerEmail: input.freelancerEmail,
        freelancerPhone: input.freelancerPhone,
        joinCode: input.joinCode,
        joinUrl: input.joinUrl,
        projectTitle: input.projectTitle,
        projectDescription: input.projectDescription,
        deadline: input.deadline,
      }),
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset your account password',
      text: `Hello ${name}, use this link to reset your password: ${resetUrl}`,
      html: await this.renderTemplate('reset-password.ejs', {
        name,
        resetUrl,
      }),
    });
  }

  private async sendEmail(input: SendEmailInput): Promise<void> {
    const apiKey = this.getResendApiKey();
    const fromEmail = this.configService.get<string>(
      'appConfig.resendFromEmail',
    );

    if (!fromEmail) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL is not configured',
      );
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `"Waseet Team" <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (!error) {
      this.logger.log(`Email sent to ${input.to}`);
      return;
    }

    throw new BadGatewayException(`Resend send failed: ${error.message}`);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async renderTemplate(
    fileName: string,
    context: Record<string, string>,
  ): Promise<string> {
    const templatePath = await this.resolveTemplatePath(fileName);
    const template = await readFile(templatePath, 'utf8');

    return Object.entries(context).reduce(
      (compiled, [key, value]) =>
        compiled.replace(
          new RegExp(`<%=\\s*${key}\\s*%>`, 'g'),
          this.escapeHtml(value),
        ),
      template,
    );
  }

  private async resolveTemplatePath(fileName: string): Promise<string> {
    const candidates = [
      join(__dirname, '..', 'templates', fileName),
      join(process.cwd(), 'src', 'mail1', 'templates', fileName),
    ];

    for (const candidate of candidates) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    throw new InternalServerErrorException(
      `Mail template not found: ${fileName}`,
    );
  }

  private getResendApiKey(): string {
    const apiKey = this.configService.get<string>('appConfig.resendApiKey');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY is not configured',
      );
    }
    return apiKey;
  }
}
