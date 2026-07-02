import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async uploadFile(filePath: string, mimeType: string) {
    return this.genAI.files.upload({
      file: filePath,
      config: {
        mimeType,
      },
    });
  }

  async deleteFile(name: string) {
    return this.genAI.files.delete({
      name,
    });
  }

  async createInteraction(payload: any): Promise<unknown> {
    return this.genAI.interactions.create(payload);
  }
}
