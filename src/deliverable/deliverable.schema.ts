import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { DeliverableStatus } from './enums/deliverable-status.enum';
import { DeliverableType } from './enums/deliverable-type.enum';
import { Session } from 'src/session/session.schema';
import { User } from 'src/user/user.schema';
import { Upload } from 'src/uploads/schema/upload.schema';

export type DeliverableDocument = HydratedDocument<Deliverable>;

@Schema({ timestamps: true })
export class Deliverable extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: Session.name,
    required: true,
    index: true,
  })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  uploadedBy: Types.ObjectId; // Freelancer who uploaded

  @Prop({ type: String, required: true, maxlength: 200 })
  name: string; // Deliverable name

  @Prop({ type: String, maxlength: 1000 })
  description?: string;

  @Prop({ type: String, enum: DeliverableType, required: true })
  type: DeliverableType;

  @Prop({ type: Types.ObjectId, ref: Upload.name, required: false })
  uploadId?: Types.ObjectId; // For FILE type deliverables

  @Prop({ type: String }) // For LINK type deliverables
  linkUrl?: string;

  @Prop({
    type: String,
    enum: DeliverableStatus,
    default: DeliverableStatus.PENDING,
    index: true,
  })
  status: DeliverableStatus;

  @Prop({ type: String, maxlength: 1000 })
  revisionNotes?: string; // Client's feedback for revision

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date })
  revisionRequestedAt?: Date;

  @Prop({ type: Date })
  disputedAt?: Date;
}

export const DeliverableSchema = SchemaFactory.createForClass(Deliverable);
