import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project } from './schemas/project.schema';
import { ChatSession } from '../chat/schemas/chat.schema';
import { ChatMessage } from '../chat/schemas/message.schema';
import { DocumentAsset } from '../document/schemas/document.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ProjectController', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        { provide: getModelToken(Project.name), useValue: {} },
        { provide: getModelToken(ChatSession.name), useValue: {} },
        { provide: getModelToken(ChatMessage.name), useValue: {} },
        { provide: getModelToken(DocumentAsset.name), useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
