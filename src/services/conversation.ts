import { supabase } from '../lib/supabase';
import { detectMode, getModeSystemPrompt, type Mode } from '../utils/commands';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metaNotes?: string;
  mode?: Mode;
  dimensions?: DimensionalScores;
  imageData?: { base64: string; mediaType: string }; // client-only, not persisted
}

export interface DimensionalScores {
  psi: number | null;
  rho: number | null;
  q: number | null;
  f: number | null;
  distortion: number | null;
  truth_value: number | null;
  trs: number | null;
}

// ─── Proxy call ───────────────────────────────────────────────────────────────

async function callClaude(payload: object): Promise<any> {
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

    return await response.json();
  }

  throw new Error('Failed to get response after retries');
}

function extractText(data: any): string {
  return data.content?.find((b: any) => b.type === 'text')?.text ?? '';
}

function extractToolInput(data: any): any {
  return data.content?.find((b: any) => b.type === 'tool_use')?.input ?? null;
}

// ─── Dimensional extraction tool definition ───────────────────────────────────

const DIMENSIONAL_TOOL = {
  name: 'report_dimensions',
  description: 'Report the Rose Glass dimensional scores for the analyzed text. Only report dimensions you can actually observe. Set to null if insufficient signal.',
  input_schema: {
    type: 'object',
    properties: {
      psi:         { type: ['number', 'null'], description: 'Ψ — Internal consistency (0-1)' },
      rho:         { type: ['number', 'null'], description: 'ρ — Witness density / accumulated wisdom (0-1)' },
      q:           { type: ['number', 'null'], description: 'q — Moral/emotional activation (0-1)' },
      f:           { type: ['number', 'null'], description: 'f — Social belonging architecture (0-1)' },
      distortion:  { type: ['number', 'null'], description: 'D(P) — Distortion value (0+, can exceed 1)' },
      truth_value: { type: ['number', 'null'], description: 'T — Truth value (can be negative)' },
      trs:         { type: ['number', 'null'], description: 'Tᵣ(Q) — Truthwave readiness score (0-1)' },
    },
    required: ['psi', 'rho', 'q', 'f', 'distortion', 'truth_value', 'trs'],
  },
};

// ─── Conversation class ───────────────────────────────────────────────────────

export class RoseGlassConversation {
  async analyze(
    userInput: string,
    conversationHistory: Message[],
    imageData?: { base64: string; mediaType: string }
  ): Promise<{ analysis: string; metaNotes: string; mode: Mode; dimensions: DimensionalScores }> {
    const { mode, content } = detectMode(userInput);
    const actualContent = content || userInput;
    const systemPrompt = getModeSystemPrompt(mode);
    const contextualPrompt = this.buildContextualPrompt(actualContent, conversationHistory, mode);

    // Build user content: image block + text, or just text
    const userContent: any = imageData
      ? [
          { type: 'image', source: { type: 'base64', media_type: imageData.mediaType, data: imageData.base64 } },
          { type: 'text', text: contextualPrompt },
        ]
      : contextualPrompt;

    // In analyze mode: use tool_use to get structured dimensional scores
    // In other modes: plain text response
    let analysis = '';
    let dimensions: DimensionalScores = {
      psi: null, rho: null, q: null, f: null,
      distortion: null, truth_value: null, trs: null,
    };

    if (mode === 'analyze') {
      const data = await callClaude({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: [DIMENSIONAL_TOOL],
        tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: userContent }],
      });

