import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Currency } from './currency.schema';
import { HoldStatusEnum } from '../enums/hold-status.enum';
import { Session } from 'src/session/session.schema';

export type HoldDocument = HydratedDocument<Hold>;

@Schema({ timestamps: true })
export class Hold extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true, index: true })
  payerWalletId: Types.ObjectId; // من الذي دَفَع/حُجِز منه

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  payeeWalletId: Types.ObjectId; // إلى من سيُطلق لاحقاً

  @Prop({ type: Number, required: true, min: 1 })
  amount: number; // minor units

  @Prop({ type: Types.ObjectId, ref: Currency.name, required: true })
  currencyId: Types.ObjectId;

  @Prop({
    type: String,
    enum: HoldStatusEnum,
    default: HoldStatusEnum.CREATED,
    index: true,
  })
  status: HoldStatusEnum;

  @Prop({ type: Types.ObjectId, ref: Session.name, required: true }) // اربطه بـ Session تبع Waseet
  sessionId: Types.ObjectId;

  @Prop({ type: String, index: true }) // لمنع التكرار في الطلبات
  idempotencyKey?: string;
}
export const HoldSchema = SchemaFactory.createForClass(Hold);
