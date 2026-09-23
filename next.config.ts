import type { NextConfig } from "next";

const developmentScriptDirectives = process.env.NODE_ENV === "development"
  ? " 'unsafe-eval'"
  : "";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${developmentScriptDirectives};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

// En-têtes de sécurité appliqués à toutes les réponses (VULN-009).
// `unsafe-eval` reste limité au serveur de développement, comme recommandé par
// Next.js. Les styles inline sont encore nécessaires à l'interface actuelle.
const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },                          // anti-clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },                // anti MIME-sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS : ignoré par les navigateurs en HTTP, actif dès le HTTPS (prod)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
