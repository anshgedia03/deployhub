import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MailModule } from 'src/modules/mail/mail.module';
import { TokenService } from './token.service';
import { AuthHelperService } from './auth-helper.service';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({ session: false }),
    forwardRef(() => UserModule),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    TokenService,
    AuthHelperService,
    GoogleStrategy,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
