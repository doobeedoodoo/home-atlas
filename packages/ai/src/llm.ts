import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

type Provider = 'anthropic' | 'openai' | 'google';

export function createLlm(): BaseChatModel {
  const provider = (process.env['LLM_PROVIDER'] ?? 'anthropic') as Provider;
  const model = process.env['LLM_MODEL'];
  if (!model) throw new Error('LLM_MODEL is not set');

  switch (provider) {
    case 'anthropic': {
      const apiKey = process.env['ANTHROPIC_API_KEY'];
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
      return new ChatAnthropic({
        model,
        apiKey,
        maxTokens: 2048,
      });
    }
    case 'openai': {
      const apiKey = process.env['OPENAI_API_KEY'];
      if (!apiKey) throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
      return new ChatOpenAI({
        model,
        apiKey,
        maxTokens: 2048,
      });
    }
    case 'google': {
      const apiKey = process.env['GOOGLE_API_KEY'];
      if (!apiKey) throw new Error('GOOGLE_API_KEY is required when LLM_PROVIDER=google');
      return new ChatGoogleGenerativeAI({
        model,
        apiKey,
        maxOutputTokens: 2048,
      });
    }
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${String(provider)}. Must be anthropic | openai | google`);
  }
}
