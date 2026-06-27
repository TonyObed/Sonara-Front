// ─────────────────────────────────────────────────────────────────────────────
// Sonara — Hooks React (à destination de l'équipe frontend)
//
// Hooks sans dépendance externe (fetch natif via api-client). Chacun renvoie
// { data, loading, error, refetch }. À utiliser dans des composants "use client".
//
// Exemple :
//   const { data: campaigns, loading } = useCampaigns({ status: "RUNNING" });
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type Campaign,
  type Call,
  type Company,
  type User,
  type CampaignStatus,
  type ApiMeta,
} from "@/lib/api-client";

// ─── HOOK GÉNÉRIQUE ───────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  meta: ApiMeta | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(
  fetcher: () => Promise<{ data: T; meta?: ApiMeta }>,
  deps: unknown[],
  enabled = true
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setMeta(res.meta ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Erreur réseau.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  return { data, meta, loading, error, refetch };
}

// ─── HOOKS MÉTIER ─────────────────────────────────────────────────────────────

/** Utilisateur + entreprise connectés. `error` non nul = non authentifié. */
export function useMe() {
  return useAsync<{ company: Company; user: User }>(() => api.auth.me(), []);
}

/** Liste paginée des campagnes (avec KPIs). */
export function useCampaigns(params?: { page?: number; limit?: number; status?: CampaignStatus }) {
  return useAsync<Campaign[]>(
    () => api.campaigns.list(params),
    [params?.page, params?.limit, params?.status]
  );
}

/** Détail d'une campagne (KPIs complets). */
export function useCampaign(id: string | null | undefined) {
  return useAsync<Campaign & { kpis: Record<string, number> }>(
    () => api.campaigns.get(id as string),
    [id],
    Boolean(id)
  );
}

/** Appels d'une campagne. */
export function useCampaignCalls(campaignId: string | null | undefined) {
  return useAsync<Call[]>(
    () => api.campaigns.calls(campaignId as string),
    [campaignId],
    Boolean(campaignId)
  );
}

/** Détail d'un appel (transcription + résumé). */
export function useCall(id: string | null | undefined) {
  return useAsync<Call>(() => api.calls.get(id as string), [id], Boolean(id));
}

/** Crédit + consommation de l'entreprise (KPIs page d'accueil). */
export function useUsage() {
  return useAsync<{
    credit: { remaining: number; estimatedMinutesRemaining: number };
    campaigns: Record<string, number>;
    calls: { total: number; totalCostFcfa: number };
  }>(() => api.company.usage(), []);
}

// ─── ACTIONS D'AUTHENTIFICATION ───────────────────────────────────────────────

interface AuthActionState {
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Actions login / register / logout avec état de soumission.
 * Les cookies de session sont posés automatiquement par l'API (httpOnly).
 */
export function useAuthActions() {
  const [state, setState] = useState<AuthActionState>({
    submitting: false,
    error: null,
    fieldErrors: {},
  });

  function handleError(e: unknown) {
    if (e instanceof ApiError) {
      const fe: Record<string, string> = {};
      for (const d of e.details ?? []) if (d.field && !fe[d.field]) fe[d.field] = d.message;
      setState({ submitting: false, error: e.message, fieldErrors: fe });
    } else {
      setState({ submitting: false, error: "Erreur réseau.", fieldErrors: {} });
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    setState({ submitting: true, error: null, fieldErrors: {} });
    try {
      const res = await api.auth.login({ email, password });
      setState({ submitting: false, error: null, fieldErrors: {} });
      return res.data;
    } catch (e) {
      handleError(e);
      return null;
    }
  }, []);

  const register = useCallback(
    async (companyName: string, email: string, password: string) => {
      setState({ submitting: true, error: null, fieldErrors: {} });
      try {
        const res = await api.auth.register({ companyName, email, password });
        setState({ submitting: false, error: null, fieldErrors: {} });
        return res.data;
      } catch (e) {
        handleError(e);
        return null;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
  }, []);

  return { ...state, login, register, logout };
}
