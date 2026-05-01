import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CurrencyEnum } from '../enums/currency.enum';
import { CurrencySymbolEnum } from '../enums/currency-symbol.enum';
import { Document, HydratedDocument } from 'mongoose';

export type CurrencyDocument = HydratedDocument<Currency>;

@Schema({ timestamps: true })
export class Currency extends Document {
  @Prop({
    type: String,
    enum: CurrencyEnum,
    maxLength: 3,
    minLength: 3,
    required: true,
    unique: true,
  })
  currencyName: CurrencyEnum;

  @Prop({
    type: String,
    enum: CurrencySymbolEnum,
    required: true,
    unique: true,
  })
  symbol: CurrencySymbolEnum;

  @Prop({ type: Number, default: 2 })
  decimalPlaces: number; // عدد المنازل العشرية

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
