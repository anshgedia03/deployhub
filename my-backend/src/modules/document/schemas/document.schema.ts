import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';
import { ChatSession } from '../../chat/schemas/chat.schema';

export type DocumentAssetDocument = HydratedDocument<DocumentAsset>;

@Schema({ timestamps: true })
export class DocumentAsset {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: ChatSession.name,
    required: true,
    index: true,
  })
  sessionId!: string;

  /*
   |--------------------------------------------------------------------------
   | ORIGINAL FILE
   |--------------------------------------------------------------------------
   */

  @Prop({ required: true })
  originalFilename!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  /*
   |--------------------------------------------------------------------------
   | CLOUDINARY
   |--------------------------------------------------------------------------
   */

  @Prop({ required: true })
  cloudinaryUrl!: string;

  @Prop({ required: true })
  cloudinaryPublicId!: string;

  @Prop({ default: false })
  isReferenceCopy!: boolean;

  /*
   |--------------------------------------------------------------------------
   | GEMINI FILE REFERENCES
   |--------------------------------------------------------------------------
   */

  @Prop()
  geminiFileUri?: string;

  @Prop()
  geminiFileName?: string;

  /*
   |--------------------------------------------------------------------------
   | PROCESSING
   |--------------------------------------------------------------------------
   */

  @Prop({
    default: 'ready',
  })
  processingStatus!: 'pending' | 'processing' | 'ready' | 'failed' | 'expired';
}

export const DocumentAssetSchema = SchemaFactory.createForClass(DocumentAsset);
