// POST /api/auth/invite — Invitation collaborateur (Admin uniquement)
// GET  /api/auth/invite?token= — Valider un token d'invitation
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { InviteSchema } from "@/lib/validation";
import {
  ok,
  created,
  unauthorized,
  forbidden,
  conflict,
  badRequest,
  notFound,
  zodError,
  handleError,
} from "@/lib/response";
import { ZodError } from "zod";

// ─── POST : Générer un lien d'invitation ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    // Seul l'admin peut inviter
    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return forbidden("Seul l'administrateur peut inviter des collaborateurs.");
    }

    const body = await request.json();
    const input = InviteSchema.parse(body);

    // Vérifier la limite d'utilisateurs (max 5 en P1)
    const userCount = await db.user.count({
      where: { companyId: auth.companyId, isActive: true },
    });

    if (userCount >= 5) {
      return forbidden(
        "Limite de 5 utilisateurs atteinte pour le plan actuel. Contactez-nous pour upgrader."
      );
    }

    // Vérifier si l'email est déjà utilisé dans cette entreprise
    const existingUser = await db.user.findFirst({
      where: { companyId: auth.companyId, email: input.email },
    });

    if (existingUser?.isActive) {
      return conflict("Un utilisateur avec cet email existe déjà dans votre compte.");
    }

    // Générer un token UUID unique (valide 48h)
    const inviteToken = uuidv4();
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h

    // Créer ou réutiliser l'utilisateur (re-invite)
    if (existingUser) {
      await db.user.update({
        where: { id: existingUser.id },
        data: { inviteToken, inviteExpiry, role: input.role as "MANAGER" | "VIEWER" },
      });
    } else {
      await db.user.create({
        data: {
          companyId: auth.companyId,
          email: input.email,
          role: input.role as "MANAGER" | "VIEWER",
          inviteToken,
          inviteExpiry,
          isActive: false,
        },
      });
    }

    // Construction du lien d'invitation
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inviteToken}`;

    // TODO Phase 2 : Envoyer l'email via SMTP
    // await sendInviteEmail({ to: input.email, inviteUrl, companyName });

    return created({
      inviteUrl,
      email: input.email,
      role: input.role,
      expiresAt: inviteExpiry.toISOString(),
      message: `Invitation générée. Partagez ce lien avec ${input.email} (valable 48h).`,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}

// ─── GET : Valider un token d'invitation ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return badRequest("Token d'invitation manquant.");

    const user = await db.user.findUnique({
      where: { inviteToken: token },
      include: { company: { select: { name: true, plan: true } } },
    });

    if (!user) return notFound("Token d'invitation");

    if (!user.inviteExpiry || user.inviteExpiry < new Date()) {
      return badRequest("Ce lien d'invitation a expiré. Demandez une nouvelle invitation.");
    }

    if (user.isActive) {
      return badRequest("Cette invitation a déjà été utilisée.");
    }

    return ok({
      email: user.email,
      role: user.role,
      company: user.company,
      expiresAt: user.inviteExpiry?.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
