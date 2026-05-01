import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SignupVerificationDocument = SignupVerification & Document;

@Schema({ timestamps: true })
export class SignupVerification {
  @Prop({ type: String, required: true, unique: true, index: true })
  email: string;

  @Prop({ type: String, required: true })
  codeHash: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;
}

export const SignupVerificationSchema =
  SchemaFactory.createForClass(SignupVerification);

SignupVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
