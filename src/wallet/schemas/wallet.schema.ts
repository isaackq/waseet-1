import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { Decimal128, HydratedDocument } from 'mongoose';

import { UserCurrency } from './user-currency.schema';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: UserCurrency.name,
    required: true,
    unique: true,
  })
  userCurrencyId: Types.ObjectId;

  @Prop({ type: Types.Decimal128, default: 0 })
  totalBalance: Decimal128;

  @Prop({ type: Types.Decimal128, default: 0 }) // استخدم minor units (cents/sats)
  available: Decimal128;

  @Prop({ type: Types.Decimal128, default: 0 })
  held: Decimal128;

  @Prop({ type: Boolean, required: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const WalletSchema = SchemaFactory.createForClass(Wallet);
