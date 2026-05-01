import {
  Module,
  Global,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';

import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/modules/wallet.module';
import { CurrencyModule } from './wallet/modules/currency.module';
import { UserCurrencyModule } from './wallet/modules/user-currency.module';
import { SessionModule } from './session/session.module';

import { TokenGuard } from './guards/token.guard';
import { IdempotencyKeyGeneratorTsMiddleware } from './middleware/idempotency-key-generator.ts.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { DeliverableModule } from './deliverable/deliverable.module';
import { MailModule } from './mail1/mail.module';
import appConfig from './config/app.config';
import paymentConfig from './config/payment.config';
import { PaginationModule } from './common/pagination/pagination.module';
import { StripeModule } from './wallet/modules/stripe.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DisputeModule } from './dispute/dispute.module';

const ENV = process.env.NODE_ENV;

@Global()
@Module({
  imports: [
    UserModule,
    SessionModule,
    WalletModule,
    DashboardModule,
    DisputeModule,
    CurrencyModule,
    UserCurrencyModule,
    DeliverableModule,
    MailModule,
    PaginationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [jwtConfig, appConfig, paymentConfig, databaseConfig],
    }),
    StripeModule.forRoot(process.env.STRIPE_API_KEY as string, {
      apiVersion: '2026-02-25.clover',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.url'),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: TokenGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyKeyGeneratorTsMiddleware)
      .forRoutes({ path: 'users/create', method: RequestMethod.POST });
  }
}
