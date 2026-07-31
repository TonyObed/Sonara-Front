import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { createPaymentSession } from "@/lib/payments";
import { ok, unauthorized, handleError } from "@/lib/response";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const { amount, currency = "XOF" } = body;

    if (!amount || amount < 1000) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Montant minimum : 1000 XOF" } },
        { status: 400 }
      );
    }

    // Phase 2: Initier le paiement via l'agrégateur (ex: CinetPay)
    // On génère un ID de transaction unique pour notre DB
    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const session = await createPaymentSession({
      amount,
      currency,
      transactionId,
      customerId: auth.companyId,
      // URL de retour une fois le paiement Wave/OM validé
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=cancel`,
    });

    // Optionnel : Enregistrer la transaction "PENDING" dans la DB
    // await db.transaction.create({ data: { id: transactionId, companyId: auth.companyId, amount, status: "PENDING" } });

    return ok({ paymentUrl: session.paymentUrl, transactionId });
  } catch (err) {
    return handleError(err);
  }
}
