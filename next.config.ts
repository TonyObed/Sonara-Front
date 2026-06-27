import type { NextConfig } from "next";

// En-têtes de sécurité appliqués à toutes les réponses (VULN-009).
// CSP omise volontairement en P1 (risque de casser les scripts Next/vidéo Mux) —
// à durcir en Phase 2 avec une politique testée.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },                    // anti-clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },                // anti MIME-sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS : ignoré par les navigateurs en HTTP, actif dès le HTTPS (prod)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
