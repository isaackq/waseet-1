import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserCurrency, UserCurrencySchema } from '../schemas/user-currency.schema';
import { UserCurrencyService } from '../services/user-currency.service';
import { CurrencyModule } from './currency.module';

@Module({
  imports: [
    CurrencyModule,
    MongooseModule.forFeature([
      {
        name: UserCurrency.name,
        schema: UserCurrencySchema,
      },
    ]),
  ],
  providers: [UserCurrencyService],
  exports: [],
})
export class UserCurrencyModule {}
