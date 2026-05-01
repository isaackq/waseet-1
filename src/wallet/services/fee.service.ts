import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeeRequestDto } from '../dto/fee/request/create-fee.request.dto';
import { UpdateFeeRequestDto } from '../dto/fee/request/update-fee.request.dto';
import { Fee, FeeDocument } from '../schemas/fee.schema';

@Injectable()
export class FeeService {
  constructor(
    @InjectModel(Fee.name)
    private readonly feeModel: Model<FeeDocument>,
  ) {}

  async create(createFeeDto: CreateFeeRequestDto): Promise<FeeDocument> {
    return this.feeModel.create(createFeeDto);
  }

  async findAll(): Promise<FeeDocument[]> {
    return this.feeModel
      .find()
      .sort({ createdAt: -1 })
      .populate('sessionId userWalletId currencyId')
      .exec();
  }

  async findOne(id: string): Promise<FeeDocument> {
    const fee = await this.feeModel
      .findById(id)
      .populate('sessionId userWalletId currencyId')
      .exec();
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
    return fee;
  }

  async update(id: string, updateFeeDto: UpdateFeeRequestDto): Promise<FeeDocument> {
    const fee = await this.feeModel
      .findByIdAndUpdate(id, updateFeeDto, { new: true })
      .populate('sessionId userWalletId currencyId')
      .exec();
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
    return fee;
  }

  async remove(id: string): Promise<void> {
    const fee = await this.feeModel.findByIdAndDelete(id).exec();
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
  }
}

