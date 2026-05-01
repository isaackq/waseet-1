import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Session, SessionSchema } from 'src/session/session.schema';
import { UserCurrency, UserCurrencySchema } from 'src/wallet/schemas/user-currency.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { Transaction, TransactionSchema } from 'src/wallet/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: UserCurrency.name, schema: UserCurrencySchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

