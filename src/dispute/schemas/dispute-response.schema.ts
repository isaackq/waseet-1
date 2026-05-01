import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dispute } from './dispute.schema';
import { User } from 'src/user/user.schema';
import { RolesEnum } from 'src/user/enums/role.enum';

export type DisputeResponseDocument = HydratedDocument<DisputeResponse>;

@Schema({ timestamps: true })
export class DisputeResponse {
  @Prop({ type: Types.ObjectId, ref: Dispute.name, required: true, index: true })
  disputeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: RolesEnum, required: true })
  roleSnapshot: RolesEnum;

  @Prop({ type: String, required: true, maxlength: 2000 })
  message: string;
}

export const DisputeResponseSchema =
  SchemaFactory.createForClass(DisputeResponse);
