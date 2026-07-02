import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DocumentAsset } from './schemas/document.schema';
import { CloudinaryService } from '../storage/cloudinary.service';
import { GeminiService } from '../gemini/gemini.service';
import { ChatSession } from '../chat/schemas/chat.schema';

type UploadedDocumentPart = {
  type: 'document';

  uri: string;

  mime_type: string;
};

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(DocumentAsset.name)
    private readonly documentModel: Model<DocumentAsset>,
    @InjectModel(ChatSession.name)
    private readonly chatModel: Model<ChatSession>,

    private readonly cloudinaryService: CloudinaryService,

    private readonly geminiService: GeminiService,
  ) {}

  private validateId(id: string, label: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} format`);
    }
  }

  private getSessionMatchExpression(sessionId: string) {
    return {
      $or: [
        {
          $eq: ['$sessionId', new Types.ObjectId(sessionId)],
        },
        {
          $eq: ['$sessionId', sessionId],
        },
      ],
    };
  }

  private async ensureSessionAccess(sessionId: string, userId: string) {
    this.validateId(sessionId, 'session ID');

    const session = await this.chatModel
      .findOne({
        _id: sessionId,
      })
      .populate('projectId');

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const project = session.projectId as any;

    if (project.userId.toString() !== userId) {
      throw new NotFoundException('Access denied');
    }

    return session;
  }

  async processUpload({
    file,
    sessionId,
  }: {
    file: Express.Multer.File;
    sessionId: string;
  }): Promise<UploadedDocumentPart> {
    if (!file?.path) {
      throw new BadRequestException('Invalid upload file');
    }

    let normalizedMimeType = file.mimetype;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (
      !normalizedMimeType ||
      normalizedMimeType === 'application/octet-stream'
    ) {
      if (fileExtension === 'xlsx') {
        normalizedMimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileExtension === 'xls') {
        normalizedMimeType = 'application/vnd.ms-excel';
      } else if (fileExtension === 'csv') {
        normalizedMimeType = 'text/csv';
      } else if (fileExtension === 'pdf') {
        normalizedMimeType = 'application/pdf';
      } else if (fileExtension === 'txt') {
        normalizedMimeType = 'text/plain';
      } else if (fileExtension === 'doc') {
        normalizedMimeType = 'application/msword';
      } else if (fileExtension === 'docx') {
        normalizedMimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    }

    const cloudinaryResult = await this.cloudinaryService.uploadRawFile(
      file.path,
    );

    let geminiFilePath = file.path;
    let geminiMimeType = normalizedMimeType;
    let tempGeminiFilePath: string | null = null;

    try {
      if (
        normalizedMimeType ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        normalizedMimeType === 'application/vnd.ms-excel'
      ) {
        const workbook = XLSX.readFile(file.path);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!firstSheet) {
          throw new BadRequestException('Excel file has no readable sheets');
        }

        const csv = XLSX.utils.sheet_to_csv(firstSheet);

        tempGeminiFilePath = path.join(
          path.dirname(file.path),
          `${path.parse(file.filename).name}.csv`,
        );

        fs.writeFileSync(tempGeminiFilePath, csv);

        geminiFilePath = tempGeminiFilePath;
        geminiMimeType = 'text/csv';
      }

      const geminiUpload = await this.geminiService.uploadFile(
        geminiFilePath,
        geminiMimeType,
      );

      await this.documentModel.create({
        sessionId,
        originalFilename: file.originalname,
        mimeType: normalizedMimeType,
        size: file.size,
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        geminiFileUri: geminiUpload.uri!,
        geminiFileName: geminiUpload.name!,
        processingStatus: 'ready',
      });

      return {
        type: 'document',
        uri: geminiUpload.uri!,
        mime_type: geminiUpload.mimeType || geminiMimeType,
      };
    } finally {
      if (tempGeminiFilePath) {
        try {
          await fs.promises.unlink(tempGeminiFilePath);
        } catch (error) {
          console.error('Temp CSV cleanup failed:', error);
        }
      }
    }
  }

  async cleanupLocalFile(path?: string) {
    if (!path) return;

    try {
      await fs.promises.unlink(path);
    } catch (error) {
      console.error('Local file cleanup failed:', error);
    }
  }

  async deleteDocumentsForSession(sessionId: string) {
    this.validateId(sessionId, 'session ID');

    const documents = await this.documentModel
      .aggregate<DocumentAsset>([
        {
          $match: {
            $expr: this.getSessionMatchExpression(sessionId),
          },
        },
      ])
      .exec();

    for (const doc of documents) {
      /*
       |--------------------------------------------------------------------------
       | DELETE GEMINI FILE
       |--------------------------------------------------------------------------
       */

      if (doc.geminiFileName && !doc.isReferenceCopy) {
        try {
          await this.geminiService.deleteFile(doc.geminiFileName);
        } catch (error) {
          console.error('Gemini file deletion failed:', error);
        }
      }

      /*
       |--------------------------------------------------------------------------
       | DELETE CLOUDINARY FILE
       |--------------------------------------------------------------------------
       */

      if (doc.cloudinaryPublicId && !doc.isReferenceCopy) {
        try {
          await this.cloudinaryService.deleteRawFile(doc.cloudinaryPublicId);
        } catch (error) {
          console.error('Cloudinary file deletion failed:', error);
        }
      }
    }

    await this.documentModel.deleteMany({
      $expr: this.getSessionMatchExpression(sessionId),
    });
  }

  async getSessionDocumentParts(sessionId: string) {
    this.validateId(sessionId, 'session ID');

    const docs = await this.documentModel
      .aggregate<DocumentAsset>([
        {
          $match: {
            $expr: this.getSessionMatchExpression(sessionId),
            processingStatus: 'ready',
          },
        },
      ])
      .exec();

    return docs
      .filter((d) => d.geminiFileUri)
      .map((doc) => ({
        type: 'document',
        uri: doc.geminiFileUri!,
        mime_type: doc.mimeType,
      }));
  }
  async getAllDocsWithSessionId(
    sessionId: string,
    userId: string,
    search?: string,
  ) {
    await this.ensureSessionAccess(sessionId, userId);

    const matchStage: any = {
      $expr: this.getSessionMatchExpression(sessionId),
    };

    // Search by original filename
    if (search) {
      matchStage.originalFilename = {
        $regex: search,
        $options: 'i',
      };
    }

    return this.documentModel
      .aggregate([
        {
          $match: matchStage,
        },
        {
          $project: {
            originalFilename: 1,
            mimeType: 1,
            size: 1,
            cloudinaryUrl: 1,
            createdAt: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .exec();
  }

  async getDocWithId(documentId: string, userId: string) {
    this.validateId(documentId, 'document ID');

    const document = await this.documentModel
      .findById(documentId)
      .select('originalFilename mimeType size cloudinaryUrl createdAt');

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureSessionAccess(document.sessionId, userId);

    return document;
  }

  async deleteDocWithId(documentId: string, userId: string) {
    this.validateId(documentId, 'document ID');

    const document = await this.documentModel.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureSessionAccess(document.sessionId, userId);

    /*
   |--------------------------------------------------------------------------
   | Delete Gemini file
   |--------------------------------------------------------------------------
   */

    if (document.geminiFileName && !document.isReferenceCopy) {
      try {
        await this.geminiService.deleteFile(document.geminiFileName);
      } catch (error) {
        console.error('Gemini deletion failed:', error);
      }
    }

    /*
   |--------------------------------------------------------------------------
   | Delete Cloudinary file
   |--------------------------------------------------------------------------
   */

    if (document.cloudinaryPublicId && !document.isReferenceCopy) {
      try {
        await this.cloudinaryService.deleteRawFile(document.cloudinaryPublicId);
      } catch (error) {
        console.error('Cloudinary deletion failed:', error);
      }
    }

    await this.documentModel.deleteOne({
      _id: documentId,
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async uploadDoc({
    file,
    sessionId,
    userId,
  }: {
    file: Express.Multer.File;
    sessionId: string;
    userId: string;
  }) {
    await this.ensureSessionAccess(sessionId, userId);

    try {
      await this.processUpload({
        file,
        sessionId,
      });

      const [latestDoc] = await this.documentModel
        .aggregate<DocumentAsset>([
          {
            $match: {
              $expr: this.getSessionMatchExpression(sessionId),
              originalFilename: file.originalname,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $limit: 1,
          },
        ])
        .exec();

      return {
        success: true,
        cloudinary_uri: latestDoc?.cloudinaryUrl,
        mime_type: file.mimetype,
      };
    } finally {
      await this.cleanupLocalFile(file?.path);
    }
  }
}
