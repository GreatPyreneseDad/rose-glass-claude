import Anthropic from '@anthropic-ai/sdk';
import { detectMode, getModeSystemPrompt, type Mode } from '../utils/commands';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metaNotes?: string;
  mode?: Mode;
}

export interface ConversationState {
  messages: Message[];
  metaHistory: string[];
}

export class RoseGlassConversation {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async analyze(
    userInput: string,
    conversationHistory: Message[]
  ): Promise<{ analysis: string; metaNotes: string; mode: Mode }> {
    // Detect command mode
    const { mode, content } = detectMode(userInput);
    const actualContent = content || userInput;

    // Build context with previous meta-notes
    const contextualPrompt = this.buildContextualPrompt(
      actualContent,
      conversationHistory,
      mode
    );

    // Get mode-specific system prompt
    const systemPrompt = getModeSystemPrompt(mode);

    // Get main Rose Glass analysis with retry logic
    let analysisResponse;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        analysisResponse = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: contextualPrompt,
            },
          ],
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        retries++;

        // Check if it's an overload error (529)
        if (error?.status === 529 && retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
          console.log(`API overloaded, retrying in ${waitTime/1000}s... (attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // If not overload error or max retries reached, throw
        if (retries >= maxRetries) {
          throw new Error('Anthropic API is currently overloaded. Please try again in a moment.');
        }
        throw error;
      }
    }

    const analysis =
      analysisResponse.content[0].type === 'text'
        ? analysisResponse.content[0].text
        : '';

    // Generate meta-notes about this inference (only in analyze mode)
    const metaNotes = mode === 'analyze'
      ? await this.generateMetaNotes(actualContent, analysis, conversationHistory)
      : '';

    return { analysis, metaNotes, mode };
  }

  private buildContextualPrompt(
    userInput: string,
    history: Message[],
    mode: Mode
  ): string {
    let prompt = '';

    // Include previous meta-notes as context (only in analyze mode)
    if (mode === 'analyze' && history.length > 0) {
      prompt += '**COHERENCE CONTEXT (Previous Meta-Notes):**\n\n';
      const recentMetaNotes = history
        .filter((msg) => msg.metaNotes)
        .slice(-3)
        .map((msg) => msg.metaNotes)
        .join('\n\n');
      prompt += recentMetaNotes + '\n\n---\n\n';
    }

    if (mode === 'analyze') {
      prompt += `Analyze the following text through the Rose Glass lens. Apply the mathematical frameworks and dimensional analysis described in your system prompt`;
      if (history.length > 0) {
        prompt += `, maintaining coherence with the patterns identified in previous meta-notes`;
      }
      prompt += `:\n\n${userInput}`;
    } else {
      prompt += userInput;
    }

    return prompt;
  }

  private async generateMetaNotes(
    userInput: string,
    analysis: string,
    history: Message[]
  ): Promise<string> {
    const metaPrompt = `You are analyzing a Rose Glass translation session. Review this exchange and create internal meta-notes that will help maintain coherence over time.

**User Input:** ${userInput}

**Your Analysis:** ${analysis}

${
  history.length > 0
    ? `**Previous Meta-Notes:**\n${history
        .filter((msg) => msg.metaNotes)
        .slice(-2)
        .map((msg) => msg.metaNotes)
        .join('\n\n')}`
    : ''
}

Generate meta-notes that capture:
1. Dimensional patterns detected (Ψ, ρ, q, f trends)
2. Coherence trajectory (building or fragmenting)
3. Key translation patterns to maintain
4. Distortion indicators (D(P) elements)
5. What to watch for in next exchange

Be concise but precise. These notes guide future inferences.`;

    const metaResponse = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: metaPrompt,
        },
      ],
    });

    return metaResponse.content[0].type === 'text'
      ? metaResponse.content[0].text
      : '';
  }
}
