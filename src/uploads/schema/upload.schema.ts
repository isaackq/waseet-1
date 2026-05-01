import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { fileTypesEnum } from '../enums/file-type.enum';

export type UploadDocument = HydratedDocument<Upload>;

@Schema({ timestamps: true })
export class Upload extends Document {
  @Prop({ type: String, required: true, maxlength: 1024 })
  name: string;

  @Prop({ type: String, required: true, maxlength: 1024 })
  path: string;

  @Prop({
    type: String,
    enum: fileTypesEnum,
    required: true,
    default: fileTypesEnum.IMAGE,
  })
  type: fileTypesEnum;

  @Prop({ type: String, required: true, maxlength: 128 })
  mime: string;

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);
