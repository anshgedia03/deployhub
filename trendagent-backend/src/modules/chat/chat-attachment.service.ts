import { Injectable } from '@nestjs/common';
import { DocumentService } from '../document/document.service';

interface PreparePayloadParams {
  text: string;
  files?: Express.Multer.File[];
  attachedFileIds: string[];
  sessionId: string;
  userId: string;
  threadId?: string;
}

@Injectable()
export class ChatAttachmentService {
  constructor(private readonly documentService: DocumentService) {}

  async preparePayload({
    text,
    files,
    attachedFileIds,
    sessionId,
    userId,
    threadId,
  }: PreparePayloadParams) {
    const content: any[] = [];
    const attachments: any[] = [];

    if (text) {
      content.push({
        type: 'text',
        text,
      });
    }

    let userMessageContent = text;

    /*
      1. Handle NEW uploaded files
    */
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadedPart = await this.documentService.processUpload({
          file,
          sessionId,
        });

        content.push(uploadedPart);

        const docs = await this.documentService.getAllDocsWithSessionId(
          sessionId,
          userId,
        );

        const matchedDoc = docs.find(
          (d) => d.originalFilename === file.originalname,
        );

        if (matchedDoc) {
          attachments.push({
            name: matchedDoc.originalFilename,
            url: matchedDoc.cloudinaryUrl,
            type: matchedDoc.mimeType,
          });
        }
      }
    }

    /*
      2. Handle existing attached docs
    */
    if (attachedFileIds && attachedFileIds.length > 0) {
      for (const fileId of attachedFileIds) {
        const doc = await this.documentService.getDocWithId(fileId, userId);

        if (doc) {
          content.push({
            type: 'document',
            uri: doc.geminiFileUri,
            mime_type: doc.mimeType,
          });

          attachments.push({
            name: doc.originalFilename,
            url: doc.cloudinaryUrl,
            type: doc.mimeType,
          });
        }
      }
    }

    /*
      3. Force Gemini to analyze docs if
         user uploaded files but wrote no text
    */
    const totalFiles = (files?.length || 0) + (attachedFileIds?.length || 0);

    if (!userMessageContent && totalFiles > 0) {
      userMessageContent = `I have attached ${totalFiles} file(s). Please carefully read, analyze, and summarize ALL of them comprehensively.`;
    }

    /*
      4. Add session docs automatically
         only on first interaction
    */
    const alreadyHasDocument = content.some((item) => item.type === 'document');

    if (!alreadyHasDocument && !threadId) {
      const sessionDocs =
        await this.documentService.getSessionDocumentParts(sessionId);

      content.push(...sessionDocs);
    }

    return {
      content,
      attachments,
      userMessageContent,
      threadId,
    };
  }
}
