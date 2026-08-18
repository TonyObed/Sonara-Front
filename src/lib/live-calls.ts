const DEFAULT_LIVE_CALL_MAX_AGE_MINUTES = 25;

/**
 * Un appel de campagne est limité à 20 minutes. Au-delà de cette fenêtre, il
 * ne peut plus être considéré comme "live", même si un webhook de fin a été
 * perdu. La réconciliation conserve la responsabilité de corriger son statut.
 */
export function getLiveCallCutoff(now = Date.now()): Date {
  const configured = Number(process.env.LIVE_CALL_MAX_AGE_MINUTES ?? DEFAULT_LIVE_CALL_MAX_AGE_MINUTES);
  const minutes = Number.isFinite(configured) && configured >= 1 && configured <= 60
    ? configured
    : DEFAULT_LIVE_CALL_MAX_AGE_MINUTES;
  return new Date(now - minutes * 60_000);
}
