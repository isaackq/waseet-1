import { Global, Module } from '@nestjs/common';
import { MailService } from './providers/mail.service';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Global() //makes the module global //now we can use the mail service in any module without importing it
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService], //() => ({}) means it returns object
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('appConfig.mailHost'),
          secure: false,
          port: 587,
          auth: {
            user: config.get('appConfig.smtpUserName'),
            pass: config.get('appConfig.smtpPassword'),
          },
        },
        default: {
          from: `waseet <${config.get('appConfig.smtpUserName')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'), //__dirname is the current directory
          adapter: new EjsAdapter({
            inlineCssEnabled: true, //enables inline CSS
          }), //EjsAdapter is a template engine
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
