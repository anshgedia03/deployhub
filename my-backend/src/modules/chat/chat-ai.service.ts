import { Injectable } from '@nestjs/common';
import { AiOrchestrationService } from '../ai/ai-orchestration.service';

@Injectable()
export class ChatAiService {
  constructor(
    private readonly aiOrchestrationService: AiOrchestrationService,
  ) {}

  async generate(content: any[], threadId?: string) {
    return this.aiOrchestrationService.generateChatResponse(content, threadId);
  }
}
