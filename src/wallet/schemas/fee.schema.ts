import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Currency } from './currency.schema';
import { Session } from 'src/session/session.schema';
import { FeeStatusEnum } from '../enums/fee-status.enum';

export type FeeDocument = HydratedDocument<Fee>;

@Schema({ timestamps: true })
export class Fee extends Document {
  @Prop({ type: Types.ObjectId, ref: Session.name, required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  userWalletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Currency.name, required: true })
  currencyId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  percentage: number;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    enum: FeeStatusEnum,
    default: FeeStatusEnum.PENDING,
  })
  status: FeeStatusEnum;
}

export const FeeSchema = SchemaFactory.createForClass(Fee);
