import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interface/auth.interface';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthenticatedRequest = context.switchToHttp().getRequest();

    const cookieToken = (req.cookies as { access_token?: string })
      ?.access_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.replace('Bearer ', '');
    const token = cookieToken || bearerToken;

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');

      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret,
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
