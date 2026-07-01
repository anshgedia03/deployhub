import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ChatSession } from './schemas/chat.schema';
import { Project } from '../project/schemas/project.schema';
import {
  DocumentAsset,
  DocumentAssetDocument,
} from '../document/schemas/document.schema';

@Injectable()
export class ChatSessionService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatModel: Model<ChatSession>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,

    @InjectModel(DocumentAsset.name)
    private readonly documentModel: Model<DocumentAssetDocument>,
  ) {}

  async create(projectId: string) {
    const lastChat = await this.chatModel
      .findOne({ projectId })
      .sort({ createdAt: -1 })
      .lean();

    const totalChats = await this.chatModel.countDocuments({ projectId });

    let nextNumber = 1;

    if (lastChat?.title) {
      const match = lastChat.title.match(/\d+$/);

      if (match) {
        nextNumber = Number(match[0]) + 1;
      } else {
        nextNumber = totalChats + 1;
      }
    }

    const chat = await this.chatModel.create({
      projectId,
      title: `ChatSession ${nextNumber}`,
    });

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $addToSet: {
          chatSessionIds: chat._id,
        },
      })
      .exec();

    return chat;
  }

  async rename(projectId: string, sessionId: string, title: string) {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new BadRequestException('Title cannot be empty');
    }

    const duplicate = await this.chatModel
      .findOne({
        projectId,
        title: trimmedTitle,
        _id: {
          $ne: sessionId,
        },
      })
      .exec();

    if (duplicate) {
      throw new ConflictException('Chat session title already exists');
    }

    const updated = await this.chatModel
      .findByIdAndUpdate(
        sessionId,
        {
          title: trimmedTitle,
        },
        {
          new: true,
        },
      )
      .exec();

    return {
      success: true,
      message: 'Chat session renamed successfully',
      data: updated,
    };
  }

  async list(projectId: string, search?: string) {
    const filter: any = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (search) {
      filter.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const chatSessions = await this.chatModel.aggregate([
      {
        $match: filter,
      },

      {
        $lookup: {
          from: this.documentModel.collection.name,

          let: {
            sessionId: '$_id',
            sessionIdString: {
              $toString: '$_id',
            },
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    // NEW DATA (ObjectId)
                    {
                      $eq: ['$sessionId', '$$sessionId'],
                    },

                    // OLD DATA (string)
                    {
                      $eq: ['$sessionId', '$$sessionIdString'],
                    },
                  ],
                },
              },
            },
          ],

          as: 'attachments',
        },
      },
      {
        $addFields: {
          attachmentCount: {
            $size: '$attachments',
          },

          totalAttachmentSize: {
            $sum: '$attachments.size',
          },
        },
      },
      {
        $project: {
          attachments: 0,
        },
      },
    ]);
    return chatSessions;
  }

  async updateInteractionId(sessionId: string, interactionId: string) {
    return this.chatModel
      .findByIdAndUpdate(sessionId, {
        lastConversationInteractionId: interactionId,
        lastVisualizationInteractionId: interactionId,
      })
      .exec();
  }

  async delete(projectId: string, sessionId: string) {
    await this.chatModel
      .deleteOne({
        _id: sessionId,
        projectId,
      })
      .exec();

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $pull: {
          chatSessionIds: sessionId,
        },
      })
      .exec();

    return {
      success: true,
    };
  }
}
