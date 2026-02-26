import { supabase } from '../lib/supabase';
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

// ─── Proxy call (API key lives server-side in Edge Function) ─────────────────

async function callClaude(payload: object): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 529) {
      retries++;
      if (retries < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
        continue;
      }
      throw new Error('Anthropic API is currently experiencing high traffic. Please try again in a few minutes.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || `API error ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.type === 'text' ? data.content[0].text : '';
  }

  throw new Error('Failed to get response after retries');
}

// ─── Conversation class ───────────────────────────────────────────────────────

export class RoseGlassConversation {
  async analyze(
    userInput: string,
    conversationHistory: Message[]
  ): Promise<{ analysis: string; metaNotes: string; mode: Mode }> {
    const { mode, content } = detectMode(userInput);
    const actualContent = content || userInput;
    const systemPrompt = getModeSystemPrompt(mode);
    const contextualPrompt = this.buildContextualPrompt(actualContent, conversationHistory, mode);

    const analysis = await callClaude({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextualPrompt }],
    });

    const metaNotes = mode === 'analyze'
      ? await this.generateMetaNotes(actualContent, analysis, conversationHistory)
      : '';

    return { analysis, metaNotes, mode };
  }

  private buildContextualPrompt(userInput: string, history: Message[], mode: Mode): string {
    let prompt = '';

    if (mode === 'analyze' && history.length > 0) {
      prompt += '**COHERENCE CONTEXT (Previous Meta-Notes):**\n\n';
      const recentMetaNotes = history
        .filter(msg => msg.metaNotes)
        .slice(-3)
        .map(msg => msg.metaNotes)
        .join('\n\n');
      prompt += recentMetaNotes + '\n\n---\n\n';
    }

    if (mode === 'analyze') {
      prompt += `Analyze the following text through the Rose Glass lens. Apply the mathematical frameworks and dimensional analysis described in your system prompt`;
      if (history.length > 0) prompt += `, maintaining coherence with the patterns identified in previous meta-notes`;
      prompt += `:\n\n${userInput}`;
    } else {
      prompt += userInput;
    }

    return prompt;
  }

  private async generateMetaNotes(userInput: string, analysis: string, history: Message[]): Promise<string> {
    const metaPrompt = `You are analyzing a Rose Glass translation session. Review this exchange and create internal meta-notes that will help maintain coherence over time.

**User Input:** ${userInput}

**Your Analysis:** ${analysis}

${history.length > 0
  ? `**Previous Meta-Notes:**\n${history.filter(msg => msg.metaNotes).slice(-2).map(msg => msg.metaNotes).join('\n\n')}`
  : ''}

Generate meta-notes that capture:
1. Dimensional patterns detected (Ψ, ρ, q, f trends)
2. Coherence trajectory (building or fragmenting)
3. Key translation patterns to maintain
4. Distortion indicators (D(P) elements)
5. What to watch for in next exchange

Be concise but precise. These notes guide future inferences.`;

    return await callClaude({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: metaPrompt }],
    });
  }
}
