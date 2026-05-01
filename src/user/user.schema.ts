import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { RolesEnum } from './enums/role.enum';

export type UserDocument = HydratedDocument<User>; // تعني اضافة خصائص مونقوس  الى الكلاس العادي زي اليوزر يعني لما اعرف مت غير بهادا النوع بتظهر الي خصائص مونقوس

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  middleName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true, unique: true })
  identificationName: string;

  @Prop({
    type: [String],
    enum: Object.values(RolesEnum),
    required: true,
    default: [RolesEnum.USER],
  })
  role: RolesEnum[];

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true, unique: true })
  phoneNumber: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, default: null })
  profileImage: string | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  tokenVersion: number;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Boolean, default: false })
  rememberMe: boolean;

  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpiresAt: Date | null;

  @Prop({ type: Date, required: true })
  birthday: Date;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  countryCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
