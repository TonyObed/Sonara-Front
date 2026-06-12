import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sonara — Connexion",
  description:
    "Connectez-vous à votre espace Sonara. Pilotez vos campagnes d'enquêtes vocales et suivez vos résultats en temps réel.",
};

export default function LoginPage() {
  return <AuthPage initialMode="login" />;
}
