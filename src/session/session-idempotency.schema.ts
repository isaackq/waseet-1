import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionIdempotencyDocument =
  HydratedDocument<SessionIdempotencyRecord>;

export enum SessionIdempotencyAction {
  CONFIRM_PAYMENT = 'confirm_payment',
  COMPLETE_SESSION = 'complete_session',
}

export enum SessionIdempotencyStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true, collection: 'session_idempotency' })
export class SessionIdempotencyRecord {
  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SessionIdempotencyAction),
  })
  action: SessionIdempotencyAction;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  sessionId: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SessionIdempotencyStatus),
    default: SessionIdempotencyStatus.PROCESSING,
  })
  status: SessionIdempotencyStatus;

  @Prop({ type: Number })
  statusCode?: number;

  @Prop({ type: Object })
  responseBody?: Record<string, unknown>;

  @Prop({ type: String })
  errorMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SessionIdempotencySchema = SchemaFactory.createForClass(
  SessionIdempotencyRecord,
);
