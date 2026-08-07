import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  accountType: 'organization' | 'individual' | 'employee';
  organizationName?: string;
  organizationId?: mongoose.Types.ObjectId;
  role?: string;
  accessLevel?: 'full' | 'limited';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['organization', 'individual', 'employee'],
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    accessLevel: {
      type: String,
      enum: ['full', 'limited'],
      default: 'limited',
    },
  },
  {
    timestamps: true,
  }
);

// We define the model this way to prevent 'OverwriteModelError' during hot reloads
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
