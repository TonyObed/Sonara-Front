// POST /api/auth/2fa/setup — Initialise la double authentification
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const company = await db.company.findUnique({
      where: { id: auth.companyId },
    });

    if (!company) {
      return unauthorized("Compte introuvable.");
    }

    // Générer un nouveau secret TOTP
    const secret = generateSecret();

    // Enregistrer le secret temporairement (non encore activé)
    await db.company.update({
      where: { id: company.id },
      data: {
        twoFactorSecret: secret,
        // s'assurer que c'est désactivé jusqu'à validation par code
        twoFactorEnabled: false,
      },
    });

    // Générer l'URI otpauth
    const otpauth = generateURI({
      issuer: "Sonara",
      label: company.email,
      secret,
    });

    // Générer le QR code en Data URL (base64)
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return ok({
      secret,
      qrCodeUrl,
    });
  } catch (error) {
    return handleError(error);
  }
}
