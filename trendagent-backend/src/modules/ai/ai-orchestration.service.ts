import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { UNIFIED_SYSTEM_PROMPT } from '../ai/prompts/unified.prompt';
import { z } from 'zod';
import { unifiedSchema } from '../ai/schemas/visualization.schema';

@Injectable()
export class AiOrchestrationService {
  constructor(private readonly geminiService: GeminiService) {}

  async generateChatResponse(content: any[], previousInteractionId?: string) {
    try {
      const interaction = await this.geminiService.createInteraction({
        model: 'gemini-2.5-flash',
        input: [{ role: 'user', content }],
        previous_interaction_id: previousInteractionId,
        store: true,
        system_instruction: UNIFIED_SYSTEM_PROMPT,
        response_format: [
          {
            type: 'text',
            mime_type: 'application/json',
            schema: z.toJSONSchema(unifiedSchema) as any,
          },
        ],
      });

      return this.parseInteractionResponse(interaction);
    } catch (error) {
      this.handleAiError(error);
    }
  }

  private parseInteractionResponse(interaction: any) {
    const lastOutput: any = interaction.outputs?.at?.(-1);
    const rawText = lastOutput?.text || lastOutput?.content?.[0]?.text || '{}';

    let finalContent: any = null;
    try {
      finalContent = JSON.parse(rawText);
    } catch {
      /* ignore */
    }

    const shouldVisualize =
      !!finalContent?.is_visualization && !!finalContent?.visualization;

    return {
      interactionId: interaction.id,
      storedContent: shouldVisualize
        ? finalContent
        : finalContent?.analysis || finalContent?.summary || rawText,
      visualizationJSON: shouldVisualize
        ? {
            chartType: finalContent?.visualization?.chart_type,
            chartTitle: finalContent?.visualization?.title,
            xKey: finalContent?.visualization?.x_key,
            yKeys: finalContent?.visualization?.y_keys,
            data: finalContent?.dataset?.records ?? [],
          }
        : null,
    };
  }

  private handleAiError(error: any) {
    console.error('Unified Service Error:', error);

    let userMessage = 'AI process failed';
    let detailedAnalysis =
      'Ouch, I hit a snag. Could you try asking that again?';

    if (
      error?.message?.includes('API key') ||
      error?.message?.includes('authentication') ||
      error?.status === 401
    ) {
      userMessage = 'Gemini authentication failed';
      detailedAnalysis =
        'The AI provider authentication failed. Please check GEMINI_API_KEY.';
    } else if (
      error?.message?.includes('rate limit') ||
      error?.status === 429
    ) {
      userMessage = 'Gemini rate limit exceeded';
      detailedAnalysis =
        'AI request quota exceeded. Please retry after some time.';
    } else if (
      error instanceof SyntaxError ||
      error?.message?.includes('JSON') ||
      error?.message?.includes('schema')
    ) {
      userMessage = 'AI returned invalid structured data';
      detailedAnalysis =
        'The AI returned malformed JSON or schema-incompatible data.';
    } else if (
      error?.message?.includes('document') ||
      error?.message?.includes('upload') ||
      error?.message?.includes('file')
    ) {
      userMessage = 'Document processing failed';
      detailedAnalysis =
        'There was a problem processing the attached document(s).';
    } else if (error?.response?.message) {
      userMessage = Array.isArray(error.response.message)
        ? error.response.message.join(', ')
        : error.response.message;
      detailedAnalysis = userMessage;
    }

    throw new InternalServerErrorException({
      success: false,
      message: userMessage,
      details: detailedAnalysis,
    });
  }
}
