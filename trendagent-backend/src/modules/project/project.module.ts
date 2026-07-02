import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ChatSession, ChatSessionSchema } from '../chat/schemas/chat.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/schemas/message.schema';
import {
  DocumentAsset,
  DocumentAssetSchema,
} from '../document/schemas/document.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    MongooseModule.forFeature([
      { name: DocumentAsset.name, schema: DocumentAssetSchema },
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
