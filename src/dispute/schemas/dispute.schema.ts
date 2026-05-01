import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Deliverable } from 'src/deliverable/deliverable.schema';
import { Session } from 'src/session/session.schema';
import { User } from 'src/user/user.schema';
import { DisputeStatus } from '../enums/dispute-status.enum';

export type DisputeDocument = HydratedDocument<Dispute>;

@Schema({ timestamps: true })
export class Dispute {
  @Prop({ type: Types.ObjectId, ref: Session.name, required: true, index: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Deliverable.name, required: false })
  deliverableId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  openedByUserId: Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 1000 })
  reason: string;

  @Prop({
    type: String,
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
    index: true,
  })
  status: DisputeStatus;

  @Prop({ type: Date, default: null })
  requestedAdminReviewAt?: Date | null;

  @Prop({ type: String, maxlength: 2000, default: null })
  adminDecision?: string | null;

  @Prop({ type: String, maxlength: 2000, default: null })
  resolution?: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt?: Date | null;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
