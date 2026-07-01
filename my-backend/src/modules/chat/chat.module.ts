import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from './schemas/chat.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/message.schema';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentModule } from '../document/document.module';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { JwtModule } from '@nestjs/jwt';
import { AiModule } from '../ai/ai.module';
import { ChatMessageService } from './chat-message.service';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatAiService } from './chat-ai.service';
import { ChatAccessService } from './chat-access.service';
import { ChatSessionService } from './chat-session.service';
import { DocumentAsset, DocumentAssetSchema } from '../document/schemas/document.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      {
        name: ChatSession.name,
        schema: ChatSessionSchema,
      },
      {
        name: ChatMessage.name,
        schema: ChatMessageSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: DocumentAsset.name,
        schema: DocumentAssetSchema,
      },
    ]),

    MulterModule.register({
      dest: './uploads',
    }),

    DocumentModule,

    AiModule,
  ],

  providers: [
    ChatService,
    ChatMessageService,
    ChatAttachmentService,
    ChatAiService,
    ChatAccessService,
    ChatSessionService,
  ],

  controllers: [ChatController],

  exports: [ChatService],
})
export class ChatModule {}
