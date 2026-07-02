import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './modules/chat/chat.module';
import { Connection } from 'mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MailModule } from './modules/mail/mail.module';
import { ProjectModule } from './modules/project/project.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const logger = new Logger('MongoDB');

        return {
          uri: configService.get<string>('MONGO_URL'),

          retryAttempts: 5,
          retryDelay: 3000,

          onConnectionCreate: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connected');
            });

            connection.on('error', (error) => {
              logger.error('MongoDB error', error);
            });

            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });

            return connection;
          },
        };
      },
    }),

    AuthModule,
    UserModule,
    MailModule,
    ProjectModule,
    ChatModule,
    DashboardModule,

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
