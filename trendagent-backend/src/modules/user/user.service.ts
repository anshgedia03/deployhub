import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

type NullableUser = UserDocument | null;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<NullableUser> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<NullableUser> {
    return await this.userModel.findById(id).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
  ): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { googleId, provider: 'google' },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async updateRefreshToken(
    userId: string,
    hashedToken: string | null,
  ): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { refreshToken: hashedToken },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async saveOtp(
    userId: string,
    hashedOtp: string,
    expiresAt: Date,
  ): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { otp: hashedOtp, otpExpiresAt: expiresAt },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async markVerified(userId: string): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { isVerified: true, otp: null, otpExpiresAt: null },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async clearOtp(userId: string): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { otp: null, otpExpiresAt: null },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<NullableUser> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }
}
