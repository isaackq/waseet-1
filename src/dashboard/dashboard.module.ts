import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Session, SessionSchema } from 'src/session/session.schema';
import { UserCurrency, UserCurrencySchema } from 'src/wallet/schemas/user-currency.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { Transaction, TransactionSchema } from 'src/wallet/schemas/transaction.schema';
import { User, UserSchema } from 'src/user/user.schema';
import { AdminDashboardController } from './admin-dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: UserCurrency.name, schema: UserCurrencySchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController, AdminDashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
