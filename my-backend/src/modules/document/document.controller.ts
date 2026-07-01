import {
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/common/interfaces';

@Controller('document')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /*
   |--------------------------------------------------------------------------
   | Upload a document directly to a session
   |--------------------------------------------------------------------------
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!sessionId) throw new BadRequestException('SessionId is required');

    return this.documentService.processUpload({
      file,
      sessionId,
    });
  }

  /*
   |--------------------------------------------------------------------------
   | Get all documents of a session
   |--------------------------------------------------------------------------
   */
  @Get('all/:sessionId')
  getAllDocsOfSession(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Query('search') search?: string,
  ) {
    return this.documentService.getAllDocsWithSessionId(
      sessionId,
      req.user.sub,
      search,
    );
  }

  @Get(':documentId')
  getDocWithId(
    @Req() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.getDocWithId(documentId, req.user.sub);
  }

  @Delete(':documentId')
  deleteDocWithId(
    @Req() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.deleteDocWithId(documentId, req.user.sub);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadDoc(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    return this.documentService.uploadDoc({
      file,
      sessionId,
      userId: req.user.sub,
    });
  }
}
