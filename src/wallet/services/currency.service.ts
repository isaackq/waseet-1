import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Currency, CurrencyDocument } from '../schemas/currency.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CurrencyRequestDto } from '../dto/currency/request/currency-request.dto';
import { CurrencyEnum } from '../enums/currency.enum';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
  ) {}

  async createCurrency(
    currencyRequestDto: CurrencyRequestDto,
  ): Promise<CurrencyDocument> {
    const existingCurrency = await this.currencyModel.findOne({
      $or: [
        { currencyName: currencyRequestDto.currencyName },
        { symbol: currencyRequestDto.symbol },
      ],
    });

    if (existingCurrency) {
      if (existingCurrency.currencyName === currencyRequestDto.currencyName) {
        throw new BadRequestException('Currency name already exists');
      }
      if (currencyRequestDto.symbol === currencyRequestDto.symbol) {
        throw new BadRequestException('symbol already used');
      }
    }

    const currencyDocument = await this.currencyModel.create({
      ...currencyRequestDto,
      isActive: true,
    });

    return currencyDocument;
  }

  async findOne(id: string): Promise<CurrencyDocument> {
    const currencyDocument = await this.currencyModel.findById(id);
    if (!currencyDocument) {
      throw new NotFoundException('Currency not found');
    }
    return currencyDocument;
  }

  async findByName(currencyEnum: CurrencyEnum): Promise<CurrencyDocument> {
    const currencyDocument = await this.currencyModel.find({
      currencyName: currencyEnum,
    });
    if (!currencyDocument) {
      throw new NotFoundException('Currency not found');
    }
    return currencyDocument[0];
  }

  async findAll(): Promise<CurrencyDocument[]> {
    const currencyDocuments = await this.currencyModel.find();
    return currencyDocuments;
  }

  async update(id: string, currencyRequestDto: CurrencyRequestDto) {}
}
