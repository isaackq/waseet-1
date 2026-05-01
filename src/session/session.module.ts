import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { SessionService } from './session.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './session.schema';
import { SessionController } from './session.controller';
import { WalletModule } from 'src/wallet/modules/wallet.module';
import { CurrencyModule } from 'src/wallet/modules/currency.module';
import { Hold, HoldSchema } from 'src/wallet/schemas/hold.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/wallet/schemas/transaction.schema';
import { Fee, FeeSchema } from 'src/wallet/schemas/fee.schema';
import { SessionCronService } from './session-cron.service';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import {
  Deliverable,
  DeliverableSchema,
} from 'src/deliverable/deliverable.schema';
import {
  SessionIdempotencyRecord,
  SessionIdempotencySchema,
} from './session-idempotency.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import {
  UserCurrency,
  UserCurrencySchema,
} from 'src/wallet/schemas/user-currency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
      {
        name: Hold.name,
        schema: HoldSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: Fee.name,
        schema: FeeSchema,
      },
      {
        name: Deliverable.name,
        schema: DeliverableSchema,
      },
      {
        name: SessionIdempotencyRecord.name,
        schema: SessionIdempotencySchema,
      },
      {
        name: Wallet.name,
        schema: WalletSchema,
      },
      {
        name: UserCurrency.name,
        schema: UserCurrencySchema,
      },
    ]),
    UserModule,
    WalletModule,
    CurrencyModule,
    PaginationModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionCronService],
  exports: [SessionService],
})
export class SessionModule {}
