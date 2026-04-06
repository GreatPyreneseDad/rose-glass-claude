/**
 * roseglass.app — claude-proxy v4
 * 
 * Passthrough proxy that AUGMENTS the frontend's payload:
 * 1. Calls CERATA bridge on the user's latest message
 * 2. Appends bridge readings to the system prompt
 * 3. Ensures web_search tool is included
 * 4. Handles web search tool_use loop server-side
 * 5. Stores Fibonacci memory after response
 * 6. Passes everything else through untouched
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CERATA_API_URL = Deno.env.get('CERATA_API_URL') || 'https://cerata-nematocysts-production.up.railway.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function bucket(v: number): string {
  if (v < 0.05) return "zero";
  if (v < 0.25) return "low";
  if (v < 0.50) return "moderate";
  if (v < 0.75) return "elevated";
  return "high";
}

// Call Anthropic API
async function callAnthropic(body: any, apiKey: string): Promise<any> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json();
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    // Extract latest user text for bridge perception
    const messages = body.messages || [];
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    let userText = '';
    if (lastUserMsg) {
      if (typeof lastUserMsg.content === 'string') {
        userText = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.content)) {
        const textBlock = lastUserMsg.content.find((b: any) => b.type === 'text');
        userText = textBlock?.text || '';
      }
    }

    // Call CERATA bridge
    let cxReading: any = null;
    let computeSource = 'none';
    if (userText.length > 5) {
      try {
        const bridgeRes = await fetch(`${CERATA_API_URL}/cx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userText, tau: 1.0, lam: 1.0 }),
          signal: AbortSignal.timeout(8000),
        });
        if (bridgeRes.ok) {
          cxReading = await bridgeRes.json();
          if (cxReading?.success) computeSource = 'python-nematocysts';
          else cxReading = null;
        }
      } catch { /* proceed without bridge */ }
    }

    // Augment system prompt with bridge readings
    let systemPrompt = body.system || '';
    if (cxReading) {
      const z = cxReading.zones || {};
      const perception: string[] = [];
      const q = z.q?.A || 0, f = z.f?.A || 0, rho = z.rho?.A || 0, psi = z.psi?.A || 0;
      if (bucket(q) === "elevated" || bucket(q) === "high") perception.push("High emotional activation.");
      else if (bucket(q) === "zero" || bucket(q) === "low") perception.push("Low activation.");
      if (bucket(rho) === "elevated" || bucket(rho) === "high") perception.push("Deep reflective register.");
      else if (bucket(rho) === "zero" || bucket(rho) === "low") perception.push("Reactive register.");
      if (bucket(f) === "elevated" || bucket(f) === "high") perception.push("Strong belonging.");
      else if (bucket(f) === "zero" || bucket(f) === "low") perception.push("Low belonging.");
      if (cxReading.has_dark_spot) perception.push("DARK SPOT detected.");

      systemPrompt += `\n\n---\nROSE GLASS BRIDGE (CERATA v2):\nΨ=${psi.toFixed(3)} ρ=${rho.toFixed(3)} q=${q.toFixed(3)} f=${f.toFixed(3)} C(x)=${(cxReading.Cx||0).toFixed(4)}\n${perception.join(" ")}\nLet readings shape perception. Don't mention numbers unless asked.`;
    }

    // Ensure web_search tool
    const tools = body.tools ? [...body.tools] : [];
    if (!tools.some((t: any) => t.type === 'web_search_20250305' || t.name === 'web_search')) {
      tools.push({ type: 'web_search_20250305', name: 'web_search' });
    }

    // First API call
    const augmentedBody = { ...body, system: systemPrompt, tools };
    let data = await callAnthropic(augmentedBody, anthropicKey);

    // Handle web search tool use loop
    // When Claude uses web search, stop_reason is "end_turn" but content contains
    // server_tool_use + web_search_tool_result blocks mixed with text.
    // The text blocks already contain Claude's response incorporating the search results.
    // BUT if stop_reason is "tool_use" (for non-web tools like report_dimensions),
    // we need to handle that differently.
    
    // Check if response has tool_use blocks that need continuation
    // (web search is handled automatically by the API — results come back inline)
    // The issue is: when Claude calls report_dimensions AND web_search in the same turn,
    // we might get stop_reason: "tool_use" which needs the tool result fed back.
    
    if (data.stop_reason === 'tool_use') {
      // Find tool_use blocks (not server_tool_use which is web search)
      const toolUseBlocks = (data.content || []).filter(
        (b: any) => b.type === 'tool_use'
      );
      
      if (toolUseBlocks.length > 0) {
        // Build tool results for non-web-search tools
        const toolResults = toolUseBlocks.map((block: any) => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(block.input), // echo back the input as result
        }));

        // Continue the conversation with tool results
        const continuationMessages = [
          ...augmentedBody.messages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults },
        ];

        data = await callAnthropic({
          ...augmentedBody,
          messages: continuationMessages,
        }, anthropicKey);
      }
    }

    // Extract ALL text from the response, including text mixed with search results
    const finalText = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text || '')
      .join('');

    // Store Fibonacci memory
    if (cxReading?.success) {
      try {
        const sc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const rho = cxReading.zones?.rho?.A || 0;
        const fibPos = rho > 0.5 ? 8 : rho > 0.25 ? 5 : 3;
        const tier = fibPos === 8 ? "pattern" : fibPos === 5 ? "context" : "event";
        await sc.from('fibonacci_memories').insert({
          fib_position: fibPos, tier,
          content: `${userText.substring(0, 300)} | ${finalText.substring(0, 300)}`,
          psi: cxReading.zones?.psi?.A || 0, rho,
          q: cxReading.zones?.q?.A || 0, f: cxReading.zones?.f?.A || 0,
          coherence: cxReading.Cx || 0,
          psi_bucket: bucket(cxReading.zones?.psi?.A || 0), rho_bucket: bucket(rho),
          q_bucket: bucket(cxReading.zones?.q?.A || 0), f_bucket: bucket(cxReading.zones?.f?.A || 0),
          context_domain: 'roseglass_app',
        });
      } catch { /* silent */ }
    }

    // Return response with bridge readings
    return new Response(JSON.stringify({
      ...data,
      cx: cxReading || undefined,
      compute_source: computeSource,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
