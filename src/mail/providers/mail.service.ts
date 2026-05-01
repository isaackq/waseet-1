import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import { User } from 'src/user/user.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private queueEmail(mailOptions: ISendMailOptions) {
    setImmediate(() => {
      void this.mailerService.sendMail(mailOptions).catch((error: unknown) => {
        const target = Array.isArray(mailOptions.to)
          ? mailOptions.to.join(', ')
          : mailOptions.to;
        const message =
          error instanceof Error ? error.message : 'Unknown mail error';

        this.logger.error(
          `Failed to send email to ${target ?? 'unknown recipient'}: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    });
  }

  sendUserWelcome(user: User): void {
    this.queueEmail({
      to: user.email,
      // override default from
      from: `"Onbaording Team" <${this.configService.get('appConfig.smtpUserName')}>`,
      subject: 'Welcome to Waseet',
      // `.ejs` extension is appended automatically to template
      template: './welcome',
      // Context is available in email template//data to be sent to the template
      context: {
        name: user.firstName,
        email: user.email,
        loginUrl: 'http://localhost:3000/auth/login',
      },
    });
  }

  sendSignupCode(email: string, name: string, code: string): void {
    this.queueEmail({
      to: email,
      from: `"Waseet" <${this.configService.get('appConfig.smtpUserName')}>`,
      subject: 'Your Waseet verification code',
      template: './signup-code',
      context: {
        name,
        code,
      },
    });
  }
}
