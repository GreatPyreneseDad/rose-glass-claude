/**
 * Extracts dimensional values from Rose Glass analysis text
 * Looks for patterns like "Ψ = 0.85", "ρ: 0.72", etc.
 */

export interface DimensionalData {
  psi: number | null; // Ψ - Internal consistency
  rho: number | null; // ρ - Witness density
  q: number | null; // q - Emotional/moral activation
  f: number | null; // f - Social belonging
  distortion: number | null; // D(P) - Distortion
  truth_value: number | null; // T - Truth value
  trs: number | null; // Tᵣ(Q) - Truth-recovery signal
}

export function extractDimensionalData(analysisText: string): DimensionalData {
  const result: DimensionalData = {
    psi: null,
    rho: null,
    q: null,
    f: null,
    distortion: null,
    truth_value: null,
    trs: null,
  };

  // Helper to extract number from various patterns
  const extractValue = (text: string, patterns: RegExp[]): number | null => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return null;
  };

  // Patterns for Ψ (psi)
  result.psi = extractValue(analysisText, [
    /Ψ\s*[=:]\s*([\d.]+)/i,
    /psi\s*[=:]\s*([\d.]+)/i,
    /internal consistency\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for ρ (rho)
  result.rho = extractValue(analysisText, [
    /ρ\s*[=:]\s*([\d.]+)/i,
    /rho\s*[=:]\s*([\d.]+)/i,
    /witness density\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for q
  result.q = extractValue(analysisText, [
    /\bq\s*[=:]\s*([\d.]+)/i,
    /emotional activation\s*[=:]\s*([\d.]+)/i,
    /moral activation\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for f
  result.f = extractValue(analysisText, [
    /\bf\s*[=:]\s*([\d.]+)/i,
    /social belonging\s*[=:]\s*([\d.]+)/i,
    /belonging\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for D(P) - Distortion
  result.distortion = extractValue(analysisText, [
    /D\(P\)\s*[=:]\s*([\d.]+)/i,
    /distortion\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for T - Truth value
  result.truth_value = extractValue(analysisText, [
    /\bT\s*[=:]\s*([\d.]+)/i,
    /truth value\s*[=:]\s*([\d.]+)/i,
    /truth\s*[=:]\s*([\d.]+)/i,
  ]);

  // Patterns for Tᵣ(Q) - Truth-recovery signal
  result.trs = extractValue(analysisText, [
    /T[ᵣr]\(Q\)\s*[=:]\s*([\d.]+)/i,
    /truth[- ]recovery signal\s*[=:]\s*([\d.]+)/i,
    /recovery signal\s*[=:]\s*([\d.]+)/i,
  ]);

  return result;
}
