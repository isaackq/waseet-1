import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DeliverableType } from 'src/deliverable/enums/deliverable-type.enum';
import { Upload } from 'src/uploads/schema/upload.schema';
import { User } from 'src/user/user.schema';
import { Dispute } from './dispute.schema';

export type DisputeEvidenceDocument = HydratedDocument<DisputeEvidence>;

@Schema({ timestamps: true })
export class DisputeEvidence {
  @Prop({ type: Types.ObjectId, ref: Dispute.name, required: true, index: true })
  disputeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  submittedByUserId: Types.ObjectId;

  @Prop({ type: String, enum: DeliverableType, required: true })
  type: DeliverableType;

  @Prop({ type: String, required: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, required: true, maxlength: 1000 })
  description: string;

  @Prop({ type: Types.ObjectId, ref: Upload.name, required: false })
  uploadId?: Types.ObjectId;
}

export const DisputeEvidenceSchema =
  SchemaFactory.createForClass(DisputeEvidence);
