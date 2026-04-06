/**
 * roseglass.app — claude-proxy v3
 * 
 * Passthrough proxy that AUGMENTS the frontend's payload:
 * 1. Calls CERATA bridge on the user's latest message
 * 2. Appends bridge readings to the system prompt
 * 3. Ensures web_search tool is included
 * 4. Stores Fibonacci memory after response
 * 5. Passes everything else through untouched
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
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    // Call CERATA bridge for real perception (non-blocking, with fallback)
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
          if (cxReading?.success) {
            computeSource = 'python-nematocysts';
          } else {
            cxReading = null;
          }
        }
      } catch {
        // Bridge unavailable — proceed without
      }
    }

    // Augment system prompt with bridge readings (append, don't replace)
    let systemPrompt = body.system || '';
    if (cxReading) {
      const z = cxReading.zones || {};
      const q = z.q || { A: 0 };
      const f = z.f || { A: 0 };
      const rho = z.rho || { A: 0 };
      const psi = z.psi || { A: 0 };

      const perception: string[] = [];
      if (bucket(q.A) === "elevated" || bucket(q.A) === "high") perception.push("High emotional activation.");
      else if (bucket(q.A) === "zero" || bucket(q.A) === "low") perception.push("Low activation.");
      if (bucket(rho.A) === "elevated" || bucket(rho.A) === "high") perception.push("Deep reflective register.");
      else if (bucket(rho.A) === "zero" || bucket(rho.A) === "low") perception.push("Reactive register.");
      if (bucket(f.A) === "elevated" || bucket(f.A) === "high") perception.push("Strong belonging signal.");
      else if (bucket(f.A) === "zero" || bucket(f.A) === "low") perception.push("Low belonging.");
      if (cxReading.has_dark_spot) perception.push("DARK SPOT detected.");

      systemPrompt += `\n\n---\nROSE GLASS BRIDGE (live computed via CERATA v2):
Ψ=${psi.A.toFixed(3)} (${bucket(psi.A)}) | ρ=${rho.A.toFixed(3)} (${bucket(rho.A)}) | q=${q.A.toFixed(3)} (${bucket(q.A)}) | f=${f.A.toFixed(3)} (${bucket(f.A)})
C(x)=${(cxReading.Cx || 0).toFixed(4)}
${perception.join(" ")}
Let these readings shape your perception. Don't mention the numbers unless asked.`;
    }

    // Ensure web_search tool is present
    const tools = body.tools ? [...body.tools] : [];
    const hasWebSearch = tools.some((t: any) => 
      t.type === 'web_search_20250305' || t.name === 'web_search'
    );
    if (!hasWebSearch) {
      tools.push({ type: 'web_search_20250305', name: 'web_search' });
    }

    // Build augmented payload (preserve everything from frontend)
    const augmentedBody = {
      ...body,
      system: systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
    };

    // Call Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(augmentedBody),
    });

    const data = await anthropicResponse.json();

    // Store Fibonacci memory (fire-and-forget)
    if (cxReading?.success) {
      try {
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );
        const rho = cxReading.zones?.rho?.A || 0;
        const fibPos = rho > 0.5 ? 8 : rho > 0.25 ? 5 : 3;
        const tierName = fibPos === 8 ? "pattern" : fibPos === 5 ? "context" : "event";
        const assistantText = data.content
          ?.filter((b: any) => b.type === 'text')
          .map((b: any) => b.text || '')
          .join('') || '';

        await serviceClient.from('fibonacci_memories').insert({
          fib_position: fibPos,
          tier: tierName,
          content: `${userText.substring(0, 300)} | ${assistantText.substring(0, 300)}`,
          psi: cxReading.zones?.psi?.A || 0,
          rho,
          q: cxReading.zones?.q?.A || 0,
          f: cxReading.zones?.f?.A || 0,
          coherence: cxReading.Cx || 0,
          psi_bucket: bucket(cxReading.zones?.psi?.A || 0),
          rho_bucket: bucket(rho),
          q_bucket: bucket(cxReading.zones?.q?.A || 0),
          f_bucket: bucket(cxReading.zones?.f?.A || 0),
          context_domain: 'roseglass_app',
        });
      } catch { /* memory insert failed silently */ }
    }

    // Return response with bridge readings attached
    return new Response(JSON.stringify({
      ...data,
      cx: cxReading || undefined,
      compute_source: computeSource,
    }), {
      status: anthropicResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
