import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from 'src/common/interfaces';

@Controller('user')
@Throttle({
  default: {
    limit: 20,
    ttl: 30000,
  },
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new Error('User not found');
    return {
      user: {
        id: user._id,
        email: user.email,
        provider: user.provider,
        name: user.name,
        isVerified: user.isVerified,
      },
    };
  }
}
