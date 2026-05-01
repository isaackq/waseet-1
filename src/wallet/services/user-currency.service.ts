import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserCurrency,
  UserCurrencyDocument,
} from '../schemas/user-currency.schema';
import { CurrencyService } from './currency.service';
import { CurrencyEnum } from '../enums/currency.enum';

@Injectable()
export class UserCurrencyService {
  constructor(
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    private readonly currencyService: CurrencyService,
  ) {}

  async createUSDAccount(userId: string) {
    const existingUserCurrency = await this.userCurrencyModel.findOne({
      userId: userId,
    });

    if (existingUserCurrency) {
      if (existingUserCurrency.userId.toString() === userId) {
        throw new BadRequestException(
          'User already has an account with this currency',
        );
      }
    }

    const currency = await this.currencyService.findByName(CurrencyEnum.USD);

    const userCurrency = await this.userCurrencyModel.create({
      userId: userId,
      currencyId: currency.id,
    });

    return userCurrency;
  }

  async findByUserIdAndCurrencyId(userId: string, currencyId: string) {
    return this.userCurrencyModel.findOne({
      userId: userId,
      currencyId: currencyId,
    });
  }
}
