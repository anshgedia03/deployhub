import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { Project } from '../../project/schemas/project.schema';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Project.name,
    required: true,
    index: true,
  })
  projectId!: string;

  @Prop({ default: 'New chat', maxlength: 30, minlength: 2 })
  title!: string;

  /*
   |--------------------------------------------------------------------------
   | INTERACTION MEMORY
   |--------------------------------------------------------------------------
   */

  @Prop()
  lastConversationInteractionId?: string;

  @Prop()
  lastVisualizationInteractionId?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
