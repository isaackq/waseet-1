import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IdempotencyRecordDocument = HydratedDocument<IdempotencyRecord>;

@Schema({ timestamps: true, collection: 'wallet_idempotency' })
export class IdempotencyRecord {
  @Prop({ type: String, required: true, unique: true })
  key: string; // e.g., UUID from client

  @Prop({ type: Types.ObjectId, required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: String })
  reason?: string; // 'credit' | 'debit' | 'hold_create' | ...

  @Prop({ type: String })
  amount?: string; // stored as string for traceability (Decimal128 not needed here)
}

export const IdempotencyRecordSchema = SchemaFactory.createForClass(IdempotencyRecord);
