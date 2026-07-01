import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectService } from './project.service';
import { Project } from './schemas/project.schema';
import { ChatSession } from '../chat/schemas/chat.schema';
import { ChatMessage } from '../chat/schemas/message.schema';
import { DocumentAsset } from '../document/schemas/document.schema';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getModelToken(Project.name), useValue: {} },
        { provide: getModelToken(ChatSession.name), useValue: {} },
        { provide: getModelToken(ChatMessage.name), useValue: {} },
        { provide: getModelToken(DocumentAsset.name), useValue: {} },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
