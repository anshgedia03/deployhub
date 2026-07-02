import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { ChatSession, ChatSessionSchema } from '../chat/schemas/chat.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/schemas/message.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
