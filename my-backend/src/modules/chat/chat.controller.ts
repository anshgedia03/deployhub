import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Req,
  Patch,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenameChatDto } from './dto/renameChat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import type { AuthenticatedRequest } from 'src/common/interfaces';

@Controller('project/:projectId/chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChatSession(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.chatService.createChatSession(projectId, req.user.sub);
  }

  @Get()
  async getProjectChatSessions(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.getProjectChatSessions(
      projectId,
      req.user.sub,
      search,
    );
  }

  @Patch(':id/rename')
  renameChatSession(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: RenameChatDto,
  ) {
    return this.chatService.renameChatSession(
      projectId,
      id,
      req.user.sub,
      dto.title,
    );
  }

  @Post(':id/messages')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/octet-stream',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async chat(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (
      !dto.text &&
      (!files || files.length === 0) &&
      (!dto.attachedFileIds || dto.attachedFileIds.length === 0)
    ) {
      throw new BadRequestException(
        'Text, new files, or existing files are required',
      );
    }

    return this.chatService.sendMessage(
      projectId,
      id,
      req.user.sub,
      dto.text || '',
      files,
      dto.attachedFileIds,
    );
  }

  @Get(':id/history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Query('beforeTimestamp') beforeTimestamp?: string,
  ) {
    return this.chatService.getHistory(
      projectId,
      id,
      req.user.sub,
      beforeTimestamp,
    );
  }

  @Delete(':id')
  deleteChat(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteChat(projectId, id, req.user.sub);
  }
}
