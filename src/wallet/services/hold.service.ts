import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHoldRequestDto } from '../dto/hold/request/create-hold.request.dto';
import { UpdateHoldRequestDto } from '../dto/hold/request/update-hold.request.dto';
import { Hold, HoldDocument } from '../schemas/hold.schema';

@Injectable()
export class HoldService {
  constructor(
    @InjectModel(Hold.name)
    private readonly holdModel: Model<HoldDocument>,
  ) {}

  async create(createHoldDto: CreateHoldRequestDto): Promise<HoldDocument> {
    return this.holdModel.create(createHoldDto);
  }

  async findAll(): Promise<HoldDocument[]> {
    return this.holdModel
      .find()
      .sort({ createdAt: -1 })
      .populate('payerWalletId payeeWalletId currencyId sessionId')
      .exec();
  }

  async findOne(id: string): Promise<HoldDocument> {
    const hold = await this.holdModel
      .findById(id)
      .populate('payerWalletId payeeWalletId currencyId sessionId')
      .exec();
    if (!hold) {
      throw new NotFoundException('Hold not found');
    }
    return hold;
  }

  async update(
    id: string,
    updateHoldDto: UpdateHoldRequestDto,
  ): Promise<HoldDocument> {
    const hold = await this.holdModel
      .findByIdAndUpdate(id, updateHoldDto, { new: true })
      .populate('payerWalletId payeeWalletId currencyId sessionId')
      .exec();
    if (!hold) {
      throw new NotFoundException('Hold not found');
    }
    return hold;
  }

  async remove(id: string): Promise<void> {
    const hold = await this.holdModel.findByIdAndDelete(id).exec();
    if (!hold) {
      throw new NotFoundException('Hold not found');
    }
  }
}

