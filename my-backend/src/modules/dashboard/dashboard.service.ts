import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ChatSession } from '../chat/schemas/chat.schema';
import { ChatMessage } from '../chat/schemas/message.schema';
import { Project } from '../project/schemas/project.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,

    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSession>,

    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessage>,
  ) {}

  private validateId(id: string, label: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} format: ${id}`);
    }
  }

  private async ensureProjectAccess(projectId: string, userId: string) {
    this.validateId(projectId, 'project ID');

    const project = await this.projectModel.findOne({ _id: projectId, userId });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  private async findProjectChatSession(
    projectId: string,
    chatSessionId: string,
  ) {
    this.validateId(chatSessionId, 'chat session ID');

    const chatSession = await this.chatSessionModel.findOne({
      _id: chatSessionId,
      projectId,
    });

    if (!chatSession) {
      throw new NotFoundException('Chat session not found in this project');
    }

    return chatSession;
  }

  private async findSessionMessage(chatSessionId: string, messageId: string) {
    this.validateId(messageId, 'chat message ID');

    const message = await this.chatMessageModel.findOne({
      _id: messageId,
      sessionId: chatSessionId,
    });

    if (!message) {
      throw new NotFoundException('Message not found in this chat session');
    }

    return message;
  }

  /*
  |--------------------------------------------------------------------------
  | GET ALL WIDGETS
  |--------------------------------------------------------------------------
  | Fetches only those chat messages whose onDashboard flag is true and
  | returns just their visualizationJSON payloads for dashboard rendering.
  |---------------------------------------------------------------------------
  */
  async getWidgets(projectId: string, chatSessionId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    await this.findProjectChatSession(projectId, chatSessionId);

    const widgets = await this.chatMessageModel
      .find({
        sessionId: chatSessionId,
        onDashboard: true,
        visualizationJSON: { $ne: null },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return widgets.map((widget) => ({
      _id: widget._id,
      visualizationJSON: widget.visualizationJSON,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | ADD WIDGET TO DASHBOARD
  |--------------------------------------------------------------------------
  | Validates project, chat session, and message ownership, then updates the
  | existing message document so it becomes visible on the dashboard.
  |--------------------------------------------------------------------------- 
  */
  async markWidgetOnDashboard(
    projectId: string,
    chatSessionId: string,
    messageId: string,
    userId: string,
  ) {
    await this.ensureProjectAccess(projectId, userId);
    await this.findProjectChatSession(projectId, chatSessionId);

    const message = await this.findSessionMessage(chatSessionId, messageId);

    message.onDashboard = true;
    await message.save();

    return {
      success: true,
      message: 'Widget added to dashboard successfully',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE WIDGET FROM DASHBOARD
  |--------------------------------------------------------------------------
  | Reuses the same validation chain and flips the stored dashboard flag off
  | so the widget is no longer included in dashboard results.
  |---------------------------------------------------------------------------
  */
  async removeWidgetFromDashboard(
    projectId: string,
    chatSessionId: string,
    messageId: string,
    userId: string,
  ) {
    await this.ensureProjectAccess(projectId, userId);
    await this.findProjectChatSession(projectId, chatSessionId);

    const message = await this.findSessionMessage(chatSessionId, messageId);

    message.onDashboard = false;
    await message.save();

    return {
      success: true,
      message: 'Widget removed from dashboard successfully',
    };
  }
}
