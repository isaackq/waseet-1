import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, type WalletDocument } from '../schemas/wallet.schema';
import {
  UserCurrency,
  UserCurrencyDocument,
} from '../schemas/user-currency.schema';
import { CurrencyDocument } from '../schemas/currency.schema';
import { CurrencyEnum } from '../enums/currency.enum';
import { CurrencyService } from './currency.service';
import { toNumber } from 'src/utils/number.helpers';

type Decimalish = string | number;

function toD128(n: Decimalish): Types.Decimal128 {
  if (typeof n === 'number' && !Number.isFinite(n)) {
    throw new BadRequestException('Amount must be a finite number');
  }
  return Types.Decimal128.fromString(String(n));
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    private readonly currencyService: CurrencyService,
  ) {}

  /** Create once per userCurrencyId */
  async create(userCurrencyId: string): Promise<WalletDocument> {
    const exists = await this.walletModel.findOne({ userCurrencyId });
    if (exists) {
      throw new ConflictException(
        'Wallet already exists for this userCurrencyId',
      );
    }
    const walletDocument = await this.walletModel.create({
      userCurrencyId: userCurrencyId,
      totalBalance: toD128(0),
      available: toD128(0),
      held: toD128(0),
      isActive: true,
    });
    return walletDocument;
  }

  async findOne(id: string): Promise<WalletDocument> {
    const doc = await this.walletModel.findById(id).lean<WalletDocument>();
    if (!doc) throw new NotFoundException('Wallet not found');
    return doc;
  }

  async findByUserCurrencyId(
    userCurrencyId: string,
  ): Promise<WalletDocument | null> {
    const doc = await this.walletModel
      .findOne({ userCurrencyId })
      .lean<WalletDocument>();
    if (!doc) {
      return null;
    }
    return doc;
  }

  async findDocumentByUserCurrencyId(
    userCurrencyId: string,
  ): Promise<WalletDocument | null> {
    return this.walletModel.findOne({ userCurrencyId });
  }

  async findAll(activeOnly = false): Promise<WalletDocument[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return await this.walletModel.find(filter).lean<WalletDocument[]>();
  }

  async setActive(id: string, isActive: boolean): Promise<WalletDocument> {
    const doc = await this.walletModel
      .findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
      .lean<WalletDocument>();
    if (!doc) throw new NotFoundException('Wallet not found');
    return doc;
  }

  async resolveWalletByUserAndCurrency(
    userId: string,
    currency: CurrencyEnum = CurrencyEnum.USD,
  ): Promise<{
    wallet: WalletDocument;
    currencyDocument: CurrencyDocument;
  }> {
    const currencyDocument = await this.currencyService.findByName(currency);

    const userCurrency = await this.userCurrencyModel.findOne({
      userId: userId,
      currencyId: currencyDocument.id,
    });

    if (!userCurrency) {
      throw new NotFoundException(`Wallet currency ${currency} not found`);
    }

    const wallet = await this.walletModel.findOne({
      userCurrencyId: userCurrency.id,
    });

    if (!wallet || !wallet.isActive) {
      throw new NotFoundException('Wallet not found or inactive');
    }

    return { wallet, currencyDocument };
  }

  async getWalletOverview(
    userId: string,
    currency: CurrencyEnum = CurrencyEnum.USD,
  ) {
    const { wallet, currencyDocument } =
      await this.resolveWalletByUserAndCurrency(userId, currency);

    return {
      walletId: wallet.id,
      currency: currencyDocument.currencyName,
      symbol: currencyDocument.symbol,
      decimalPlaces: currencyDocument.decimalPlaces,
      totalBalance: toNumber(wallet.totalBalance),
      hold: toNumber(wallet.held),
      available: toNumber(wallet.available),
      updatedAt: wallet.updatedAt,
    };
  }
}
