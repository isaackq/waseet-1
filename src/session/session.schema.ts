import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { Decimal128 } from 'mongoose';
import { SessionStatus } from './enums/session-status.enum';
import { RolesEnum } from 'src/user/enums/role.enum';
import { OperationType } from './enums/operation-type.enum';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';
import { User } from 'src/user/user.schema';
import { DeliverableType } from 'src/deliverable/enums/deliverable-type.enum';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  user1: Types.ObjectId; // starter user id

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  user2: Types.ObjectId; // second user id (joined later)

  @Prop({ enum: OperationType, required: true })
  operationType: OperationType;

  @Prop({ enum: RolesEnum, required: true })
  starterRole: RolesEnum;

  @Prop({ enum: SessionStatus, default: SessionStatus.CREATED })
  status: SessionStatus;

  @Prop({ type: Date, required: true })
  deadline: Date;

  @Prop({ type: Number, default: 0 })
  duration: number; // minutes

  @Prop({ type: Types.Decimal128, default: 0 })
  amount: Decimal128;

  @Prop({ type: String, enum: CurrencyEnum, default: CurrencyEnum.USD })
  currency: CurrencyEnum;

  @Prop({ type: String, required: true, maxlength: 500 })
  title: string;

  @Prop({ type: String, required: true, maxlength: 2000 })
  description: string;

  @Prop({ type: String, enum: DeliverableType, required: true })
  deliverableType: DeliverableType;

  @Prop({ type: String, length: 6, unique: true, required: true })
  joinCode: string;

  @Prop({ type: String, required: true })
  joinUrl: string;

  @Prop({ type: Date, default: null })
  confirmedAt?: Date;

  @Prop({ type: Date })
  joinExpiresAt?: Date; // When the join code expires (1 hour after creation)

  @Prop({ type: Date })
  joinedAt?: Date; // When user2 actually joined

  @Prop({ type: Date, default: null })
  releasedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
