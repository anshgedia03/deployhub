import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

import { Project } from '../project/schemas/project.schema';
import { ChatSession } from './schemas/chat.schema';

@Injectable()
export class ChatAccessService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,

    @InjectModel(ChatSession.name)
    private readonly chatModel: Model<ChatSession>,
  ) {}

  private validateId(id: string, label: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} format: ${id}`);
    }
  }

  async ensureProjectAccess(projectId: string, userId: string) {
    this.validateId(projectId, 'project ID');

    const project = await this.projectModel
      .findOne({
        _id: projectId,
        userId,
      })
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async findProjectChat(projectId: string, sessionId: string) {
    this.validateId(sessionId, 'chat session ID');

    const chat = await this.chatModel
      .findOne({
        _id: sessionId,
        projectId,
      })
      .exec();

    if (!chat) {
      throw new NotFoundException('Chat session not found in this project');
    }

    return chat;
  }
}
