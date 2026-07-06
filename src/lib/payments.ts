// Adaptateur générique pour Mobile Money (Wave, Orange Money, MTN MoMo) via CinetPay.
// (Interface de Phase 2 : à câbler avec les vraies clés API de production)

interface PaymentParams {
    amount: number;
    currency: string;
    transactionId: string;
    customerId: string;
    returnUrl: string;
    cancelUrl: string;
}

export async function createPaymentSession(params: PaymentParams) {
    // Dans une vraie implémentation, on appellerait l'API de CinetPay ou Campay ici
    // ex: await fetch("https://api-checkout.cinetpay.com/v2/payment", { ... })

    console.log("[Payments] Initiating Mobile Money payment session:", params);

    // Mock pour le développement : on renvoie une URL fictive qui simule la page de paiement
    return {
        paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/mock-payment?txn=${params.transactionId}&amount=${params.amount}`,
        status: "CREATED"
    };
}
