import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select('-password -refreshToken -otp')
      .exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateRefreshToken(userId: string, hashedToken: string | null) {
    return this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedToken,
    });
  }

  async saveOtp(userId: string, hashedOtp: string, expiresAt: Date) {
    return this.userModel.findByIdAndUpdate(userId, {
      otp: hashedOtp,
      otpExpiresAt: expiresAt,
    });
  }

  async markVerified(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    });
  }

  async clearOtp(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      otp: null,
      otpExpiresAt: null,
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
  }
}
