import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  accountType: 'organization' | 'individual';
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
      enum: ['organization', 'individual'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// We define the model this way to prevent 'OverwriteModelError' during hot reloads
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
