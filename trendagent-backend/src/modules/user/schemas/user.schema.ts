import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  password!: string | null;

  @Prop({ type: String, enum: ['local', 'google'], default: 'local' })
  provider!: 'local' | 'google';

  @Prop({ type: String, default: null })
  googleId!: string | null;

  @Prop({ type: String, default: null })
  refreshToken!: string | null;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String, default: null })
  otp!: string | null;

  @Prop({ type: Date, default: null })
  otpExpiresAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
