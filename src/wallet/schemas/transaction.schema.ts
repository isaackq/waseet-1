import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { TransactionTypeEnum } from '../enums/transaction-type.enum';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { Currency } from './currency.schema';
import { Wallet } from './wallet.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: Wallet.name, index: true, required: true })
  walletId: Types.ObjectId;

  @Prop({ type: String, enum: TransactionTypeEnum, required: true })
  type: TransactionTypeEnum;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: Currency.name, required: true })
  currencyId: Types.ObjectId;

  @Prop({ type: String })
  sessionId?: string;

  @Prop({ type: Types.ObjectId, ref: Wallet.name })
  counterpartyWalletId?: Types.ObjectId;

  @Prop({ type: Number })
  balanceAfterAvailable?: number;

  @Prop({ type: Number })
  balanceAfterHeld?: number;

  @Prop({
    type: String,
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.COMPLETED,
    index: true,
  })
  status: TransactionStatusEnum;

  @Prop({ type: String, index: true })
  idempotencyKey?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
