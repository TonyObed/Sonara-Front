const DEFAULT_DISPATCH_CONCURRENCY = 2;

function validLimit(value: number | null | undefined, fallback: number): number {
  return Number.isInteger(value) && value != null && value > 0 ? value : fallback;
}

/**
 * Limite effective d'une vague d'appels. Une campagne ne peut jamais dépasser
 * son réglage, le plafond de l'entreprise, ni le garde-fou serveur MVP.
 */
export function getEffectiveCallConcurrency(
  campaignConcurrency: number,
  companyMaxConcurrentCalls?: number | null,
  configuredCap = Number(process.env.CAMPAIGN_MAX_CONCURRENT_CALLS ?? DEFAULT_DISPATCH_CONCURRENCY),
): number {
  const hardCap = validLimit(configuredCap, DEFAULT_DISPATCH_CONCURRENCY);
  const companyCap = validLimit(companyMaxConcurrentCalls, hardCap);
  return Math.max(1, Math.min(validLimit(campaignConcurrency, 1), companyCap, hardCap));
}
