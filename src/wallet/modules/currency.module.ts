import { Module } from '@nestjs/common';
import { CurrencyController } from '../controllers/currency.controller';
import { CurrencyService } from '../services/currency.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Currency, CurrencySchema } from '../schemas/currency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Currency.name,
        schema: CurrencySchema,
      },
    ]),
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