      analysis = extractText(data);
      const toolInput = extractToolInput(data);
      if (toolInput) {
        dimensions = {
          psi:         toolInput.psi         ?? null,
          rho:         toolInput.rho         ?? null,
          q:           toolInput.q           ?? null,
          f:           toolInput.f           ?? null,
          distortion:  toolInput.distortion  ?? null,
          truth_value: toolInput.truth_value ?? null,
          trs:         toolInput.trs         ?? null,
        };
      }
    } else {
      const data = await callClaude({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });
      analysis = extractText(data);
    }

    const metaNotes = mode === 'analyze'
      ? await this.generateMetaNotes(actualContent, analysis, conversationHistory)
      : '';

    return { analysis, metaNotes, mode, dimensions };
  }

  private buildContextualPrompt(userInput: string, history: Message[], mode: Mode): string {
    let prompt = '';

    if (history.length > 0) {
      const contextParts: string[] = [];

      // 1. Dimensional trajectory from analyze exchanges
      const analyzeMessages = history.filter(m => m.role === 'assistant' && m.dimensions && m.mode === 'analyze');
      if (analyzeMessages.length > 0) {
        const latest = analyzeMessages[analyzeMessages.length - 1];
        const d = latest.dimensions!;
        const scores = [
          d.psi !== null ? `Ψ ${d.psi.toFixed(2)}` : null,
          d.rho !== null ? `ρ ${d.rho.toFixed(2)}` : null,
          d.q !== null ? `q ${d.q.toFixed(2)}` : null,
          d.f !== null ? `f ${d.f.toFixed(2)}` : null,
          d.distortion !== null ? `D(P) ${d.distortion.toFixed(2)}` : null,
          d.truth_value !== null ? `T ${d.truth_value.toFixed(2)}` : null,
          d.trs !== null ? `Tᵣ ${d.trs.toFixed(2)}` : null,
        ].filter(Boolean).join(' | ');

        if (analyzeMessages.length > 1) {
          const prev = analyzeMessages[analyzeMessages.length - 2];
          const pd = prev.dimensions!;
          const trajectory = [
            pd.psi !== null && d.psi !== null ? `Ψ ${pd.psi.toFixed(2)}→${d.psi.toFixed(2)}` : null,
            pd.q !== null && d.q !== null ? `q ${pd.q.toFixed(2)}→${d.q.toFixed(2)}` : null,
            pd.distortion !== null && d.distortion !== null ? `D(P) ${pd.distortion.toFixed(2)}→${d.distortion.toFixed(2)}` : null,
          ].filter(Boolean).join(' | ');
          contextParts.push(`**Dimensional State:** ${scores}\n**Trajectory:** ${trajectory}`);
        } else {
          contextParts.push(`**Dimensional State:** ${scores}`);
        }
      }

      // 2. Recent meta-notes (compressed session wisdom)
      const recentMetaNotes = history
        .filter(msg => msg.metaNotes)
        .slice(-2)
        .map(msg => msg.metaNotes)
        .join('\n\n');
      if (recentMetaNotes) {
        contextParts.push(`**Session Meta-Notes:**\n${recentMetaNotes}`);
      }

      // 3. Recent conversation exchanges (last 4 messages for continuity)
      const recentExchanges = history.slice(-4).map(m => {
        const role = m.role === 'user' ? 'User' : `Rose Glass [${m.mode || 'analyze'}]`;
        return `${role}: ${m.content.slice(0, 400)}${m.content.length > 400 ? '...' : ''}`;
      }).join('\n\n');
      if (recentExchanges) {
        contextParts.push(`**Recent Exchanges:**\n${recentExchanges}`);
      }

      if (contextParts.length > 0) {
        prompt += `**SESSION CONTEXT:**\n\n${contextParts.join('\n\n')}\n\n---\n\n`;
      }
    }

    if (mode === 'analyze') {
      prompt += `Analyze the following through the Rose Glass lens. Maintain coherence with the session state above. Provide full dimensional output, then call the report_dimensions tool:\n\n${userInput}`;
    } else if (mode === 'translate') {
      prompt += `The session context above informs your reading. Translate what you see in plain language — what the framework observes, what it means, what matters. No scores, no notation. Speak directly:\n\n${userInput}`;
    } else {
      prompt += `The session context above is your ground. Engage naturally. The lens is on but invisible:\n\n${userInput}`;
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

    const data = await callClaude({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: metaPrompt }],
    });

    return extractText(data);
  }
}
