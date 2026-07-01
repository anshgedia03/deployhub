import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  role!: 'user' | 'model';

  @Prop({ type: Object })
  content: any;

  @Prop({ type: Object })
  visualizationJSON: any;

  @Prop({ type: Boolean, default: false })
  onDashboard!: boolean;

  @Prop({ type: [Object], default: [] })
  attachments!: { name: string; url: string; type: string }[];

  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
