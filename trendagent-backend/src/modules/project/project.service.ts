import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChatSession, ChatSessionDocument } from '../chat/schemas/chat.schema';
import {
  ChatMessage,
  ChatMessageDocument,
} from '../chat/schemas/message.schema';
import {
  DocumentAsset,
  DocumentAssetDocument,
} from '../document/schemas/document.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ChatSession.name)
    private readonly chatModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,

    @InjectModel(DocumentAsset.name)
    private readonly documentModel: Model<DocumentAssetDocument>,
  ) {}

  // Helper to validate MongoDB ObjectIds to prevent backend crashes
  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectModel
      .findOne({ name: createProjectDto.name, userId })
      .exec();
    if (project) {
      throw new ConflictException('Project Name Already Exits');
    }

    return this.projectModel.create({ ...createProjectDto, userId });
  }

  async findAll(
    userId: string,
    search?: string,
    sort: 'asc' | 'desc' = 'desc',
  ): Promise<Project[]> {
    if (!userId) {
      throw new UnauthorizedException('You are not Authorized');
    }

    const matchStage: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // Search filter
    if (search) {
      matchStage.name = {
        $regex: search,
        $options: 'i',
      };
    }

    const projects = await this.projectModel.aggregate([
      /*
     |--------------------------------------------------------------------------
     | MATCH PROJECTS
     |--------------------------------------------------------------------------
     */
      {
        $match: matchStage,
      },

      /*
     |--------------------------------------------------------------------------
     | LOOKUP CHAT SESSIONS
     |--------------------------------------------------------------------------
     */
      {
        $lookup: {
          from: this.chatModel.collection.name,
          localField: '_id',
          foreignField: 'projectId',
          as: 'chatSessions',
        },
      },

      /*
     |--------------------------------------------------------------------------
     | EXTRACT CHAT SESSION IDS
     |--------------------------------------------------------------------------
     */
      {
        $addFields: {
          chatSessionIds: {
            $setUnion: [
              {
                $ifNull: ['$chatSessionIds', []],
              },
              {
                $map: {
                  input: '$chatSessions',
                  as: 'session',
                  in: '$$session._id',
                },
              },
            ],
          },
          chatSessionIdStrings: {
            $map: {
              input: {
                $setUnion: [
                  {
                    $ifNull: ['$chatSessionIds', []],
                  },
                  {
                    $map: {
                      input: '$chatSessions',
                      as: 'session',
                      in: '$$session._id',
                    },
                  },
                ],
              },
              as: 'sessionId',
              in: {
                $toString: '$$sessionId',
              },
            },
          },
        },
      },

      /*
     |--------------------------------------------------------------------------
     | LOOKUP DOCUMENT ASSETS
     |--------------------------------------------------------------------------
     */
      {
        $lookup: {
          from: this.documentModel.collection.name,
          let: {
            sessionIds: '$chatSessionIds',
            sessionIdStrings: '$chatSessionIdStrings',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $in: ['$sessionId', '$$sessionIds'],
                    },
                    {
                      $in: ['$sessionId', '$$sessionIdStrings'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'documents',
        },
      },

      /*
     |--------------------------------------------------------------------------
     | CALCULATE DOCUMENT STATS
     |--------------------------------------------------------------------------
     */
      {
        $addFields: {
          documentsCount: {
            $size: '$documents',
          },

          totalDocumentsSize: {
            $sum: {
              $map: {
                input: '$documents',
                as: 'document',
                in: {
                  $ifNull: ['$$document.size', 0],
                },
              },
            },
          },
        },
      },

      /*
     |--------------------------------------------------------------------------
     | REMOVE UNNECESSARY FIELDS
     |--------------------------------------------------------------------------
     */
      {
        $project: {
          documents: 0,
          chatSessions: 0,
          chatSessionIdStrings: 0,
        },
      },

      /*
     |--------------------------------------------------------------------------
     | SORT
     |--------------------------------------------------------------------------
     */
      {
        $sort: {
          createdAt: sort === 'asc' ? 1 : -1,
        },
      },
    ]);
    return projects;
  }

  async findOne(id: string, userId: string): Promise<Project> {
    this.validateId(id);

    // Optimized: Check for BOTH project ID and owner in the database query
    const project = await this.projectModel.findOne({ _id: id, userId }).exec();

    if (!project) {
      // If no project is found with that ID AND that UserID, it either doesn't exist
      // or the user doesn't own it.
      throw new NotFoundException(`Project not found or access denied`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    this.validateId(id);

    await this.findOne(id, userId);

    const allowedUpdates: Partial<UpdateProjectDto> = {};

    if (updateProjectDto.name !== undefined) {
      if (updateProjectDto.name.trim() === '') {
        throw new BadRequestException('Project name cannot be empty');
      }

      allowedUpdates.name = updateProjectDto.name;
    }

    // Prevent empty update requests
    if (Object.keys(allowedUpdates).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, allowedUpdates, {
        new: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Failed to update project');
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    this.validateId(id);

    // Ensures the user owns the project before deletion
    const project = await this.findOne(id, userId);

    const sessionIds = project.chatSessionIds;

    await this.messageModel.deleteMany({
      sessionId: { $in: sessionIds },
    });

    await this.documentModel.deleteMany({
      sessionId: { $in: sessionIds },
    });

    await this.chatModel.deleteMany({
      _id: { $in: sessionIds },
    });

    const result = await this.projectModel
      .deleteOne({ _id: id, userId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Project could not be deleted');
    }

    return { message: `Project deleted successfully` };
  }

  async duplicateProject(projectId: string, userId: string) {
    this.validateId(projectId);

    const project = await this.findOne(projectId, userId);

    const duplicatedProject = await this.projectModel.create({
      name: `${project.name} (Copy)`,
      userId,
      chatSessionIds: [],
    });

    const duplicatedProjectId = duplicatedProject._id.toString();

    const chats = await this.chatModel.find({
      _id: {
        $in: project.chatSessionIds,
      },
    });

    for (const chat of chats) {
      const originalChatId = chat._id.toString();

      const newChat = await this.chatModel.create({
        projectId: duplicatedProjectId,
        title: `${chat.title} (Copy)`,
        lastConversationInteractionId: chat.lastConversationInteractionId,
        lastVisualizationInteractionId: chat.lastVisualizationInteractionId,
      });

      const newChatId = newChat._id.toString();
      duplicatedProject.chatSessionIds.push(newChatId);

      const messages = await this.messageModel.find({
        sessionId: originalChatId,
      });

      if (messages.length) {
        await this.messageModel.insertMany(
          messages.map((message) => ({
            sessionId: newChatId,
            role: message.role,
            content: message.content,
            visualizationJSON: message.visualizationJSON,
            onDashboard: message.onDashboard,
          })),
        );
      }

      const documents = await this.documentModel.find({
        sessionId: originalChatId,
      });

      if (documents.length) {
        await this.documentModel.insertMany(
          documents.map((doc) => ({
            sessionId: newChatId,
            originalFilename: doc.originalFilename,
            mimeType: doc.mimeType,
            size: doc.size,
            cloudinaryUrl: doc.cloudinaryUrl,
            cloudinaryPublicId: `${doc.cloudinaryPublicId}:copy:${newChatId}`,
            isReferenceCopy: true,
            geminiFileUri: doc.geminiFileUri,
            geminiFileName: doc.geminiFileName,
            processingStatus: doc.processingStatus,
          })),
        );
      }
    }

    await duplicatedProject.save();
    return duplicatedProject;
  }

  private formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString() +
      ' ' +
      sizes[i]
    );
  }
}
