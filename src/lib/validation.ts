// Schémas de validation Zod — Sonara Backend
import { z } from "zod";

// ─── CONSTANTES PARTAGÉES (déclarées en premier pour éviter les references forward) ─

export const CALL_STATUSES = [
  "INITIATED",
  "RINGING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "VOICEMAIL",
  "NO_ANSWER",
  "TRANSFERRED",
  "BUSY",
] as const;

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "STOPPED",
] as const;

export const CONTACT_STATUSES = [
  "PENDING",
  "CALLING",
  "COMPLETED",
  "FAILED",
  "UNREACHABLE",
  "TRANSFERRED",
  "VOICEMAIL",
  "BLACKLISTED",
] as const;

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (min 2 caractères)").max(100),
  companyName: z.string().min(2, "Nom entreprise requis (min 2 caractères)").max(100),
  email: z.string().email("Email invalide").toLowerCase(),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
});

export const LoginSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export const InviteSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
  role: z.enum(["MANAGER", "VIEWER"], {
    error: () => "Rôle invalide. Choisir MANAGER ou VIEWER",
  }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(20, "Token de réinitialisation invalide"),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
});

export const AcceptInviteSchema = z.object({
  token: z.string().uuid("Token d'invitation invalide"),
  firstName: z.string().min(1, "Prénom requis").max(50),
  lastName: z.string().min(1, "Nom requis").max(50),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
});

// ─── LEADS (capture marketing) ───────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  name: z.string().min(2, "Nom requis").max(120),
  email: z.string().email("Email invalide").toLowerCase(),
  company: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(40).default("landing"),
});

// ─── APPEL DE TEST ──────────────────────────────────────────────────────────

export const TestCallSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone requis"),
  aiVoice: z.string().default("awa_female_ci"),
  aiTemperature: z.number().min(0).max(1).default(0.5),
  // Brief optionnel : si absent, un brief de démonstration est utilisé
  aiBrief: z.string().min(20).max(5000).optional(),
  firstName: z.string().max(50).optional(),
});

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export const CreateCampaignSchema = z.object({
  name: z.string().min(3, "Nom campagne requis (min 3 caractères)").max(100),
  sector: z.string().optional(),
  aiBrief: z
    .string()
    .min(20, "Le brief IA doit décrire l'objectif de l'enquête (min 20 caractères)")
    .max(5000),
  aiVoice: z.string().default("awa_female_ci"),
  aiTemperature: z.number().min(0).max(1).default(0.5),
  // ── Réglages voix ElevenLabs (optionnels) ──
  aiVoiceId: z.string().max(100).optional().nullable(), // voiceId voix clonée
  aiVoiceModel: z.string().max(60).optional(),
  aiStability: z.number().min(0).max(1).optional(),
  aiSimilarity: z.number().min(0).max(1).optional(),
  aiStyle: z.number().min(0).max(1).optional(),
  aiSpeed: z.number().min(0.7).max(1.2).optional(),
  aiSpeakerBoost: z.boolean().optional(),
  maxRetries: z.number().int().min(1).max(3).default(2),
  timeStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format horaire invalide (HH:MM)")
    .default("00:00"),
  timeEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format horaire invalide (HH:MM)")
    .default("23:59"),
  maxDuration: z.number().int().min(60).max(1200).default(480),
  concurrency: z.number().int().min(1).max(50).default(10),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

// Regex numéro Côte d'Ivoire (format international normalisé)
const CI_PHONE_REGEX = /^\+225[0-9]{8,10}$/;

export function normalizePhoneCI(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s\-\.]/g, "");

  // Déjà normalisé
  if (CI_PHONE_REGEX.test(cleaned)) return cleaned;

  // Format local 10 chiffres
  if (/^0[0-9]{9}$/.test(cleaned)) {
    return `+225${cleaned}`;
  }

  // Format sans le 0
  if (/^[0-9]{8,10}$/.test(cleaned)) {
    return `+225${cleaned}`;
  }

  // Format international sans +
  if (/^225[0-9]{8,10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

export const ContactRowSchema = z.object({
  phone: z.string().min(1, "Numéro de téléphone requis"),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  city: z.string().optional().default(""),
  segment: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

// ─── CALLS / FILTERS ─────────────────────────────────────────────────────────

export const CallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(CALL_STATUSES).optional(),
});

export const CampaignsQuerySchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── INFER TYPES ─────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type InviteInput = z.infer<typeof InviteSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
export type ContactRow = z.infer<typeof ContactRowSchema>;
export type CallsQuery = z.infer<typeof CallsQuerySchema>;
export type CampaignsQuery = z.infer<typeof CampaignsQuerySchema>;
