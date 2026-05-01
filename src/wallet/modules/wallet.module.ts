import { Module } from '@nestjs/common';
import { WalletController } from '../controllers/wallet.controller';
import { TransactionController } from '../controllers/transaction.controller';
import { WalletPaymentController } from '../controllers/wallet-payment.controller';
import { HoldController } from '../controllers/hold.controller';
import { FeeController } from '../controllers/fee.controller';
import { WalletService } from '../services/wallet.service';
import { UserCurrencyService } from '../services/user-currency.service';
import { TransactionService } from '../services/transaction.service';
import { HoldService } from '../services/hold.service';
import { FeeService } from '../services/fee.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from '../schemas/wallet.schema';
import {
  UserCurrency,
  UserCurrencySchema,
} from '../schemas/user-currency.schema';
import { CurrencyModule } from './currency.module';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { Hold, HoldSchema } from '../schemas/hold.schema';
import { Fee, FeeSchema } from '../schemas/fee.schema';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { PaymentProvider } from '../services/payment.provider';
import { WalletPaymentService } from '../services/wallet-payment.service';

@Module({
  imports: [
    CurrencyModule,
    PaginationModule,
    MongooseModule.forFeature([
      {
        name: Wallet.name,
        schema: WalletSchema,
      },
      {
        name: UserCurrency.name,
        schema: UserCurrencySchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: Hold.name,
        schema: HoldSchema,
      },
      {
        name: Fee.name,
        schema: FeeSchema,
      },
    ]),
  ],
  controllers: [
    WalletController,
    TransactionController,
    WalletPaymentController,
    HoldController,
    FeeController,
  ],
  providers: [
    WalletService,
    UserCurrencyService,
    TransactionService,
    HoldService,
    FeeService,
    PaymentProvider,
    WalletPaymentService,
  ],
  exports: [WalletService, UserCurrencyService, TransactionService],
})
export class WalletModule {}
