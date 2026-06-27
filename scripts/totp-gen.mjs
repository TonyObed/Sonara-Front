// Helper de test : génère le code TOTP courant pour un secret donné.
//   node scripts/totp-gen.mjs <secret>
import { generateSync } from "otplib";
const secret = process.argv[2];
if (!secret) { console.error("secret requis"); process.exit(1); }
console.log(generateSync({ secret }));
