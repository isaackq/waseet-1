import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Currency } from './currency.schema';
import { User } from 'src/user/user.schema';

export type UserCurrencyDocument = HydratedDocument<UserCurrency>;

@Schema({ timestamps: true })
export class UserCurrency extends Document {
  @Prop({ type: Types.ObjectId, ref: Currency.name, required: true })
  currencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  // @Prop({ type: Boolean , required: true })
  // isActive: boolean;
}

export const UserCurrencySchema = SchemaFactory.createForClass(UserCurrency);
