import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { DocumentAsset, DocumentAssetSchema } from './schemas/document.schema';

import { DocumentService } from './document.service';

import { CloudinaryService } from '../storage/cloudinary.service';

import { GeminiService } from '../gemini/gemini.service';
import { DocumentController } from './document.controller';
import { JwtModule } from '@nestjs/jwt';
import { ChatSession, ChatSessionSchema } from '../chat/schemas/chat.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      {
        name: DocumentAsset.name,
        schema: DocumentAssetSchema,
      },
    ]),
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
  ],

  providers: [DocumentService, CloudinaryService, GeminiService],

  exports: [DocumentService, GeminiService],

  controllers: [DocumentController],
})
export class DocumentModule {}
