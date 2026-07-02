// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiOrchestrationService } from './ai-orchestration.service';
import { GeminiService } from '../gemini/gemini.service';

@Module({
  imports: [],
  providers: [AiOrchestrationService, GeminiService],
  exports: [AiOrchestrationService],
})
export class AiModule {}
