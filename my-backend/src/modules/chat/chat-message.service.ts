import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from './schemas/message.schema';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessage>,
  ) {}

  async saveUserMessage(
    sessionId: string,
    content: string,
    attachments: any[],
  ) {
    return this.messageModel.create({
      sessionId,
      role: 'user',
      content,
      attachments,
    });
  }

  async saveModelMessage(sessionId: string, aiResponse: any) {
    return this.messageModel.create({
      sessionId,
      role: 'model',
      content: aiResponse?.storedContent,
      visualizationJSON: aiResponse?.visualizationJSON,
      onDashboard:
        aiResponse?.visualizationJSON?.chartType &&
        ['stat_cards', 'kpi', 'kpi_grid'].includes(
          aiResponse.visualizationJSON.chartType,
        ),
    });
  }

  async getHistory(sessionId: string, beforeTimestamp?: string, limit = 20) {
    const filter: any = {
      sessionId,
    };

    if (beforeTimestamp) {
      filter.createdAt = {
        $lt: new Date(beforeTimestamp),
      };
    }

    const messages = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    const nextCursor = hasMore
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

    return {
      messages: messages.reverse(),
      hasMore,
      nextCursor,
    };
  }

  async deleteBySession(sessionId: string) {
    return this.messageModel.deleteMany({
      sessionId,
    });
  }
}
