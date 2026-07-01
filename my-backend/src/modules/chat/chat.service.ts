import { Injectable } from '@nestjs/common';
import { ChatAccessService } from './chat-access.service';
import { ChatSessionService } from './chat-session.service';
import { ChatMessageService } from './chat-message.service';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatAiService } from './chat-ai.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly accessService: ChatAccessService,
    private readonly sessionService: ChatSessionService,
    private readonly messageService: ChatMessageService,
    private readonly attachmentService: ChatAttachmentService,
    private readonly aiService: ChatAiService,
  ) {}

  async createChatSession(projectId: string, userId: string) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    return this.sessionService.create(projectId);
  }

  async renameChatSession(
    projectId: string,
    sessionId: string,
    userId: string,
    title: string,
  ) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    return this.sessionService.rename(projectId, sessionId, title);
  }

  async getProjectChatSessions(
    projectId: string,
    userId: string,
    search?: string,
  ) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    return this.sessionService.list(projectId, search);
  }

  async getHistory(
    projectId: string,
    sessionId: string,
    userId: string,
    beforeTimestamp?: string,
    limit = 20,
  ) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    await this.accessService.findProjectChat(projectId, sessionId);

    return this.messageService.getHistory(sessionId, beforeTimestamp, limit);
  }

  async sendMessage(
    projectId: string,
    sessionId: string,
    userId: string,
    text: string,
    files?: Express.Multer.File[],
    attachedFileIds: string[] = [],
  ) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    const chat = await this.accessService.findProjectChat(projectId, sessionId);

    const threadId =
      chat.lastConversationInteractionId ||
      chat.lastVisualizationInteractionId ||
      undefined;

    const payload = await this.attachmentService.preparePayload({
      text,
      files,
      attachedFileIds,
      sessionId,
      userId,
      threadId,
    });

    await this.messageService.saveUserMessage(
      sessionId,
      payload.userMessageContent || 'Interaction',
      payload.attachments,
    );

    const aiResponse = await this.aiService.generate(
      payload.content,
      payload.threadId,
    );

    if (aiResponse?.interactionId) {
      await this.sessionService.updateInteractionId(
        sessionId,
        aiResponse.interactionId,
      );
    }

    return this.messageService.saveModelMessage(sessionId, aiResponse);
  }

  async deleteChat(projectId: string, sessionId: string, userId: string) {
    await this.accessService.ensureProjectAccess(projectId, userId);

    await this.accessService.findProjectChat(projectId, sessionId);

    await this.messageService.deleteBySession(sessionId);

    return this.sessionService.delete(projectId, sessionId);
  }
}
